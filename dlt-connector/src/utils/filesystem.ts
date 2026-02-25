import fs from 'node:fs'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../config/const'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.utils.filesystem`)

export function checkFileExist(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK)
    return true
  } catch (_err) {
    // logger.debug(`file ${filePath} does not exist: ${_err}`)
    return false
  }
}

export function checkPathExist(path: string, createIfMissing: boolean = false): boolean {
  const exists = checkFileExist(path)
  if (exists) {
    return true
  }
  if (createIfMissing) {
    logger.info(`create folder ${path}`)
    fs.mkdirSync(path, { recursive: true })
    if (!checkPathExist(path)) {
      throw new Error(`Failed to create path ${path}`)
    }
  }
  return false
}

export function toFolderName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_')
}