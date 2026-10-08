import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createNodePorts, resolveCatalogRoot, type CorePorts } from '@jarvis/jarvis-skills-core'

/** Portas concretas (adapters node) compartilhadas por toda a CLI. */
export const ports: CorePorts = createNodePorts()

const moduleDir = dirname(fileURLToPath(import.meta.url))

/**
 * Raiz do catálogo, resolvida a partir da localização da própria CLI (ou da
 * env `jarvis_SKILLS_CATALOG`). É isso que permite rodar a CLI de qualquer
 * diretório e ainda encontrar o catálogo.
 */
export function getCatalogRoot(): string | null {
  return resolveCatalogRoot(ports, moduleDir)
}
