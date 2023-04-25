/** eslint-disable n/no-sync */
import { logger } from '@/server/logger'
import fs = require('fs')
import os = require('os')
import path = require('path')

const envFilePath = path.resolve(__dirname, './../../.env.devop')

// read .env file & convert to array
const readEnvVars = () => {
  if (!fs.existsSync(envFilePath)) {
    logger.info(`devop config file ${envFilePath} will be created...`)
    fs.writeFileSync(envFilePath, '', 'utf8')
  }
  return fs.readFileSync(envFilePath, 'utf-8').split(os.EOL)
}

/**
 * Finds the key in .env files and returns the corresponding value
 *
 * @param {string} key Key to find
 * @returns {string|null} Value of the key
 */
export const getDevOpEnvValue = (key: string): string | null => {
  // find the line that contains the key (exact match)
  const matchedLine = readEnvVars().find((line) => line.split('=')[0] === key)
  // split the line (delimiter is '=') and return the item at index 2
  return matchedLine !== undefined ? matchedLine.split('=')[1] : null
}

/**
 * Updates value for existing key or creates a new key=value line
 *
 * This function is a modified version of https://stackoverflow.com/a/65001580/3153583
 *
 * @param {string} key Key to update/insert
 * @param {string} value Value to update/insert
 */
export const setDevOpEnvValue = (key: string, value: string): void => {
  const envVars = readEnvVars()
  const targetLine = envVars.find((line) => line.split('=')[0] === key)
  if (targetLine !== undefined) {
    // update existing line
    const targetLineIndex = envVars.indexOf(targetLine)
    // replace the key/value with the new value
    envVars.splice(targetLineIndex, 1, `${key}="${value}"`)
  } else {
    // create new key value
    envVars.push(`${key}="${value}"`)
  }
  // write everything back to the file system
  fs.writeFileSync(envFilePath, envVars.join(os.EOL))
}
