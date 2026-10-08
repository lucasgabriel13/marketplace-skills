import { join } from 'node:path'

import { LOCK_FILE, LOCK_FILE_VERSION } from '../constants.js'
import type { CorePorts } from '../ports/index.js'
import type { ArtifactType, InstallScope, LockEntry, LockFile, TargetId } from '../types.js'

function emptyLock(): LockFile {
  return { version: LOCK_FILE_VERSION, artifacts: {} }
}

function lockKey(target: TargetId, type: ArtifactType, name: string): string {
  return `${target}:${type}:${name}`
}

/**
 * Resolve o diretório base do lockfile: o diretório de projeto (cwd) para
 * escopo `project`, ou o home do usuário para escopo `global`.
 */
export function getLockDir(ports: CorePorts, scope: InstallScope, cwd: string): string {
  return scope === 'global' ? ports.env.homedir() : cwd
}

/** Caminho absoluto do lockfile para um escopo. */
export function getLockPath(ports: CorePorts, scope: InstallScope, cwd: string): string {
  return join(getLockDir(ports, scope, cwd), LOCK_FILE)
}

/** Lê o lockfile de um escopo, retornando um vazio se ausente/ inválido. */
export function readLock(ports: CorePorts, scope: InstallScope, cwd: string): LockFile {
  const path = getLockPath(ports, scope, cwd)
  if (!ports.fs.existsSync(path)) return emptyLock()
  try {
    const parsed = JSON.parse(ports.fs.readFileSync(path, 'utf-8')) as LockFile
    if (!parsed.artifacts) return emptyLock()
    return parsed
  } catch {
    return emptyLock()
  }
}

/** Grava o lockfile de um escopo. */
export function writeLock(ports: CorePorts, scope: InstallScope, cwd: string, lock: LockFile): void {
  const path = getLockPath(ports, scope, cwd)
  ports.fs.writeFileSync(path, `${JSON.stringify(lock, null, 2)}\n`, 'utf-8')
}

/** Adiciona/atualiza uma entrada no lockfile. */
export function addToLock(
  ports: CorePorts,
  scope: InstallScope,
  cwd: string,
  entry: Omit<LockEntry, 'installedAt' | 'updatedAt'>,
): void {
  const lock = readLock(ports, scope, cwd)
  const key = lockKey(entry.target, entry.type, entry.name)
  const now = new Date().toISOString()
  const existing = lock.artifacts[key]
  lock.artifacts[key] = {
    ...entry,
    installedAt: existing?.installedAt ?? now,
    updatedAt: now,
  }
  writeLock(ports, scope, cwd, lock)
}

/** Remove uma entrada do lockfile. */
export function removeFromLock(
  ports: CorePorts,
  scope: InstallScope,
  cwd: string,
  target: TargetId,
  type: ArtifactType,
  name: string,
): void {
  const lock = readLock(ports, scope, cwd)
  delete lock.artifacts[lockKey(target, type, name)]
  writeLock(ports, scope, cwd, lock)
}

/** Lista as entradas do lockfile de um escopo. */
export function listLock(ports: CorePorts, scope: InstallScope, cwd: string): LockEntry[] {
  return Object.values(readLock(ports, scope, cwd).artifacts)
}

/** Recupera uma entrada específica do lockfile. */
export function getLockEntry(
  ports: CorePorts,
  scope: InstallScope,
  cwd: string,
  target: TargetId,
  type: ArtifactType,
  name: string,
): LockEntry | undefined {
  return readLock(ports, scope, cwd).artifacts[lockKey(target, type, name)]
}
