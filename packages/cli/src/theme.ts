import type { ArtifactType } from '@jarvis/jarvis-skills-core'

/** Cor associada a cada tipo de artefato (nomes de cor do Ink/chalk). */
export const TYPE_COLOR: Record<ArtifactType, string> = {
  skill: 'cyan',
  agent: 'magenta',
  prompt: 'green',
  instruction: 'yellow',
}

/** Rótulo curto por tipo. */
export const TYPE_LABEL: Record<ArtifactType, string> = {
  skill: 'skill',
  agent: 'agent',
  prompt: 'prompt',
  instruction: 'instruction',
}

/** Ícone simples por tipo. */
export const TYPE_ICON: Record<ArtifactType, string> = {
  skill: '◆',
  agent: '⬢',
  prompt: '▲',
  instruction: '■',
}
