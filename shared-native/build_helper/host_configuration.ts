import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { family, MUSL } from 'detect-libc'
import { ZIG_VERSION } from './const'

const DOWNLOAD_DIR = path.join(os.homedir(), '.zig-build')
const NODE_DIR = path.join(DOWNLOAD_DIR, 'node')
const ZIG_DIR = path.join(DOWNLOAD_DIR, 'zig', ZIG_VERSION)

export function getCoreFileName(): string {
  const platform = os.platform()
  return platform === 'win32' ? 'core.dll' : 'libcore.so'
}

export async function isMusl(): Promise<boolean> {
  return (await family()) === MUSL
}

export function isWin32(): boolean {
  return os.platform() === 'win32'
}

export function nodeVersion(): string {
  const nvmrcPath = path.resolve(__dirname, '../../.nvmrc')
  const version = fs.readFileSync(nvmrcPath, 'utf-8').trim().replace(/^v/, '')
  return `v${version || process.versions.node}`
}

export function getNodePath(): string {
  return path.join(NODE_DIR, nodeVersion())
}

export function getZigPath(): string {
  return ZIG_DIR
}
