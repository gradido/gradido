/**
 * Bootstrap script to download and setup dependencies
 *
 * This script should be run before building the native module
 * It will download Zig and Node.js headers if they are not already present
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import AdmZip from 'adm-zip'
import headers from 'node-api-headers'
import { type TargetTriple } from 'zig-build'
import { getNodeDownloadUrl, getZigDownloadUrl } from './dowload_paths'
import { checkFileExist, moveContentsUp } from './filesystem'
import { getNodePath, getZigPath, isMusl, isWin32 } from './host_configuration'

async function fetchNodeHeaders(): Promise<void> {
  const headersDir = getNodePath()
  const includePath = path.join(headersDir, 'include', 'node')
  const installedIncludePath = headers.include_dir

  fs.mkdirSync(includePath, { recursive: true })

  // copy from installedIncludePath to includePath
  fs.cpSync(installedIncludePath, includePath, { recursive: true })

  // download node.lib
  if (isWin32()) {
    const nodeLibUrl = getNodeDownloadUrl()
    const nodeLibPath = path.join(headersDir, 'node.lib')
    const nodeLibResponse = await fetch(nodeLibUrl)
    const nodeLibBuffer = await nodeLibResponse.arrayBuffer()
    fs.writeFileSync(nodeLibPath, Buffer.from(nodeLibBuffer))
  }
}

export async function fetchZig(): Promise<void> {
  const binary = isWin32() ? 'zig.exe' : 'zig'
  const binaryPath = path.join(getZigPath(), binary)

  if (checkFileExist(binaryPath)) {
    return
  }
  // biome-ignore lint/suspicious/noConsole: no logging in build.ts
  console.log('Fetching Zig...')
  const url = getZigDownloadUrl()

  fs.mkdirSync(getZigPath(), { recursive: true })
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch Zig: ${response.status} ${response.statusText} from ${url}`)
  }
  const responseBuffer = Buffer.from(await response.arrayBuffer())
  if (isWin32()) {
    const zip = new AdmZip(responseBuffer)
    zip.extractAllTo(getZigPath(), true)
    moveContentsUp(getZigPath())
  } else {
    const archivePath = path.join(getZigPath(), 'zig.tar.xz')
    fs.writeFileSync(archivePath, responseBuffer)
    execFileSync('tar', ['-xJf', 'zig.tar.xz', '--strip-components=1'], {
      cwd: getZigPath(),
    })
  }
}

export async function detectTargetTriple(): Promise<TargetTriple> {
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

export async function setup_dependencies() {
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build')
  }
  // workaround because node header download from zig-build doesn't work on each platform
  await fetchNodeHeaders()
  await fetchZig()
}
