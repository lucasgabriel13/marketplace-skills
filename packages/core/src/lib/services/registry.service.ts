import { join, relative } from 'node:path'

import { REGISTRY_FILE, REGISTRY_VERSION } from '../constants.js'
import type { CorePorts } from '../ports/index.js'
import {
  ARTIFACT_TYPES,
  type ArtifactType,
  type CategoryInfo,
  type Registry,
  type RegistryArtifact,
} from '../types.js'
import { computeContentHash } from '../utils.js'

import { scanCatalog, scanCategories } from './catalog.service.js'

function toPosix(p: string): string {
  return p.split('\\').join('/')
}

/**
 * Constrói o objeto de registry percorrendo o catálogo em disco, calculando
 * caminhos relativos e hash de conteúdo de cada artefato.
 */
export function buildRegistry(ports: CorePorts, catalogRoot: string): Registry {
  const artifacts = scanCatalog(ports, catalogRoot)

  const registryArtifacts: RegistryArtifact[] = artifacts.map((artifact) => {
    const relPath = toPosix(relative(catalogRoot, artifact.path))
    const fileContents = new Map<string, string>()
    for (const file of artifact.files) {
      const abs = artifact.files.length === 1 && artifact.type !== 'skill' ? artifact.path : join(artifact.path, file)
      try {
        fileContents.set(file, ports.fs.readFileSync(abs, 'utf-8'))
      } catch {
        // ignora arquivos ilegíveis no cálculo do hash
      }
    }

    return {
      type: artifact.type,
      name: artifact.name,
      description: artifact.description,
      category: artifact.category,
      path: relPath,
      files: artifact.files,
      ...(artifact.version ? { version: artifact.version } : {}),
      ...(artifact.author ? { author: artifact.author } : {}),
      contentHash: computeContentHash(fileContents),
    }
  })

  const categories = {} as Registry['categories']
  for (const type of ARTIFACT_TYPES) {
    const list = scanCategories(ports, catalogRoot, type)
    const map: Record<string, { name: string; description?: string }> = {}
    for (const cat of list) {
      map[cat.id] = { name: cat.name, ...(cat.description ? { description: cat.description } : {}) }
    }
    categories[type] = map
  }

  return {
    version: REGISTRY_VERSION,
    generatedAt: new Date().toISOString(),
    categories,
    artifacts: registryArtifacts,
  }
}

/** Serializa e grava o registry na raiz do catálogo. */
export function writeRegistry(ports: CorePorts, catalogRoot: string, registry: Registry): void {
  const outPath = join(catalogRoot, REGISTRY_FILE)
  ports.fs.writeFileSync(outPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf-8')
}

/** Lê o `registry.json` da raiz do catálogo, ou `null` se ausente/inválido. */
export function loadRegistry(ports: CorePorts, catalogRoot: string): Registry | null {
  const regPath = join(catalogRoot, REGISTRY_FILE)
  if (!ports.fs.existsSync(regPath)) return null
  try {
    return JSON.parse(ports.fs.readFileSync(regPath, 'utf-8')) as Registry
  } catch {
    return null
  }
}

/** Filtro opcional para consultas ao registry. */
export interface ArtifactQuery {
  type?: ArtifactType
  category?: string
  search?: string
}

/** Retorna artefatos do registry aplicando um filtro opcional. */
export function queryArtifacts(registry: Registry, query: ArtifactQuery = {}): RegistryArtifact[] {
  const term = query.search?.toLowerCase().trim()
  return registry.artifacts.filter((artifact) => {
    if (query.type && artifact.type !== query.type) return false
    if (query.category && artifact.category !== query.category) return false
    if (term) {
      const haystack = `${artifact.name} ${artifact.description} ${artifact.category}`.toLowerCase()
      if (!haystack.includes(term)) return false
    }
    return true
  })
}

/** Busca um artefato por tipo e nome. */
export function findArtifact(
  registry: Registry,
  type: ArtifactType,
  name: string,
): RegistryArtifact | undefined {
  return registry.artifacts.find((a) => a.type === type && a.name === name)
}

/** Busca artefatos por nome em todos os tipos (para o comando por nome). */
export function findArtifactsByName(registry: Registry, name: string): RegistryArtifact[] {
  return registry.artifacts.filter((a) => a.name === name)
}

/** Lista as categorias de um tipo a partir do registry já carregado. */
export function categoriesFromRegistry(registry: Registry, type: ArtifactType): CategoryInfo[] {
  const map = registry.categories[type] ?? {}
  return Object.entries(map)
    .map(([id, meta]) => ({ id, name: meta.name, description: meta.description }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Resolve o caminho absoluto de origem de um artefato do registry. */
export function resolveArtifactSource(catalogRoot: string, artifact: RegistryArtifact): string {
  return join(catalogRoot, artifact.path)
}
