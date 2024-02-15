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

export function getAllFiles(dirPath: string, ext: string, allFiles: string[] = []): string[] {
  let files: string[] = []
  try {
    files = fs.readdirSync(dirPath)
  } catch {}

  for (const file of files) {
    const fPath = path.join(dirPath, file)
    if (fs.statSync(fPath).isDirectory()) {
      allFiles = getAllFiles(fPath, ext, allFiles)
    } else if (file.endsWith(ext)) {
      allFiles.push(fPath)
    }
  }

  return allFiles
}

export const GLOB_PATTERNS = [
  '**/*.+(js|cjs|mjs|ts|tsx|mts|cts)',
  '!**/*.+(d.ts|test.ts|test.js|spec.ts|spec.js|d.mts|d.cts)?(x)',
]
