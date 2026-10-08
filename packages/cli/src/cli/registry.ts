import { buildRegistry, writeRegistry } from '@jarvis/jarvis-skills-core'

import { getCatalogRoot, ports } from '../ports.js'

/** Regenera o registry.json a partir do catálogo (atalho para desenvolvimento). */
export function runRegistry(): void {
  const catalogRoot = getCatalogRoot()
  if (!catalogRoot) {
    console.error('Catálogo não encontrado. Defina jarvis_SKILLS_CATALOG.')
    process.exit(1)
  }
  const registry = buildRegistry(ports, catalogRoot)
  writeRegistry(ports, catalogRoot, registry)
  console.log(`✅ registry.json regenerado (${registry.artifacts.length} artefato(s)) em ${catalogRoot}`)
}
