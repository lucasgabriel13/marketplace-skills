import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cp, lstat, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'

import type { DirEntryLike, FileSystemPort } from '../ports/filesystem.port.js'

/** Adapter de sistema de arquivos baseado em `node:fs`. */
export const nodeFileSystemAdapter: FileSystemPort = {
  existsSync: (path) => existsSync(path),
  readFileSync: (path, encoding) => readFileSync(path, encoding),
  readdirSync: (path, options) => readdirSync(path, options) as unknown as DirEntryLike[],
  writeFileSync: (path, data, encoding) => writeFileSync(path, data, encoding),
  mkdirSync: (path, options) => {
    mkdirSync(path, options)
  },

  readFile: (path, encoding) => readFile(path, encoding),
  writeFile: (path, data, encoding) => writeFile(path, data, encoding),
  readdir: async (path, options) => (await readdir(path, options)) as unknown as DirEntryLike[],
  mkdir: async (path, options) => {
    await mkdir(path, options)
  },
  cp: (src, dest, options) => cp(src, dest, options),
  rm: (path, options) => rm(path, options),
  lstat: (path) => lstat(path),
  symlink: (target, path, type) => symlink(target, path, type),
}
