import path from 'path'
import fs from 'fs'

// Define the regular expression pattern once
const DB_VERSION_PATTERN = /^(\d{4}-[a-z0-9-_]+)/

// Define the paths to check
const migrationsDir = path.join(__dirname, '..', '..', 'migrations')
const entitiesDir = path.join(__dirname, '..', '..', 'entity')

// Helper function to get the highest version number from the directory
function getLatestDbVersion(dir: string): string {
  // Read all files and folders in the directory
  const files = fs.readdirSync(dir)

  // Filter out files/folders that don't match the pattern for DB_VERSION
  const dbVersionFiles = files.filter((file) => file.match(DB_VERSION_PATTERN))

  if (dbVersionFiles.length === 0) {
    throw new Error(`couldn't found any file in ${dir} matching ${DB_VERSION_PATTERN}`)
  }

  // Sort files by the version number (extract the version from the filename)
  const sortedFiles = dbVersionFiles.sort()

  const lastFile = sortedFiles[sortedFiles.length - 1]
  const matches = lastFile.match(DB_VERSION_PATTERN)
  if (!matches || matches.length < 1) {
    throw new Error('invalid match')
  }
  // Return the latest version file or folder
  return matches[1]
}

// Get the latest version from migrations and entities
const latestMigrationVersion = getLatestDbVersion(migrationsDir)
const latestEntityVersion = getLatestDbVersion(entitiesDir)

// Determine which directory has the latest version and return it
export const latestDbVersion =
  latestMigrationVersion && (!latestEntityVersion || latestMigrationVersion > latestEntityVersion)
    ? latestMigrationVersion
    : latestEntityVersion
