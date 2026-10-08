import {
  ARTIFACT_TYPES,
  findArtifactsByName,
  getTarget,
  removeArtifact,
  type ArtifactType,
  type RemoveResult,
} from '@jarvis/jarvis-skills-core'

import { resolveTarget } from '../active.js'
import { loadContext } from '../context.js'
import { ports } from '../ports.js'

interface RemoveCliOptions {
  type?: string
  target?: string
  global?: boolean
}

export async function runRemove(names: string[], options: RemoveCliOptions): Promise<void> {
  const { registry } = loadContext()

  if (names.length === 0) {
    console.error('Informe ao menos um artefato. Ex.: jarvis-skills remove conventional-commits')
    process.exit(1)
  }

  let type: ArtifactType | undefined
  if (options.type) {
    if (!ARTIFACT_TYPES.includes(options.type as ArtifactType)) {
      console.error(`Tipo inválido: ${options.type}. Válidos: ${ARTIFACT_TYPES.join(', ')}`)
      process.exit(1)
    }
    type = options.type as ArtifactType
  }

  const cwd = ports.env.cwd()
  const scope = options.global ? 'global' : 'project'
  const target = resolveTarget(options.target)
  const results: RemoveResult[] = []

  for (const name of names) {
    let resolvedType = type
    if (!resolvedType) {
      const matches = findArtifactsByName(registry, name)
      if (matches.length > 1) {
        const types = matches.map((m) => m.type).join(', ')
        results.push({ type: 'skill', name, target, success: false, error: `existe em vários tipos (${types}); use --type` })
        continue
      }
      resolvedType = matches[0]?.type
    }
    if (!resolvedType) {
      results.push({ type: 'skill', name, target, success: false, error: 'tipo não identificado; use --type' })
      continue
    }
    results.push(await removeArtifact(ports, resolvedType, name, { scope, target, cwd }))
  }

  const label = getTarget(target)?.label ?? target
  const ok = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)
  if (ok.length > 0) {
    console.log(`\n🗑️  Removido(s) de ${label} em ${options.global ? 'global (~)' : cwd}:`)
    for (const r of ok) console.log(`  ${r.type}/${r.name}`)
  }
  if (failed.length > 0) {
    console.log(`\n❌ Não removido(s):`)
    for (const r of failed) console.log(`  ${r.type}/${r.name}: ${r.error}`)
  }
  console.log('')
  if (failed.length > 0) process.exit(1)
}
