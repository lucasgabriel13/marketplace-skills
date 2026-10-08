import { join } from 'node:path'

import { CONFIG_DIR, CONFIG_FILE, DEFAULT_TARGET, TARGET_ENV_VAR } from '../constants.js'
import type { CorePorts } from '../ports/index.js'
import type { InstallMethod, TargetId } from '../types.js'

import { isValidTarget } from './targets.service.js'

/** Configuração global persistida do jarvis-skills. */
export interface JarvisConfig {
  /** Alvo (LLM) padrão. */
  defaultTarget?: TargetId
  /** Método de instalação padrão. */
  defaultMethod?: InstallMethod
}

/** Caminho do diretório de config global. */
export function getConfigDir(ports: CorePorts): string {
  return join(ports.env.homedir(), CONFIG_DIR)
}

/** Caminho do arquivo de config global. */
export function getConfigPath(ports: CorePorts): string {
  return join(getConfigDir(ports), CONFIG_FILE)
}

/** Lê a config global, retornando `{}` se ausente/ inválida. */
export function readConfig(ports: CorePorts): JarvisConfig {
  const path = getConfigPath(ports)
  if (!ports.fs.existsSync(path)) return {}
  try {
    return JSON.parse(ports.fs.readFileSync(path, 'utf-8')) as JarvisConfig
  } catch {
    return {}
  }
}

/** Grava a config global (criando o diretório se necessário). */
export function writeConfig(ports: CorePorts, config: JarvisConfig): void {
  const dir = getConfigDir(ports)
  if (!ports.fs.existsSync(dir)) ports.fs.mkdirSync(dir, { recursive: true })
  ports.fs.writeFileSync(getConfigPath(ports), `${JSON.stringify(config, null, 2)}\n`, 'utf-8')
}

/** Define e persiste o alvo padrão. */
export function setDefaultTarget(ports: CorePorts, target: TargetId): void {
  writeConfig(ports, { ...readConfig(ports), defaultTarget: target })
}

/** Define e persiste o método padrão. */
export function setDefaultMethod(ports: CorePorts, method: InstallMethod): void {
  writeConfig(ports, { ...readConfig(ports), defaultMethod: method })
}

/**
 * Resolve o alvo ativo, na ordem: `override` (flag) → env `JARVIS_SKILLS_TARGET`
 * → config global → `DEFAULT_TARGET`. Ignora valores inválidos.
 */
export function resolveActiveTarget(ports: CorePorts, override?: string): TargetId {
  const candidates = [override, ports.env.getEnv(TARGET_ENV_VAR), readConfig(ports).defaultTarget]
  for (const candidate of candidates) {
    if (candidate && isValidTarget(candidate)) return candidate
  }
  return DEFAULT_TARGET
}

/** Resolve o método ativo: `override` → config → `copy`. */
export function resolveActiveMethod(ports: CorePorts, override?: InstallMethod): InstallMethod {
  if (override) return override
  return readConfig(ports).defaultMethod ?? 'copy'
}
