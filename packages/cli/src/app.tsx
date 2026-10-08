import {
  ARTIFACT_TYPES,
  getTarget,
  installArtifact,
  isInstalled,
  isTypeSupported,
  listTargets,
  queryArtifacts,
  removeArtifact,
  resolveActiveMethod,
  resolveActiveTarget,
  resolveArtifactSource,
  setDefaultTarget,
  type ArtifactType,
  type InstallScope,
  type RegistryArtifact,
  type TargetId,
} from '@jarvis/jarvis-skills-core'
import { Box, Text, useApp, useInput } from 'ink'
import { useMemo, useState } from 'react'

import { loadContext, type CliContext } from './context.js'
import { ports } from './ports.js'
import { TYPE_COLOR, TYPE_ICON } from './theme.js'

const PAGE_SIZE = 10

/** Rótulo plural de cada tipo, exibido como "pasta". */
const TYPE_FOLDER_LABEL: Record<ArtifactType, string> = {
  skill: 'Skills',
  agent: 'Agents',
  prompt: 'Prompts',
  instruction: 'Instructions',
}

function sortArtifacts(items: RegistryArtifact[]): RegistryArtifact[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}

interface AppProps {
  context: CliContext
}

/** TUI com navegação por tipo e alvo (LLM) selecionável. */
export function App({ context }: AppProps) {
  const { exit } = useApp()
  const cwd = ports.env.cwd()
  const targets = useMemo(() => listTargets(), [])

  const [view, setView] = useState<'types' | 'list'>('types')
  const [typeIndex, setTypeIndex] = useState(0)
  const [selectedType, setSelectedType] = useState<ArtifactType>('skill')

  const [targetIndex, setTargetIndex] = useState(() => {
    const active = resolveActiveTarget(ports)
    const idx = targets.findIndex((t) => t.id === active)
    return idx >= 0 ? idx : 0
  })
  const target: TargetId = targets[targetIndex]?.id ?? 'claude-code'

  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const [scope, setScope] = useState<InstallScope>('project')
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [status, setStatus] = useState<{ text: string; color: string } | null>(null)

  const countByType = useMemo(() => {
    const map = {} as Record<ArtifactType, number>
    for (const type of ARTIFACT_TYPES) map[type] = 0
    for (const artifact of context.registry.artifacts) map[artifact.type] += 1
    return map
  }, [context.registry])

  const filtered = useMemo(
    () => sortArtifacts(queryArtifacts(context.registry, { type: selectedType, search: query })),
    [context.registry, selectedType, query],
  )

  const clampedIndex = filtered.length === 0 ? 0 : Math.min(index, filtered.length - 1)
  const selected = filtered[clampedIndex]

  const installedSet = useMemo(() => {
    const set = new Set<string>()
    for (const artifact of filtered) {
      if (isInstalled(ports, target, artifact.type, artifact.name, scope, cwd)) set.add(artifact.name)
    }
    return set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, scope, cwd, refresh, target])

  const scopeText = scope === 'project' ? `projeto (${cwd})` : 'global (~)'
  const targetLabel = getTarget(target)?.label ?? target

  async function doInstall(artifact: RegistryArtifact) {
    setBusy(true)
    const result = await installArtifact(
      ports,
      {
        type: artifact.type,
        name: artifact.name,
        category: artifact.category,
        ...(artifact.version ? { version: artifact.version } : {}),
        ...(artifact.contentHash ? { contentHash: artifact.contentHash } : {}),
        sourcePath: resolveArtifactSource(context.catalogRoot, artifact),
      },
      { scope, target, method: resolveActiveMethod(ports), force: true, cwd },
    )
    setBusy(false)
    setRefresh((r) => r + 1)
    if (result.unsupported) {
      setStatus({ text: `⚠️  ${targetLabel} não suporta ${artifact.type}`, color: 'yellow' })
    } else if (result.success) {
      setStatus({ text: `✅ ${artifact.type}/${artifact.name} → ${result.path}`, color: 'green' })
    } else {
      setStatus({ text: `❌ ${result.error}`, color: 'red' })
    }
  }

  async function doRemove(artifact: RegistryArtifact) {
    setBusy(true)
    const result = await removeArtifact(ports, artifact.type, artifact.name, { scope, target, cwd })
    setBusy(false)
    setRefresh((r) => r + 1)
    setStatus(
      result.success
        ? { text: `🗑️  Removido ${artifact.type}/${artifact.name}`, color: 'yellow' }
        : { text: `❌ ${result.error}`, color: 'red' },
    )
  }

  function cycleTarget(): void {
    const next = (targetIndex + 1) % targets.length
    setTargetIndex(next)
    const id = targets[next]!.id
    setDefaultTarget(ports, id) // persiste a escolha (config global)
    setRefresh((r) => r + 1)
    setStatus({ text: `Alvo: ${getTarget(id)?.label ?? id}`, color: 'cyan' })
  }

  useInput((input, key) => {
    if (busy) return

    if (input === 'q' && !key.ctrl) {
      exit()
      return
    }
    if (input === 'g') {
      setScope((s) => (s === 'project' ? 'global' : 'project'))
      return
    }
    if (input === 't') {
      cycleTarget()
      return
    }

    if (view === 'types') {
      if (key.upArrow) setTypeIndex((i) => Math.max(0, i - 1))
      else if (key.downArrow) setTypeIndex((i) => Math.min(ARTIFACT_TYPES.length - 1, i + 1))
      else if (key.return || key.rightArrow) {
        const type = ARTIFACT_TYPES[typeIndex]!
        if (!isTypeSupported(target, type)) {
          setStatus({ text: `⚠️  ${targetLabel} não suporta ${type}`, color: 'yellow' })
          return
        }
        setSelectedType(type)
        setView('list')
        setQuery('')
        setIndex(0)
        setStatus(null)
      }
      return
    }

    // view === 'list'
    if (key.escape || key.leftArrow) {
      setView('types')
      setQuery('')
      setStatus(null)
      return
    }
    if (key.upArrow) {
      setIndex((i) => Math.max(0, Math.min(i, filtered.length - 1) - 1))
      return
    }
    if (key.downArrow) {
      setIndex((i) => Math.min(filtered.length - 1, i + 1))
      return
    }
    if (key.return) {
      if (selected) void doInstall(selected)
      return
    }
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1))
      setIndex(0)
      return
    }
    if (input === 'd') {
      if (selected) void doRemove(selected)
      return
    }
    if (input && !key.ctrl && !key.meta) {
      setQuery((q) => q + input)
      setIndex(0)
    }
  })

  const start = Math.max(
    0,
    Math.min(clampedIndex - Math.floor(PAGE_SIZE / 2), Math.max(0, filtered.length - PAGE_SIZE)),
  )
  const visible = filtered.slice(start, start + PAGE_SIZE)

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text bold color="white">
          Jarvis Skills
        </Text>
        <Text color="gray"> · marketplace local multi-LLM</Text>
      </Box>
      <Box>
        <Text color="gray">
          alvo: <Text color="cyan">{targetLabel}</Text>
          {'  ·  '}escopo: <Text color={scope === 'project' ? 'cyan' : 'magenta'}>{scopeText}</Text>
        </Text>
      </Box>

      {view === 'types' ? (
        <>
          <Box marginTop={1}>
            <Text color="gray">Escolha um tipo:</Text>
          </Box>
          <Box flexDirection="column">
            {ARTIFACT_TYPES.map((type, i) => {
              const isCursor = i === typeIndex
              const supported = isTypeSupported(target, type)
              return (
                <Box key={type}>
                  <Text color={isCursor ? 'cyan' : 'white'}>{isCursor ? '❯ ' : '  '}</Text>
                  <Text color={supported ? TYPE_COLOR[type] : 'gray'}>{TYPE_ICON[type]} </Text>
                  <Text bold={isCursor} color={supported ? undefined : 'gray'}>
                    {TYPE_FOLDER_LABEL[type]}
                  </Text>
                  <Text color="gray"> ({countByType[type]})</Text>
                  {supported ? null : <Text color="gray"> — não suportado por {targetLabel}</Text>}
                </Box>
              )
            })}
          </Box>
          <Box marginTop={1}>
            <Text color="gray">↑/↓: navegar · Enter/→: abrir · t: trocar LLM · g: escopo · q: sair</Text>
          </Box>
          {status ? (
            <Box>
              <Text color={status.color}>{status.text}</Text>
            </Box>
          ) : null}
        </>
      ) : (
        <>
          <Box marginTop={1}>
            <Text color={TYPE_COLOR[selectedType]}>{TYPE_ICON[selectedType]} </Text>
            <Text bold color="white">
              {TYPE_FOLDER_LABEL[selectedType]}
            </Text>
            <Text color="gray">
              {'  ·  '}filtro: <Text color="white">{query || '—'}</Text>
              {'  ·  '}{filtered.length} item(ns)
            </Text>
          </Box>

          <Box flexDirection="column" marginTop={1}>
            {filtered.length === 0 ? (
              <Text color="gray">Nenhum item{query ? ` para "${query}"` : ''}.</Text>
            ) : (
              visible.map((artifact, i) => {
                const globalIdx = start + i
                const isCursor = globalIdx === clampedIndex
                const installed = installedSet.has(artifact.name)
                return (
                  <Box key={artifact.name}>
                    <Text color={isCursor ? 'cyan' : 'white'}>{isCursor ? '❯ ' : '  '}</Text>
                    <Text bold={isCursor}>{artifact.name}</Text>
                    <Text color="gray"> ({artifact.category})</Text>
                    {installed ? <Text color="green"> ✓ instalado</Text> : null}
                  </Box>
                )
              })
            )}
          </Box>

          {selected ? (
            <Box marginTop={1}>
              <Text color="gray">{selected.description}</Text>
            </Box>
          ) : null}

          <Box marginTop={1}>
            {busy ? (
              <Text color="gray">⏳ processando…</Text>
            ) : status ? (
              <Text color={status.color}>{status.text}</Text>
            ) : (
              <Text color="gray">
                Enter: instalar · d: remover · digite p/ filtrar · ←/Esc: voltar · t: LLM · g: escopo · q: sair
              </Text>
            )}
          </Box>
        </>
      )}
    </Box>
  )
}

/** Ponto de entrada da TUI: valida contexto antes de renderizar. */
export function createApp(): { context: CliContext } | { error: string } {
  try {
    return { context: loadContext() }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
