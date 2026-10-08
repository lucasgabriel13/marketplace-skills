import {
  findArtifact,
  installArtifact,
  planUpdates,
  type ArtifactType,
  type InstallResult,
  type TargetId,
  type UpdateItem,
} from '@jarvis/jarvis-skills-core'

import { loadContext } from '../context.js'
import { ports } from '../ports.js'
import { TYPE_ICON } from '../theme.js'
import { toInstallable } from './install.js'

interface UpdateCliOptions {
  global?: boolean
  dryRun?: boolean
}

function label(item: { type: ArtifactType; name: string; target: TargetId }): string {
  return `${TYPE_ICON[item.type]} ${item.type}/${item.name} [${item.target}]`
}

export async function runUpdate(names: string[], options: UpdateCliOptions): Promise<void> {
  const context = loadContext()
  const cwd = ports.env.cwd()
  const scope = options.global ? 'global' : 'project'
  const plan = planUpdates(ports, scope, cwd, context.registry)

  // Seleciona o que atualizar; se nomes forem informados, filtra por eles.
  let targets: UpdateItem[] = plan.toUpdate
  if (names.length > 0) {
    const wanted = new Set(names)
    targets = plan.toUpdate.filter((item) => wanted.has(item.name))

    for (const name of names) {
      if (targets.some((t) => t.name === name)) continue
      if (plan.upToDate.some((u) => u.name === name)) {
        console.log(`✓ ${name} já está atualizado`)
      } else if (plan.orphaned.some((o) => o.name === name)) {
        console.log(`⚠️  ${name} não existe mais no catálogo`)
      } else {
        console.log(`⚠️  ${name} não está instalado neste escopo`)
      }
    }
  }

  if (plan.orphaned.length > 0 && names.length === 0) {
    console.log('\n⚠️  Instalados que não existem mais no catálogo (remova manualmente se quiser):')
    for (const item of plan.orphaned) console.log(`  ${label(item)}`)
  }

  if (targets.length === 0) {
    console.log('\n✅ Nada para atualizar. Tudo em dia.\n')
    return
  }

  if (options.dryRun) {
    console.log(`\nSeriam atualizados (${targets.length}) em ${options.global ? 'global (~)' : cwd}:`)
    for (const item of targets) {
      const suffix = item.reason === 'missing-hash' ? ' (sem hash registrado)' : ''
      console.log(`  ${label(item)}${suffix}`)
    }
    console.log('')
    return
  }

  const results: InstallResult[] = []
  for (const item of targets) {
    const artifact = findArtifact(context.registry, item.type, item.name)
    if (!artifact) {
      results.push({ type: item.type, name: item.name, target: item.target, path: '', success: false, error: 'sumiu do catálogo' })
      continue
    }
    results.push(
      await installArtifact(ports, toInstallable(context, artifact), {
        scope,
        target: item.target,
        method: item.method,
        force: true,
        cwd,
      }),
    )
  }

  const ok = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  if (ok.length > 0) {
    console.log(`\n🔄 Atualizado(s) em ${options.global ? 'global (~)' : cwd}:`)
    for (const r of ok) console.log(`  ${r.type}/${r.name} [${r.target}]`)
  }
  if (failed.length > 0) {
    console.log(`\n❌ Falha(s):`)
    for (const r of failed) console.log(`  ${r.type}/${r.name}: ${r.error}`)
  }
  console.log('')
  if (failed.length > 0) process.exit(1)
}
