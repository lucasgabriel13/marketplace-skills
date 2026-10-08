import { dirname, isAbsolute, join, resolve } from 'node:path'

import { CATALOG_DIRS, CATALOG_ENV_VAR, REGISTRY_FILE } from '../constants.js'
import type { CorePorts } from '../ports/index.js'
import { ARTIFACT_TYPES } from '../types.js'

/**
 * Considera um diretório como raiz de catálogo se ele tiver o `registry.json`
 * (export opcional) OU pelo menos uma das pastas de tipo (`skills/`, `agents/`,
 * `prompts/`, `instructions/`). Assim a CLI localiza o catálogo mesmo quando o
 * `registry.json` não está presente (o padrão, já que a CLI lê ao vivo).
 */
function isCatalogDir(ports: CorePorts, candidate: string): boolean {
  if (ports.fs.existsSync(join(candidate, REGISTRY_FILE))) return true
  return ARTIFACT_TYPES.some((type) => ports.fs.existsSync(join(candidate, CATALOG_DIRS[type])))
}

/**
 * Resolve a raiz do catálogo local (pasta que contém as subpastas de tipos e,
 * opcionalmente, `registry.json`). A ordem de resolução é:
 *
 * 1. Variável de ambiente `JARVIS_SKILLS_CATALOG` (caminho explícito).
 * 2. Subindo a árvore a partir de `hintDir` (tipicamente a localização do
 *    módulo da CLI), procurando por `packages/catalog` ou por um diretório que
 *    seja um catálogo.
 *
 * Isso é o que permite rodar a CLI em um terminal e instalar em um projeto
 * aberto em outro: o catálogo é encontrado pela localização da própria CLI,
 * independente do `cwd` de onde ela é chamada.
 */
export function resolveCatalogRoot(ports: CorePorts, hintDir: string): string | null {
  const override = ports.env.getEnv(CATALOG_ENV_VAR)
  if (override) {
    const abs = isAbsolute(override) ? override : resolve(ports.env.cwd(), override)
    if (isCatalogDir(ports, abs)) return abs
  }

  let current = resolve(hintDir)
  // Sobe no máximo 8 níveis procurando o catálogo.
  for (let depth = 0; depth < 8; depth++) {
    const candidates = [join(current, 'packages', 'catalog'), join(current, 'catalog'), current]
    for (const candidate of candidates) {
      if (isCatalogDir(ports, candidate)) return candidate
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }

  return null
}
