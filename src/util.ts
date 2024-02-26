import fs from 'node:fs'
import path from 'node:path'

/**
 * Get the file name for a given command ID replacing "-" with "__" and ":" with "-"
 * @param cmdId - command ID
 * @returns {string} - file name
 */
export const getSchemaFileName = (cmdId: string): string => {
  const baseName = cmdId.replaceAll('-', '__').replaceAll(':', '-')
  return `${baseName}.json`
}

/**
 * Get the command ID from a given file name replacing "-" with ":" and "__" with "-"
 * @param file - file name
 * @returns {string} - command ID
 */
export const getKeyNameFromFilename = (file: string): string =>
  file.replaceAll('-', ':').replaceAll('__', '-').replace('.json', '')

export const getAllFiles = (dirPath: string, ext: string, allFiles: string[] = []): string[] =>
  safeReadDirSync(dirPath)
    .flatMap((f) =>
      f.isDirectory() ? getAllFiles(path.join(dirPath, f.name), ext, allFiles) : path.join(dirPath, f.name),
    )
    .filter((f) => f.endsWith(ext))

const safeReadDirSync = (dirPath: string): fs.Dirent[] => {
  try {
    // TODO: use recursive option when available in Node 20
    return fs.readdirSync(dirPath, {withFileTypes: true})
  } catch {
    return []
  }
}

export const GLOB_PATTERNS = [
  '**/*.+(js|cjs|mjs|ts|tsx|mts|cts)',
  '!**/*.+(d.ts|test.ts|test.js|spec.ts|spec.js|d.mts|d.cts)?(x)',
]
