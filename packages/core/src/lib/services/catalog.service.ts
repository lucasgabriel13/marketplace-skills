import { basename, join, relative } from 'node:path'

import {
  CATALOG_DIRS,
  CATEGORY_FOLDER_PATTERN,
  CATEGORY_METADATA_FILE,
  DEFAULT_CATEGORY_ID,
  SKILL_FILE,
  SOURCE_EXTENSION,
} from '../constants.js'
import type { CorePorts } from '../ports/index.js'
import { ARTIFACT_TYPES, type ArtifactInfo, type ArtifactType, type CategoryInfo } from '../types.js'
import { formatCategoryName, parseFrontmatter, toSlug } from '../utils.js'

function isCategoryFolder(name: string): boolean {
  return CATEGORY_FOLDER_PATTERN.test(name)
}

function extractCategoryId(name: string): string | null {
  return name.match(CATEGORY_FOLDER_PATTERN)?.[1] ?? null
}

/** Lista recursivamente arquivos de uma pasta como caminhos relativos posix. */
function listFilesRecursive(ports: CorePorts, dir: string, root = dir): string[] {
  const out: string[] = []
  let entries
  try {
    entries = ports.fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(ports, abs, root))
    } else if (entry.isFile()) {
      out.push(relative(root, abs).split('\\').join('/'))
    }
  }
  return out
}

function readArtifactFromSkillFolder(
  ports: CorePorts,
  folderPath: string,
  category: string,
): ArtifactInfo | null {
  const skillMd = join(folderPath, SKILL_FILE)
  if (!ports.fs.existsSync(skillMd)) return null
  const content = ports.fs.readFileSync(skillMd, 'utf-8')
  const fm = parseFrontmatter(content)
  const folderName = basename(folderPath)
  return {
    type: 'skill',
    name: fm.name ?? folderName,
    description: fm.description ?? 'Sem descrição',
    category,
    path: folderPath,
    files: listFilesRecursive(ports, folderPath),
    version: fm.version,
    author: fm.author,
  }
}

function readArtifactFromFile(
  ports: CorePorts,
  filePath: string,
  type: ArtifactType,
  category: string,
): ArtifactInfo | null {
  const ext = SOURCE_EXTENSION[type]
  if (!ext) return null
  const fileName = basename(filePath)
  if (!fileName.endsWith(ext)) return null
  const content = ports.fs.readFileSync(filePath, 'utf-8')
  const fm = parseFrontmatter(content)
  const baseName = fileName.slice(0, -ext.length)
  return {
    type,
    name: fm.name ?? baseName,
    description: fm.description ?? 'Sem descrição',
    category,
    path: filePath,
    files: [fileName],
    version: fm.version,
    author: fm.author,
  }
}

function scanTypeEntry(
  ports: CorePorts,
  type: ArtifactType,
  entryPath: string,
  isDir: boolean,
  category: string,
): ArtifactInfo | null {
  if (type === 'skill') {
    return isDir ? readArtifactFromSkillFolder(ports, entryPath, category) : null
  }
  return isDir ? null : readArtifactFromFile(ports, entryPath, type, category)
}

function scanTypeDirectory(ports: CorePorts, type: ArtifactType, typeDir: string): ArtifactInfo[] {
  if (!ports.fs.existsSync(typeDir)) return []
  const out: ArtifactInfo[] = []

  for (const entry of ports.fs.readdirSync(typeDir, { withFileTypes: true })) {
    if (entry.name === CATEGORY_METADATA_FILE) continue
    const abs = join(typeDir, entry.name)

    if (entry.isDirectory() && isCategoryFolder(entry.name)) {
      const category = extractCategoryId(entry.name) ?? DEFAULT_CATEGORY_ID
      for (const child of ports.fs.readdirSync(abs, { withFileTypes: true })) {
        if (child.name === CATEGORY_METADATA_FILE) continue
        const childAbs = join(abs, child.name)
        const artifact = scanTypeEntry(ports, type, childAbs, child.isDirectory(), category)
        if (artifact) out.push(artifact)
      }
    } else {
      const artifact = scanTypeEntry(ports, type, abs, entry.isDirectory(), DEFAULT_CATEGORY_ID)
      if (artifact) out.push(artifact)
    }
  }

  return out
}

/**
 * Percorre o catálogo em disco e retorna todos os artefatos de todos os tipos.
 * Usado pelo gerador de registry e por leituras diretas do catálogo.
 */
export function scanCatalog(ports: CorePorts, catalogRoot: string): ArtifactInfo[] {
  const out: ArtifactInfo[] = []
  for (const type of ARTIFACT_TYPES) {
    const typeDir = join(catalogRoot, CATALOG_DIRS[type])
    out.push(...scanTypeDirectory(ports, type, typeDir))
  }
  return out.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
}

function loadCategoryMetadata(
  ports: CorePorts,
  typeDir: string,
): Record<string, { name?: string; description?: string }> {
  const metaPath = join(typeDir, CATEGORY_METADATA_FILE)
  if (!ports.fs.existsSync(metaPath)) return {}
  try {
    return JSON.parse(ports.fs.readFileSync(metaPath, 'utf-8'))
  } catch {
    return {}
  }
}

/**
 * Descobre categorias de um tipo a partir do disco, aplicando metadados de
 * `_category.json` quando presentes.
 */
export function scanCategories(ports: CorePorts, catalogRoot: string, type: ArtifactType): CategoryInfo[] {
  const typeDir = join(catalogRoot, CATALOG_DIRS[type])
  if (!ports.fs.existsSync(typeDir)) return []
  const metadata = loadCategoryMetadata(ports, typeDir)

  const categories: CategoryInfo[] = []
  for (const entry of ports.fs.readdirSync(typeDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !isCategoryFolder(entry.name)) continue
    const id = extractCategoryId(entry.name)
    if (!id) continue
    const meta = metadata[entry.name] ?? metadata[id] ?? {}
    categories.push({ id, name: meta.name ?? formatCategoryName(id), description: meta.description })
  }
  return categories.sort((a, b) => a.name.localeCompare(b.name))
}

/** Deriva um slug de nome a partir de um nome bruto de artefato. */
export function normalizeArtifactName(raw: string): string {
  return toSlug(raw)
}
