import * as path from 'path'

/**
 * Get the file name for a given command ID replacing "-" with "__" and ":" with "-"
 * @param cmdId - command ID
 * @returns {string} - file name
 */
export const getSchemaFileName = (cmdId: string): string => {
  const baseName = cmdId.replace(/-/g, '__').replace(/:/g, '-')
  return `${baseName}.json`
}

/**
 * Get the command ID from a given file name replacing "-" with ":" and "__" with "-"
 * @param file - file name
 * @returns {string} - command ID
 */
export const  getKeyNameFromFilename = (file: string): string => {
  return path.basename(file.replace(/-/g, ':'))
  .replace(/__/g, '-')
  .replace('.json', '')
}
