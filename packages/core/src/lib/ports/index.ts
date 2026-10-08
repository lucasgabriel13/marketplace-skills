export type { DirEntryLike, FileSystemPort } from './filesystem.port.js'
export type { EnvPort } from './env.port.js'
export type { LoggerPort } from './logger.port.js'

import type { EnvPort } from './env.port.js'
import type { FileSystemPort } from './filesystem.port.js'
import type { LoggerPort } from './logger.port.js'

/**
 * Agrega todas as portas de infraestrutura exigidas pelos serviços do core.
 * A aplicação (CLI) injeta os adapters concretos.
 */
export interface CorePorts {
  fs: FileSystemPort
  env: EnvPort
  logger: LoggerPort
}
