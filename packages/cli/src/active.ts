import {
  isValidTarget,
  listTargets,
  resolveActiveMethod,
  resolveActiveTarget,
  type InstallMethod,
  type TargetId,
} from '@jarvis/jarvis-skills-core'

import { ports } from './ports.js'

/**
 * Resolve o alvo ativo a partir de uma flag opcional, validando-a. Encerra o
 * processo com mensagem clara se a flag indicar um alvo inexistente.
 */
export function resolveTarget(flag?: string): TargetId {
  if (flag && !isValidTarget(flag)) {
    const valid = listTargets()
      .map((t) => t.id)
      .join(', ')
    console.error(`Alvo inválido: ${flag}. Válidos: ${valid}`)
    process.exit(1)
  }
  return resolveActiveTarget(ports, flag)
}

/** Resolve o método ativo (copy por padrão, symlink se a flag for passada). */
export function resolveMethod(symlink?: boolean): InstallMethod {
  return resolveActiveMethod(ports, symlink ? 'symlink' : undefined)
}
