import type { ArtifactType, TargetId, TargetProfile } from './types.js'

/** Nome do arquivo de registry gerado, na raiz do catálogo. */
export const REGISTRY_FILE = 'registry.json'

/** Nome do arquivo de metadados de categoria dentro de cada tipo. */
export const CATEGORY_METADATA_FILE = '_category.json'

/** Nome do arquivo canônico de uma skill. */
export const SKILL_FILE = 'SKILL.md'

/** Casa nomes de pasta de categoria como `(frontend)` ou `(code-review)`. */
export const CATEGORY_FOLDER_PATTERN = /^\(([a-z][a-z0-9-]*)\)$/

/** Casa um slug válido de nome de artefato (minúsculo, hífens). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Categoria padrão para artefatos sem categoria explícita. */
export const DEFAULT_CATEGORY_ID = 'uncategorized'

/** Lockfile de instalações, criado no diretório de projeto ou no home. */
export const LOCK_FILE = '.jarvis-skills-lock.json'

/** Variável de ambiente para sobrescrever a localização do catálogo. */
export const CATALOG_ENV_VAR = 'JARVIS_SKILLS_CATALOG'

/** Variável de ambiente para sobrescrever o alvo (LLM) ativo. */
export const TARGET_ENV_VAR = 'JARVIS_SKILLS_TARGET'

/** Rótulo legível por tipo de artefato. */
export const TYPE_LABELS: Record<ArtifactType, string> = {
  skill: 'Skill',
  agent: 'Agent',
  prompt: 'Prompt',
  instruction: 'Instruction',
}

/**
 * Layout de ORIGEM do catálogo (independente do alvo): subpasta por tipo e
 * extensão do arquivo de origem. Skills são pastas com `SKILL.md`
 * (`fileExtension: null`); os demais são arquivos únicos.
 */
export const CATALOG_DIRS: Record<ArtifactType, string> = {
  skill: 'skills',
  agent: 'agents',
  prompt: 'prompts',
  instruction: 'instructions',
}

/** Extensão de origem (no catálogo) por tipo. `null` = pasta com SKILL.md. */
export const SOURCE_EXTENSION: Record<ArtifactType, string | null> = {
  skill: null,
  agent: '.agent.md',
  prompt: '.prompt.md',
  instruction: '.instructions.md',
}

/** Alvo padrão quando nada é configurado. */
export const DEFAULT_TARGET: TargetId = 'claude-code'

/**
 * Mapa central de ALVOS (LLMs/ferramentas). Para cada alvo, define onde cada
 * tipo de artefato é instalado (projeto e global) e a extensão do arquivo.
 * Um tipo ausente de `artifacts` significa que o alvo não o suporta.
 *
 * Para adicionar um novo alvo, basta acrescentar uma entrada aqui — é o único
 * ponto de verdade. Diretórios de projeto são relativos à raiz do projeto;
 * diretórios globais são relativos ao home do usuário.
 */
export const TARGETS: Record<TargetId, TargetProfile> = {
  'claude-code': {
    id: 'claude-code',
    label: 'Claude Code',
    description: "Anthropic Claude Code (.claude/...)",
    artifacts: {
      skill: { projectDir: '.claude/skills', globalDir: '.claude/skills', fileExtension: null },
      agent: { projectDir: '.claude/agents', globalDir: '.claude/agents', fileExtension: '.md' },
      prompt: { projectDir: '.claude/commands', globalDir: '.claude/commands', fileExtension: '.md' },
      instruction: { projectDir: '.claude/rules', globalDir: '.claude/rules', fileExtension: '.md' },
    },
  },
  'github-copilot': {
    id: 'github-copilot',
    label: 'GitHub Copilot',
    description: 'GitHub Copilot (.github/... e ~/.copilot/...)',
    artifacts: {
      skill: { projectDir: '.github/skills', globalDir: '.copilot/skills', fileExtension: null },
      agent: { projectDir: '.github/agents', globalDir: '.copilot/agents', fileExtension: '.agent.md' },
      prompt: { projectDir: '.github/prompts', globalDir: '.copilot/prompts', fileExtension: '.prompt.md' },
      instruction: {
        projectDir: '.github/instructions',
        globalDir: '.copilot/instructions',
        fileExtension: '.instructions.md',
      },
    },
  },
  cursor: {
    id: 'cursor',
    label: 'Cursor',
    description: 'Cursor (.cursor/...). Não possui diretório padrão de agents.',
    artifacts: {
      skill: { projectDir: '.cursor/skills', globalDir: '.cursor/skills', fileExtension: null },
      prompt: { projectDir: '.cursor/commands', globalDir: '.cursor/commands', fileExtension: '.md' },
      instruction: { projectDir: '.cursor/rules', globalDir: '.cursor/rules', fileExtension: '.mdc' },
      // agent: Cursor não tem convenção padrão de subagents → não suportado.
    },
  },
}

/** Diretório de configuração global, sob o home do usuário. */
export const CONFIG_DIR = '.jarvis-skills'

/** Arquivo de configuração global (alvo padrão, método padrão). */
export const CONFIG_FILE = 'config.json'

/** Versão atual do schema do lockfile. */
export const LOCK_FILE_VERSION = 2

/** Versão atual do schema do registry. */
export const REGISTRY_VERSION = '1.0.0'
