#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const ROOT_DIR = join(import.meta.dir, '..')
const LOCALES_DIR = join(ROOT_DIR, 'src', 'locales')

const FIX = process.argv.includes('--fix')

function sortObject(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sortObject)
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = sortObject(value[key])
        return acc
      }, {})
  }

  return value
}

let exitCode = 0

const files = (await readdir(LOCALES_DIR))
  .filter(f => f.endsWith('.json'))

for (const file of files) {
  const path = join(LOCALES_DIR, file)

  const originalText = await readFile(path, 'utf8')
  const originalJson = JSON.parse(originalText)

  const sortedJson = sortObject(originalJson)
  const sortedText = JSON.stringify(sortedJson, null, 2) + '\n'

  if (originalText !== sortedText) {
    if (FIX) {
      await writeFile(path, sortedText)
    } else {
      console.error(`${file} is not sorted by keys`)
      exitCode = 1
    }
  }
}

process.exit(exitCode)