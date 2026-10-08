/**
 * Tipos de artefato de customização suportados pelo GitHub Copilot que este
 * marketplace gerencia. A arquitetura segue as convenções do Copilot:
 * - `skill`       → pasta com `SKILL.md` (Agent Skills, padrão aberto)
 * - `agent`       → arquivo `<nome>.agent.md` (agentes/chat modes customizados)
 * - `prompt`      → arquivo `<nome>.prompt.md` (prompt files reutilizáveis)
 * - `instruction` → arquivo `<nome>.instructions.md` (custom instructions)
 */
export const ARTIFACT_TYPES = ['skill', 'agent', 'prompt', 'instruction'] as const

/** União dos identificadores de tipo de artefato. */
export type ArtifactType = (typeof ARTIFACT_TYPES)[number]

/**
 * Categoria exposta pelo catálogo. Categorias agrupam artefatos de um mesmo
 * tipo e vêm dos diretórios `(categoria)` dentro de cada tipo no catálogo.
 */
export interface CategoryInfo {
  /** Identificador estável usado em caminhos e no registry. */
  id: string
  /** Nome legível para exibição. */
  name: string
  /** Descrição curta opcional. */
  description?: string
}

/**
 * Informação mínima de um artefato descoberto no catálogo local, com caminho
 * de origem resolvido no disco.
 */
export interface ArtifactInfo {
  /** Tipo do artefato. */
  type: ArtifactType
  /** Nome único (slug, minúsculo com hífens) dentro do tipo. */
  name: string
  /** Descrição curta exibida nas listagens. */
  description: string
  /** Identificador da categoria. */
  category: string
  /**
   * Caminho absoluto de origem: a pasta do artefato para `skill`, ou o arquivo
   * único para os demais tipos.
   */
  path: string
  /**
   * Arquivos que compõem o artefato, relativos a `path` quando é pasta
   * (skills), ou apenas o nome do arquivo para artefatos de arquivo único.
   */
  files: string[]
  /** Versão declarada no frontmatter, quando houver. */
  version?: string
  /** Autor declarado no frontmatter, quando houver. */
  author?: string
}

/** Metadados de um artefato como persistidos no `registry.json`. */
export interface RegistryArtifact {
  type: ArtifactType
  name: string
  description: string
  category: string
  /** Caminho relativo à raiz do catálogo (pasta ou arquivo). */
  path: string
  files: string[]
  version?: string
  author?: string
  /** Hash de conteúdo para detecção de mudança/atualização. */
  contentHash?: string
}

/**
 * Estrutura completa do `registry.json` gerado a partir do catálogo local.
 */
export interface Registry {
  /** Versão do schema do registry. */
  version: string
  /** Timestamp ISO de geração. */
  generatedAt: string
  /** Categorias indexadas por tipo e por id de categoria. */
  categories: Record<ArtifactType, Record<string, { name: string; description?: string }>>
  /** Todos os artefatos disponíveis para instalação. */
  artifacts: RegistryArtifact[]
}

/** Escopo de instalação: no projeto (cwd) ou global (home do usuário). */
export type InstallScope = 'project' | 'global'

/** Identificador do alvo (LLM/ferramenta): ex.: `claude-code`, `github-copilot`, `cursor`. */
export type TargetId = string

/** Método de instalação: cópia do conteúdo ou link simbólico para a origem. */
export type InstallMethod = 'copy' | 'symlink'

/** Opções de instalação de um artefato. */
export interface InstallOptions {
  /** Escopo de destino da instalação. */
  scope: InstallScope
  /** Alvo (LLM/ferramenta) cujo padrão de diretórios será usado. */
  target: TargetId
  /** Método: copiar o conteúdo ou criar link simbólico para a origem. */
  method: InstallMethod
  /** Reinstala/sobrescreve mesmo se já existir. */
  force?: boolean
  /** Diretório de projeto alvo; por padrão o cwd do processo. */
  cwd?: string
}

/** Resultado de uma tentativa de instalação de um único artefato. */
export interface InstallResult {
  type: ArtifactType
  name: string
  /** Caminho final de destino. */
  path: string
  /** Alvo usado na instalação. */
  target: TargetId
  success: boolean
  error?: string
  /** Já estava instalado e não foi forçado. */
  skipped?: boolean
  /** O alvo não suporta este tipo de artefato (não é falha de execução). */
  unsupported?: boolean
}

/** Resultado da remoção de um artefato. */
export interface RemoveResult {
  type: ArtifactType
  name: string
  target: TargetId
  success: boolean
  error?: string
}

/** Entrada registrada para um artefato instalado no lockfile. */
export interface LockEntry {
  type: ArtifactType
  name: string
  category: string
  scope: InstallScope
  /** Alvo (LLM/ferramenta) em que foi instalado. */
  target: TargetId
  /** Método usado na instalação. */
  method: InstallMethod
  /** Caminho de destino da instalação. */
  path: string
  installedAt: string
  updatedAt: string
  version?: string
  /** Hash de conteúdo instalado, usado para detectar atualizações. */
  contentHash?: string
}

/** Raiz do lockfile de instalações. */
export interface LockFile {
  version: number
  /** Artefatos instalados, indexados por `${target}:${type}:${name}`. */
  artifacts: Record<string, LockEntry>
}

/** Destino de um tipo de artefato dentro de um alvo. */
export interface ArtifactDest {
  /** Diretório de destino no projeto, relativo à raiz do projeto. */
  projectDir: string
  /** Diretório de destino global, relativo ao home do usuário. */
  globalDir: string
  /** Extensão do arquivo único; `null` para tipos baseados em pasta (skill). */
  fileExtension: string | null
}

/**
 * Perfil de um alvo (LLM/ferramenta): rótulo e, por tipo de artefato, o destino
 * correspondente. Tipos ausentes em `artifacts` não são suportados pelo alvo.
 */
export interface TargetProfile {
  id: TargetId
  label: string
  /** Descrição curta do alvo. */
  description?: string
  artifacts: Partial<Record<ArtifactType, ArtifactDest>>
}
