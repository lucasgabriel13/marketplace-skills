import type { LoggerPort } from '../ports/logger.port.js'

/**
 * Adapter de log silencioso por padrão para não poluir a saída da TUI/CLI.
 * A CLI é responsável por formatar mensagens ao usuário; o core apenas reporta
 * erros via `console.error` para diagnóstico.
 */
export const nodeLoggerAdapter: LoggerPort = {
  info: () => {},
  warn: (message) => console.error(message),
  error: (message) => console.error(message),
  debug: () => {},
}
