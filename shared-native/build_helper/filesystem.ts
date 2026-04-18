import fs from 'node:fs'
import path from 'node:path'

export function checkFileExist(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK)
    return true
  } catch (_err) {
    return false
  }
}

export function checkPathExist(path: string, createIfMissing: boolean = false): boolean {
  const exists = checkFileExist(path)
  if (exists) {
    return true
  }
  if (createIfMissing) {
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

// move contents from one folder up
export function moveContentsUp(baseDir: string) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true })

  // find the one subfolder (zig-windows-...)
  const innerDirEntry = entries.find((e) => e.isDirectory())
  if (!innerDirEntry) {
    throw new Error(`No subfolder found in ${baseDir}`)
  }

  const innerDir = path.join(baseDir, innerDirEntry.name)

  // Move contents
  const innerEntries = fs.readdirSync(innerDir)
  for (const entry of innerEntries) {
    const src = path.join(innerDir, entry)
    const dest = path.join(baseDir, entry)

    fs.renameSync(src, dest) // move file/folder
  }

  // delete empty folder
  fs.rmdirSync(innerDir)
}
