import { createHash } from 'node:crypto'

import { SLUG_PATTERN } from './constants.js'

/** Converte um texto arbitrário em um slug minúsculo com hífens. */
export function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Indica se um nome já é um slug válido. */
export function isSlug(value: string): boolean {
  return SLUG_PATTERN.test(value)
}

/**
 * Sanitiza um nome para uso seguro como componente de caminho, evitando
 * travessia de diretórios. Retorna string vazia se nada sobrar.
 */
export function sanitizeName(name: string): string {
  const base = name.replace(/[/\\]/g, '').replace(/\.\.+/g, '')
  return isSlug(base) ? base : toSlug(base)
}

/** Formata um id de categoria (`code-review`) como título (`Code Review`). */
export function formatCategoryName(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Garante que `target` está contido em `base` (proteção contra path traversal).
 */
export function isPathSafe(base: string, target: string): boolean {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return target === base || target.startsWith(normalizedBase)
}

/** Frontmatter YAML mínimo extraído de um artefato. */
export interface ParsedFrontmatter {
  name?: string
  description?: string
  version?: string
  author?: string
}

/**
 * Faz o parse simples do frontmatter YAML no topo de um arquivo markdown.
 * Suporta os campos usados pelos artefatos (name, description, version, author,
 * e `metadata:` aninhado com version/author), sem dependência externa.
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const block = match[1] ?? ''
  const lines = block.split(/\r?\n/)

  const result: ParsedFrontmatter = {}
  let inMetadata = false

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ')
    if (/^metadata\s*:/.test(line)) {
      inMetadata = true
      continue
    }
    const indented = /^\s+/.test(line)
    if (inMetadata && !indented && line.trim() !== '') {
      inMetadata = false
    }

    const kv = line.match(/^\s*([a-zA-Z_-]+)\s*:\s*(.+)$/)
    if (!kv) continue
    const key = (kv[1] ?? '').trim()
    const value = stripQuotes((kv[2] ?? '').trim())

    if (key === 'name' && !result.name) result.name = value
    else if (key === 'description' && !result.description) result.description = value
    else if (key === 'version') result.version = value
    else if (key === 'author') result.author = value
  }

  return result
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

/**
 * Calcula um hash de conteúdo determinístico a partir de pares (caminho, bytes)
 * ordenados pelo caminho. Usado para detectar mudanças em artefatos.
 */
export function computeContentHash(files: ReadonlyMap<string, string>): string {
  const hash = createHash('sha256')
  for (const key of [...files.keys()].sort()) {
    hash.update(key)
    hash.update(files.get(key) ?? '')
  }
  return hash.digest('hex')
}
