import { arch, platform } from 'node:os'
import { ZIG_VERSION } from './const'
import { nodeVersion } from './host_configuration'

export function getNodeDownloadUrl(): string {
  return `https://nodejs.org/dist/${nodeVersion()}/win-x64/node.lib`
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

export function getZigDownloadUrl(): string {
  const url = ZIGS[platform()]?.[arch()]
  if (!url) {
    throw new Error(`unsupported platform ${platform()} ${arch()}`)
  }
  return url
}
