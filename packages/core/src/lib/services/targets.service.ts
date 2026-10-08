import { join } from 'node:path'

import { DEFAULT_TARGET, TARGETS } from '../constants.js'
import type { CorePorts } from '../ports/index.js'
import type { ArtifactType, InstallScope, TargetId, TargetProfile } from '../types.js'
import { sanitizeName } from '../utils.js'

/** Lista os alvos disponíveis, em ordem (padrão primeiro). */
export function listTargets(): TargetProfile[] {
  const ids = Object.keys(TARGETS)
  ids.sort((a, b) => (a === DEFAULT_TARGET ? -1 : b === DEFAULT_TARGET ? 1 : a.localeCompare(b)))
  return ids.map((id) => TARGETS[id]!).filter(Boolean)
}

/** Retorna o perfil de um alvo, ou `undefined` se não existir. */
export function getTarget(id: TargetId): TargetProfile | undefined {
  return TARGETS[id]
}

/** Indica se o id de alvo é conhecido. */
export function isValidTarget(id: string): boolean {
  return id in TARGETS
}

/** Indica se o alvo suporta um tipo de artefato. */
export function isTypeSupported(targetId: TargetId, type: ArtifactType): boolean {
  return Boolean(TARGETS[targetId]?.artifacts[type])
}

/** Tipos suportados por um alvo. */
export function supportedTypes(targetId: TargetId): ArtifactType[] {
  const profile = TARGETS[targetId]
  if (!profile) return []
  return (Object.keys(profile.artifacts) as ArtifactType[]).filter((t) => profile.artifacts[t])
}

/** Resultado da resolução de destino. */
export interface ResolvedDestination {
  /** Diretório base de destino (projeto ou home + dir do alvo). */
  baseDir: string
  /** Caminho final do artefato (pasta para skill, arquivo para os demais). */
  destPath: string
}

/**
 * Resolve o destino de um artefato para um alvo, tipo e escopo. Retorna `null`
 * quando o alvo não suporta aquele tipo.
 */
export function resolveDestination(
  ports: CorePorts,
  targetId: TargetId,
  type: ArtifactType,
  name: string,
  scope: InstallScope,
  cwd: string,
): ResolvedDestination | null {
  const dest = TARGETS[targetId]?.artifacts[type]
  if (!dest) return null

  const baseDir =
    scope === 'global' ? join(ports.env.homedir(), dest.globalDir) : join(cwd, dest.projectDir)
  const safe = sanitizeName(name)
  const leaf = dest.fileExtension ? `${safe}${dest.fileExtension}` : safe
  return { baseDir, destPath: join(baseDir, leaf) }
}
