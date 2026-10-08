import {
  ARTIFACT_TYPES,
  findArtifact,
  findArtifactsByName,
  getTarget,
  installArtifact,
  resolveArtifactSource,
  type ArtifactType,
  type InstallableArtifact,
  type InstallResult,
  type RegistryArtifact,
  type TargetId,
} from '@jarvis/jarvis-skills-core'

import { resolveMethod, resolveTarget } from '../active.js'
import { loadContext, type CliContext } from '../context.js'
import { ports } from '../ports.js'

interface InstallCliOptions {
  type?: string
  target?: string
  symlink?: boolean
  global?: boolean
  force?: boolean
}

/** Converte um artefato do registry num artefato instalável (com origem). */
export function toInstallable(context: CliContext, artifact: RegistryArtifact): InstallableArtifact {
  return {
    type: artifact.type,
    name: artifact.name,
    category: artifact.category,
    ...(artifact.version ? { version: artifact.version } : {}),
    ...(artifact.contentHash ? { contentHash: artifact.contentHash } : {}),
    sourcePath: resolveArtifactSource(context.catalogRoot, artifact),
  }
}

/**
 * Resolve um nome (com tipo opcional) para um artefato do registry, tratando
 * ambiguidade quando o mesmo nome existe em mais de um tipo.
 */
function resolveOne(
  context: CliContext,
  name: string,
  type: ArtifactType | undefined,
): RegistryArtifact | { error: string } {
  if (type) {
    const found = findArtifact(context.registry, type, name)
    return found ?? { error: `"${name}" (${type}) não encontrado no catálogo` }
  }
  const matches = findArtifactsByName(context.registry, name)
  if (matches.length === 0) return { error: `"${name}" não encontrado no catálogo` }
  if (matches.length > 1) {
    const types = matches.map((m) => m.type).join(', ')
    return { error: `"${name}" existe em vários tipos (${types}); use --type <tipo>` }
  }
  return matches[0]!
}

function printResults(results: InstallResult[], cwd: string, global: boolean, target: TargetId): void {
  const ok = results.filter((r) => r.success && !r.skipped)
  const skipped = results.filter((r) => r.skipped)
  const unsupported = results.filter((r) => r.unsupported)
  const failed = results.filter((r) => !r.success && !r.unsupported)
  const scope = global ? 'global (~)' : cwd
  const label = getTarget(target)?.label ?? target

  if (ok.length > 0) {
    console.log(`\n✅ Instalado(s) para ${label} em ${scope}:`)
    for (const r of ok) console.log(`  ${r.type}/${r.name} → ${r.path}`)
  }
  if (skipped.length > 0) {
    console.log(`\nℹ️  Já instalado(s) (use --force para sobrescrever):`)
    for (const r of skipped) console.log(`  ${r.type}/${r.name}`)
  }
  if (unsupported.length > 0) {
    console.log(`\n⚠️  Não suportado(s) por ${label}:`)
    for (const r of unsupported) console.log(`  ${r.type}/${r.name}`)
  }
  if (failed.length > 0) {
    console.log(`\n❌ Falha(s):`)
    for (const r of failed) console.log(`  ${r.type}/${r.name}: ${r.error}`)
  }
  console.log('')
}

export async function runInstall(names: string[], options: InstallCliOptions): Promise<void> {
  const context = loadContext()

  if (names.length === 0) {
    console.error('Informe ao menos um artefato. Ex.: jarvis-skills install conventional-commits')
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
  const method = resolveMethod(options.symlink)
  const results: InstallResult[] = []

  for (const name of names) {
    const resolved = resolveOne(context, name, type)
    if ('error' in resolved) {
      results.push({ type: type ?? 'skill', name, target, path: '', success: false, error: resolved.error })
      continue
    }
    const result = await installArtifact(ports, toInstallable(context, resolved), {
      scope,
      target,
      method,
      force: options.force ?? false,
      cwd,
    })
    results.push(result)
  }

  printResults(results, cwd, options.global ?? false, target)
  // Falha de execução derruba o exit; "não suportado" é só aviso.
  if (results.some((r) => !r.success && !r.unsupported)) process.exit(1)
}
