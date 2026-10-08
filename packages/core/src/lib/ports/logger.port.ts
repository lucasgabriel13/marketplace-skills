/** Porta de log usada pelos serviços do core. */
export interface LoggerPort {
  info(message: string): void
  warn(message: string): void
  error(message: string): void
  debug(message: string): void
}
