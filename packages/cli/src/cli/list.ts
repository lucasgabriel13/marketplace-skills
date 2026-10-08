import {
  ARTIFACT_TYPES,
  listLock,
  queryArtifacts,
  type ArtifactType,
  type RegistryArtifact,
} from '@jarvis/jarvis-skills-core'

import { loadContext } from '../context.js'
import { ports } from '../ports.js'
import { TYPE_ICON } from '../theme.js'

interface ListCliOptions {
  type?: string
  category?: string
  search?: string
  installed?: boolean
  json?: boolean
}

function assertType(value: string | undefined): ArtifactType | undefined {
  if (!value) return undefined
  if (!ARTIFACT_TYPES.includes(value as ArtifactType)) {
    console.error(`Tipo inválido: ${value}. Válidos: ${ARTIFACT_TYPES.join(', ')}`)
    process.exit(1)
  }
  return value as ArtifactType
}

function printCatalog(artifacts: RegistryArtifact[]): void {
  if (artifacts.length === 0) {
    console.log('Nenhum artefato encontrado com os filtros informados.')
    return
  }

  for (const type of ARTIFACT_TYPES) {
    const group = artifacts.filter((a) => a.type === type)
    if (group.length === 0) continue
    console.log(`\n${TYPE_ICON[type]} ${type.toUpperCase()} (${group.length})`)
    for (const artifact of group.sort((a, b) => a.name.localeCompare(b.name))) {
      const version = artifact.version ? ` v${artifact.version}` : ''
      console.log(`  ${artifact.name}${version}  ·  ${artifact.category}`)
      console.log(`    ${artifact.description}`)
    }
  }
  console.log('')
}

function printInstalled(): void {
  const cwd = ports.env.cwd()
  const project = listLock(ports, 'project', cwd)
  const global = listLock(ports, 'global', cwd)

  const render = (scope: string, entries: ReturnType<typeof listLock>) => {
    console.log(`\n${scope}:`)
    if (entries.length === 0) {
      console.log('  (nenhum)')
      return
    }
    for (const entry of entries) {
      const version = entry.version ? ` v${entry.version}` : ''
      const method = entry.method === 'symlink' ? ' (symlink)' : ''
      console.log(`  ${TYPE_ICON[entry.type]} ${entry.type}/${entry.name}${version} [${entry.target}]${method} → ${entry.path}`)
    }
  }

  render(`Projeto (${cwd})`, project)
  render('Global (~)', global)
  console.log('')
}

export function runList(options: ListCliOptions): void {
  const { registry } = loadContext()

  if (options.installed) {
    if (options.json) {
      const cwd = ports.env.cwd()
      console.log(
        JSON.stringify(
          { project: listLock(ports, 'project', cwd), global: listLock(ports, 'global', cwd) },
          null,
          2,
        ),
      )
      return
    }
    printInstalled()
    return
  }

  const type = assertType(options.type)
  const artifacts = queryArtifacts(registry, {
    type,
    category: options.category,
    search: options.search,
  })

  if (options.json) {
    console.log(JSON.stringify(artifacts, null, 2))
    return
  }

  printCatalog(artifacts)
}
