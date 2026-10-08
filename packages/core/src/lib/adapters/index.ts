export { nodeEnvAdapter } from './node-env.adapter.js'
export { nodeFileSystemAdapter } from './node-filesystem.adapter.js'
export { nodeLoggerAdapter } from './node-logger.adapter.js'

import type { CorePorts } from '../ports/index.js'

import { nodeEnvAdapter } from './node-env.adapter.js'
import { nodeFileSystemAdapter } from './node-filesystem.adapter.js'
import { nodeLoggerAdapter } from './node-logger.adapter.js'

/**
 * Monta o conjunto de portas com os adapters node padrão. A CLI usa isto para
 * obter um `CorePorts` pronto para uso.
 */
export function createNodePorts(): CorePorts {
  return {
    fs: nodeFileSystemAdapter,
    env: nodeEnvAdapter,
    logger: nodeLoggerAdapter,
  }
}
