import { readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'

type PackageJson = {
  workspaces?: string[]
}

const ROOT = resolve(import.meta.dirname, '..')

const TARGETS = ['node_modules', '.turbo', 'build', '.zig-cache']

async function readWorkspaces(): Promise<string[]> {
  const packageJsonPath = join(ROOT, 'package.json')
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJson

  if (!packageJson.workspaces) {
    throw new Error(`No "workspaces" entry found in ${packageJsonPath}`)
  }

  return packageJson.workspaces
}

async function removeIfExists(path: string): Promise<void> {
  try {
    await rm(path, {
      recursive: true,
      force: false,
    })

    console.log(`✓ ${path}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") { return }
    console.error(`✗ Failed to remove ${path}`)
    throw error
  }
}

const workspaces = await readWorkspaces()

console.log(`Cleaning ${workspaces.length} workspaces...\n`)

for (const workspace of workspaces) {
  const workspacePath = join(ROOT, workspace)

  console.log(`Workspace: ${workspace}`)

  for (const target of TARGETS) {
    await removeIfExists(join(workspacePath, target))
  }

  console.log()
}

// Also clean root-level targets.
console.log('Root:')

for (const target of TARGETS) {
  await removeIfExists(join(ROOT, target))
}

console.log('\nClean complete.')
