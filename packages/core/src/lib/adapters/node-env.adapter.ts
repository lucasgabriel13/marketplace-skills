import { homedir, platform } from 'node:os'

import type { EnvPort } from '../ports/env.port.js'

/** Adapter de ambiente baseado em `node:os` e `process`. */
export const nodeEnvAdapter: EnvPort = {
  homedir: () => homedir(),
  cwd: () => process.cwd(),
  getEnv: (name) => process.env[name],
  platform: () => platform(),
}
