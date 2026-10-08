import {
  getConfigPath,
  isValidTarget,
  listTargets,
  readConfig,
  resolveActiveMethod,
  resolveActiveTarget,
  setDefaultMethod,
  setDefaultTarget,
  supportedTypes,
  type InstallMethod,
} from '@jarvis/jarvis-skills-core'

import { ports } from '../ports.js'

/** Mostra a config atual, o alvo/método ativos e os alvos disponíveis. */
export function runConfigShow(): void {
  const config = readConfig(ports)
  const activeTarget = resolveActiveTarget(ports)
  const activeMethod = resolveActiveMethod(ports)

  console.log('\nConfiguração jarvis-skills')
  console.log(`  arquivo: ${getConfigPath(ports)}`)
  console.log(`  alvo padrão (config): ${config.defaultTarget ?? '(não definido)'}`)
  console.log(`  método padrão (config): ${config.defaultMethod ?? '(não definido)'}`)
  console.log(`  alvo ATIVO: ${activeTarget}`)
  console.log(`  método ATIVO: ${activeMethod}`)
  runListTargets()
}

/** Lista os alvos disponíveis e os tipos suportados por cada um. */
export function runListTargets(): void {
  console.log('\nAlvos disponíveis:')
  for (const target of listTargets()) {
    const types = supportedTypes(target.id).join(', ')
    console.log(`  ${target.id}  —  ${target.label}`)
    console.log(`    suporta: ${types}`)
  }
  console.log('')
}

/** Define o alvo padrão (persistido na config global). */
export function runConfigSetTarget(id: string): void {
  if (!isValidTarget(id)) {
    const valid = listTargets().map((t) => t.id).join(', ')
    console.error(`Alvo inválido: ${id}. Válidos: ${valid}`)
    process.exit(1)
  }
  setDefaultTarget(ports, id)
  console.log(`✅ Alvo padrão definido: ${id}`)
}

/** Define o método padrão (copy|symlink). */
export function runConfigSetMethod(method: string): void {
  if (method !== 'copy' && method !== 'symlink') {
    console.error(`Método inválido: ${method}. Válidos: copy, symlink`)
    process.exit(1)
  }
  setDefaultMethod(ports, method as InstallMethod)
  console.log(`✅ Método padrão definido: ${method}`)
}
