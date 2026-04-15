import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import AdmZip from 'adm-zip'
import { family, MUSL } from 'detect-libc'
import headers from 'node-api-headers'
import { build, Target, type TargetTriple } from 'zig-build'

async function isMusl(): Promise<boolean> {
  return (await family()) === MUSL
}

const ZIG_VERSION = '0.10.1'
const DOWNLOAD_DIR = path.join(os.homedir(), '.zig-build')
const NODE_DIR = path.join(DOWNLOAD_DIR, 'node')
const ZIG_DIR = path.join(DOWNLOAD_DIR, 'zig', ZIG_VERSION)

function getNodePath(version?: string): string {
  version ??= process.versions.node
  const vversion = `v${version}`
  return path.join(NODE_DIR, vversion)
}

async function fetchNodeHeaders(version?: string): Promise<void> {
  const headersDir = getNodePath(version)
  const includePath = path.join(headersDir, 'include', 'node')
  const installedIncludePath = headers.include_dir
  
  fs.mkdirSync(includePath, { recursive: true })

  // copy from installedIncludePath to includePath
  fs.cpSync(installedIncludePath, includePath, { recursive: true })
}

const ZIGS: Partial<Record<NodeJS.Platform, Partial<Record<string, string>>>> = {
  linux: {
    x64: `https://ziglang.org/download/${ZIG_VERSION}/zig-linux-x86_64-${ZIG_VERSION}.tar.xz`,
    arm64: `https://ziglang.org/download/${ZIG_VERSION}/zig-linux-aarch64-${ZIG_VERSION}.tar.xz`,
  },
  darwin: {
    x64: `https://ziglang.org/download/${ZIG_VERSION}/zig-macos-x86_64-${ZIG_VERSION}.tar.xz`,
    arm64: `https://ziglang.org/download/${ZIG_VERSION}/zig-macos-aarch64-${ZIG_VERSION}.tar.xz`,
  },
  win32: {
    x64: `https://ziglang.org/download/${ZIG_VERSION}/zig-windows-x86_64-${ZIG_VERSION}.zip`,
    arm64: `https://ziglang.org/download/${ZIG_VERSION}/zig-windows-aarch64-${ZIG_VERSION}.zip`,
  },
}

function checkFileExist(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK)
    return true
  } catch (_err) {
    return false
  }
}

// move contents from one folder up
function moveContentsUp(baseDir: string) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true })

  // find the one subfolder (zig-windows-...)
  const innerDirEntry = entries.find(e => e.isDirectory())
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

export async function fetchZig(): Promise<void> {
  const platform = os.platform()
  const arch = os.arch()

  const binary = platform === 'win32' ? 'zig.exe' : 'zig'
  const binaryPath = path.join(ZIG_DIR, binary)

  if (checkFileExist(binaryPath)) {
    return
  }
  // biome-ignore lint/suspicious/noConsole: no logging in build.ts
  console.log('Fetching Zig...')
  const url = ZIGS[platform]?.[arch]
  if (!url) {
    throw new Error(`unsupported platform ${platform} ${arch}`)
  }

  fs.mkdirSync(ZIG_DIR, { recursive: true })
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch Zig: ${response.status} ${response.statusText} from ${url}`)
  }
  const responseBuffer = Buffer.from(await response.arrayBuffer())
  console.log(`zig dir: ${ZIG_DIR}`)
  if (platform === 'win32') {
    const zip = new AdmZip(responseBuffer)
    zip.extractAllTo(ZIG_DIR, true)
    moveContentsUp(ZIG_DIR)
  } else {
    const archivePath = path.join(ZIG_DIR, 'zig.tar.xz')
    fs.writeFileSync(archivePath, responseBuffer)
    execFileSync('tar', ['-xJf', 'zig.tar.xz', '--strip-components=1'], {
      cwd: ZIG_DIR,
    })
  }
}

async function detectTargetTriple(): Promise<TargetTriple> {
  const platform = process.platform
  const arch = process.arch

  // --- Windows ---
  if (platform === 'win32') {
    if (arch === 'x64') {
      return 'x86_64-windows'
    }
    if (arch === 'arm64') {
      return 'aarch64-windows'
    }
    if (arch === 'ia32') {
      return 'x86-windows'
    }
  }

  // --- macOS ---
  if (platform === 'darwin') {
    if (arch === 'x64') {
      return 'x86_64-macos'
    }
    if (arch === 'arm64') {
      return 'aarch64-macos'
    }
  }

  // --- Linux ---
  if (platform === 'linux') {
    const musl = await isMusl()
    if (arch === 'x64') {
      return musl ? 'x86_64-linux-musl' : 'x86_64-linux-gnu'
    }
    if (arch === 'arm64') {
      return musl ? 'aarch64-linux-musl' : 'aarch64-linux-gnu'
    }
    if (arch === 'ia32') {
      return musl ? 'x86-linux-musl' : 'x86-linux-gnu'
    }

    if (arch === 'arm') {
      // Node.js can't reliably distinguish between hf / eabi at this time
      // Heuristically: hard-float is the standard today
      return 'arm-linux-gnueabihf'
    }
  }

  throw new Error(`Unsupported platform/arch combination: ${platform}/${arch}`)
}

async function main() {
  const target = await detectTargetTriple()
  const platform = os.platform()

  if (!fs.existsSync('build')) {
    fs.mkdirSync('build')
  }
  const currentNodeVersion = fs.readFileSync('../.nvmrc', 'utf-8').trim().replace(/^v/, '')
  // workaround because node header download from zig-build doesn't work on each platform
  await fetchNodeHeaders(currentNodeVersion)
  await fetchZig()

  const commonConfigs = {
    target,
    mode: 'small',
    cpu: 'native',
    nodeVersion: currentNodeVersion,
  }
  const coreFileName = platform === 'win32' ? 'core.lib' : 'libcore.a'
  if (platform === 'win32') {
    await build(
      {
        native: {
          ...commonConfigs,
          librariesSearch: [getNodePath(currentNodeVersion)],
          libraries: ['node'],
          std: 'c17',
          output: 'build/shared_native.node',
          sources: ['src/napi/gradido_unit.c', 'src/c/unit.c'],
          cflags: ['-g0', '-s'],
        } as Target,
      }
    )
  } else {
    await build(
      {
        c_core: {
          ...commonConfigs,
          output: `build/${coreFileName}`,
          sources: ['src/c/unit.c'],
          type: 'static',
          cflags: ['-g0', '-s', '-c'],
        } as Target,
        cpp_napi: {
          ...commonConfigs,
          librariesSearch: ['build', getNodePath(currentNodeVersion)],
          libraries: ['core', 'node'],
          output: 'build/shared_native.node',
          sources: ['src/napi/gradidoUnit.cpp'],
          cflags: ['-g0', '-s', '-std=c++17'],
        } as Target,
      },
      undefined,
      './compile_commands.json',
    )
  }
}

main()
