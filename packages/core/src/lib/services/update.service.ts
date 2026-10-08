import type { CorePorts } from '../ports/index.js'
import type { ArtifactType, InstallMethod, InstallScope, Registry, TargetId } from '../types.js'

import { findArtifact } from './registry.service.js'
import { listLock } from './lockfile.service.js'

/** Motivo pelo qual um artefato instalado precisa de atualização. */
export type UpdateReason = 'changed' | 'missing-hash'

/** Item do plano de atualização, já com o alvo/método da instalação original. */
export interface UpdateItem {
  type: ArtifactType
  name: string
  category: string
  /** Alvo em que está instalado (a atualização reinstala no mesmo alvo). */
  target: TargetId
  /** Método original (symlinks se atualizam sozinhos e não entram aqui). */
  method: InstallMethod
  /** Hash atual no catálogo (destino da atualização), quando disponível. */
  contentHash?: string
  reason: UpdateReason
}

/** Referência a um artefato instalado (com alvo). */
export interface InstalledRef {
  type: ArtifactType
  name: string
  target: TargetId
}

/** Resultado da análise de atualização de um escopo. */
export interface UpdatePlan {
  /** Precisam ser reinstalados (mudaram no catálogo ou sem hash registrado). */
  toUpdate: UpdateItem[]
  /** Já estão na versão do catálogo (inclui symlinks, sempre atuais). */
  upToDate: InstalledRef[]
  /** Instalados mas que não existem mais no catálogo. */
  orphaned: InstalledRef[]
}

/**
 * Compara os artefatos instalados (lockfile do escopo) com o catálogo atual e
 * determina o que mudou, preservando o alvo de cada instalação. Instalações por
 * symlink são consideradas sempre atualizadas (refletem a origem).
 */
export function planUpdates(
  ports: CorePorts,
  scope: InstallScope,
  cwd: string,
  registry: Registry,
): UpdatePlan {
  const plan: UpdatePlan = { toUpdate: [], upToDate: [], orphaned: [] }

  for (const entry of listLock(ports, scope, cwd)) {
    const ref: InstalledRef = { type: entry.type, name: entry.name, target: entry.target }
    const artifact = findArtifact(registry, entry.type, entry.name)
    if (!artifact) {
      plan.orphaned.push(ref)
      continue
    }

    // Symlinks refletem a origem automaticamente — nada a reinstalar.
    if (entry.method === 'symlink') {
      plan.upToDate.push(ref)
      continue
    }

    if (entry.contentHash && artifact.contentHash && entry.contentHash === artifact.contentHash) {
      plan.upToDate.push(ref)
      continue
    }

    plan.toUpdate.push({
      type: artifact.type,
      name: artifact.name,
      category: artifact.category,
      target: entry.target,
      method: entry.method,
      ...(artifact.contentHash ? { contentHash: artifact.contentHash } : {}),
      reason: entry.contentHash ? 'changed' : 'missing-hash',
    })
  }

  return plan
}
