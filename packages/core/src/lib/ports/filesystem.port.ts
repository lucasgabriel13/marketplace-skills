/** Entrada de diretório com predicados de tipo (subset de `fs.Dirent`). */
export interface DirEntryLike {
  name: string
  isDirectory(): boolean
  isFile(): boolean
  isSymbolicLink(): boolean
}

/**
 * Porta de sistema de arquivos usada pelos serviços do core. Expõe apenas o
 * necessário para descobrir, ler, copiar e remover artefatos.
 */
export interface FileSystemPort {
  existsSync(path: string): boolean
  readFileSync(path: string, encoding: 'utf-8'): string
  readdirSync(path: string, options: { withFileTypes: true }): DirEntryLike[]
  writeFileSync(path: string, data: string, encoding: 'utf-8'): void
  mkdirSync(path: string, options: { recursive: true }): void

  readFile(path: string, encoding: 'utf-8'): Promise<string>
  writeFile(path: string, data: string, encoding: 'utf-8'): Promise<void>
  readdir(path: string, options: { withFileTypes: true }): Promise<DirEntryLike[]>
  mkdir(path: string, options: { recursive: true }): Promise<void>
  cp(src: string, dest: string, options: { recursive: true }): Promise<void>
  rm(path: string, options: { recursive?: boolean; force?: boolean }): Promise<void>
  lstat(path: string): Promise<{ isSymbolicLink(): boolean; isDirectory(): boolean }>
  symlink(target: string, path: string, type?: 'dir' | 'file' | 'junction'): Promise<void>
}
