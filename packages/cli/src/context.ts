import { buildRegistry, loadRegistry, type Registry } from '@jarvis/jarvis-skills-core'

import { getCatalogRoot, ports } from './ports.js'

/** Contexto resolvido da CLI: raiz do catálogo + índice de artefatos. */
export interface CliContext {
  catalogRoot: string
  registry: Registry
}

/**
 * Carrega o contexto lendo o catálogo AO VIVO do disco (scan). Assim, após um
 * `git pull`, novos artefatos aparecem sem ninguém precisar regenerar o
 * `registry.json`. Se o scan falhar por algum motivo, tenta o `registry.json`
 * como fallback. Lança erro com mensagem acionável se nada for encontrado.
 */
export function loadContext(): CliContext {
  const catalogRoot = getCatalogRoot()
  if (!catalogRoot) {
    throw new Error(
      'Catálogo não encontrado. Defina jarvis_SKILLS_CATALOG ou rode a CLI dentro do repositório do marketplace.',
    )
  }

  try {
    return { catalogRoot, registry: buildRegistry(ports, catalogRoot) }
  } catch {
    const registry = loadRegistry(ports, catalogRoot)
    if (!registry) {
      throw new Error('Não foi possível ler o catálogo. Verifique a estrutura em packages/catalog.')
    }
    return { catalogRoot, registry }
  }
}
