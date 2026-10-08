/** Porta de ambiente: acesso a home, cwd, variáveis e plataforma. */
export interface EnvPort {
  /** Diretório home do usuário. */
  homedir(): string
  /** Diretório de trabalho atual do processo. */
  cwd(): string
  /** Lê uma variável de ambiente, ou `undefined`. */
  getEnv(name: string): string | undefined
  /** Plataforma do SO (ex.: `linux`, `darwin`, `win32`). */
  platform(): string
}
