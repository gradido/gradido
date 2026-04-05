import fs from 'node:fs'
import process from 'node:process'
import { family, MUSL } from 'detect-libc'
import { build, Target, type TargetTriple } from 'zig-build'

async function isMusl(): Promise<boolean> {
  return (await family()) === MUSL
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

  if (!fs.existsSync('build')) {
    fs.mkdirSync('build')
  }
  const currentNodeVersion = fs.readFileSync('../.nvmrc', 'utf-8').trim().replace(/^v/, '')

  const commonConfigs = {
    target,
    mode: 'small',
    cpu: 'native',
    nodeVersion: currentNodeVersion,
  }

  await build(
    {
      c_core: {
        ...commonConfigs,
        output: 'build/libcore.a',
        sources: ['src/c/unit.c'],
        type: 'static',
        cflags: ['-g0', '-s', '-c'],
      } as Target,
      cpp_napi: {
        ...commonConfigs,
        librariesSearch: ['build'],
        libraries: ['core'],
        output: 'build/shared_native.node',
        sources: ['src/napi/gradidoUnit.cpp'],
        cflags: ['-g0', '-s', '-std=c++17'],
      } as Target,
    },
    undefined,
    './compile_commands.json',
  )
}

main()
