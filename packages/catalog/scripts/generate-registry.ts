#!/usr/bin/env tsx
/**
 * Gera o `registry.json` a partir do conteúdo do catálogo em disco.
 * Executar: `npm run generate:registry`
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildRegistry, createNodePorts, writeRegistry } from '@jarvis/jarvis-skills-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const catalogRoot = join(__dirname, '..')

const ports = createNodePorts()
const registry = buildRegistry(ports, catalogRoot)
writeRegistry(ports, catalogRoot, registry)

const byType = registry.artifacts.reduce<Record<string, number>>((acc, artifact) => {
  acc[artifact.type] = (acc[artifact.type] ?? 0) + 1
  return acc
}, {})

console.log('✅ registry.json gerado')
console.log(`   Total: ${registry.artifacts.length} artefato(s)`)
for (const [type, count] of Object.entries(byType)) {
  console.log(`   • ${type}: ${count}`)
}
console.log(`   📍 ${join(catalogRoot, 'registry.json')}`)
