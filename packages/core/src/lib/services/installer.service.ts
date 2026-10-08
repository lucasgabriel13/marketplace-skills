import { dirname } from 'node:path'

import type { CorePorts } from '../ports/index.js'
import type {
  ArtifactType,
  InstallMethod,
  InstallOptions,
  InstallResult,
  InstallScope,
  RemoveResult,
  TargetId,
} from '../types.js'
import { isPathSafe } from '../utils.js'

import { addToLock, removeFromLock } from './lockfile.service.js'
import { getTarget, resolveDestination } from './targets.service.js'

/** Artefato pronto para instalação, com caminho de origem resolvido. */
export interface InstallableArtifact {
  type: ArtifactType
  name: string
  category: string
  version?: string
  /** Hash de conteúdo atual do artefato no catálogo (para detecção de update). */
  contentHash?: string
  /** Caminho absoluto de origem (pasta para skill, arquivo para os demais). */
  sourcePath: string
}

/**
 * Caminho final de destino de um artefato para um alvo/escopo, ou `null` quando
 * o alvo não suporta o tipo.
 */
export function resolveDestinationPath(
  ports: CorePorts,
  target: TargetId,
  type: ArtifactType,
  name: string,
  scope: InstallScope,
  cwd: string,
): string | null {
  return resolveDestination(ports, target, type, name, scope, cwd)?.destPath ?? null
}

async function linkOrCopy(
  ports: CorePorts,
  method: InstallMethod,
  source: string,
  destPath: string,
  isDir: boolean,
): Promise<void> {
  await ports.fs.mkdir(dirname(destPath), { recursive: true })
  if (method === 'symlink') {
    const type = ports.env.platform() === 'win32' ? (isDir ? 'junction' : 'file') : undefined
    await ports.fs.symlink(source, destPath, type)
    return
  }
  await ports.fs.cp(source, destPath, { recursive: true })
}

/**
 * Instala um artefato no destino do alvo escolhido, no escopo e método dados.
 * Skills são instaladas como pasta; os demais como arquivo único. Quando o alvo
 * não suporta o tipo, retorna um resultado `unsupported` (não é falha).
 */
export async function installArtifact(
  ports: CorePorts,
  artifact: InstallableArtifact,
  options: InstallOptions,
): Promise<InstallResult> {
  const cwd = options.cwd ?? ports.env.cwd()
  const base: InstallResult = {
    type: artifact.type,
    name: artifact.name,
    target: options.target,
    path: '',
    success: false,
  }

  const dest = resolveDestination(ports, options.target, artifact.type, artifact.name, options.scope, cwd)
  if (!dest) {
    const label = getTarget(options.target)?.label ?? options.target
    return { ...base, unsupported: true, error: `${label} não suporta o tipo "${artifact.type}"` }
  }

  const result: InstallResult = { ...base, path: dest.destPath }

  if (!isPathSafe(dest.baseDir, dest.destPath)) {
    return { ...result, error: 'Destino inválido (possível path traversal)' }
  }
  if (!ports.fs.existsSync(artifact.sourcePath)) {
    return { ...result, error: `Origem não encontrada: ${artifact.sourcePath}` }
  }

  const alreadyInstalled = ports.fs.existsSync(dest.destPath)
  if (alreadyInstalled && !options.force) {
    return { ...result, success: true, skipped: true }
  }

  try {
    if (alreadyInstalled) {
      await ports.fs.rm(dest.destPath, { recursive: true, force: true })
    }
    await linkOrCopy(ports, options.method, artifact.sourcePath, dest.destPath, artifact.type === 'skill')

    addToLock(ports, options.scope, cwd, {
      type: artifact.type,
      name: artifact.name,
      category: artifact.category,
      scope: options.scope,
      target: options.target,
      method: options.method,
      path: dest.destPath,
      ...(artifact.version ? { version: artifact.version } : {}),
      ...(artifact.contentHash ? { contentHash: artifact.contentHash } : {}),
    })

    return { ...result, success: true }
  } catch (error) {
    return { ...result, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Remove um artefato instalado para um alvo/escopo. */
export async function removeArtifact(
  ports: CorePorts,
  type: ArtifactType,
  name: string,
  options: { scope: InstallScope; target: TargetId; cwd?: string },
): Promise<RemoveResult> {
  const cwd = options.cwd ?? ports.env.cwd()
  const result: RemoveResult = { type, name, target: options.target, success: false }

  const dest = resolveDestination(ports, options.target, type, name, options.scope, cwd)
  if (!dest) {
    const label = getTarget(options.target)?.label ?? options.target
    return { ...result, error: `${label} não suporta o tipo "${type}"` }
  }

  if (!isPathSafe(dest.baseDir, dest.destPath)) {
    return { ...result, error: 'Caminho de remoção inválido' }
  }

  try {
    if (!ports.fs.existsSync(dest.destPath)) {
      removeFromLock(ports, options.scope, cwd, options.target, type, name)
      return { ...result, error: 'Artefato não está instalado' }
    }
    await ports.fs.rm(dest.destPath, { recursive: true, force: true })
    removeFromLock(ports, options.scope, cwd, options.target, type, name)
    return { ...result, success: true }
  } catch (error) {
    return { ...result, error: error instanceof Error ? error.message : String(error) }
  }
}

/** Indica se um artefato já está instalado no destino do alvo/escopo. */
export function isInstalled(
  ports: CorePorts,
  target: TargetId,
  type: ArtifactType,
  name: string,
  scope: InstallScope,
  cwd: string,
): boolean {
  const path = resolveDestinationPath(ports, target, type, name, scope, cwd)
  return path ? ports.fs.existsSync(path) : false
}
