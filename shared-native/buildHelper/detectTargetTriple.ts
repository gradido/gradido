import { type TargetTriple } from 'zig-build'
import { family, MUSL } from 'detect-libc'
import process from 'node:process'

async function isMusl(): Promise<boolean> {
  return (await family()) === MUSL
}

export async function detectTargetTriple(): Promise<TargetTriple> {
  const platform = process.platform
  const arch = process.arch

  // --- Windows ---
  if (platform === "win32") {
    if (arch === "x64") return "x86_64-windows"
    if (arch === "arm64") return "aarch64-windows"
    if (arch === "ia32") return "x86-windows"
  }

  // --- macOS ---
  if (platform === "darwin") {
    if (arch === "x64") return "x86_64-macos"
    if (arch === "arm64") return "aarch64-macos"
  }

  // --- Linux ---
  if (platform === "linux") {
    const musl = await isMusl()
    if (arch === "x64") return musl ? "x86_64-linux-musl" : "x86_64-linux-gnu"
    if (arch === "arm64") return musl ? "aarch64-linux-musl" : "aarch64-linux-gnu"
    if (arch === "ia32") return musl ? "x86-linux-musl" : "x86-linux-gnu"

    if (arch === "arm") {
      // Node.js can't reliably distinguish between hf / eabi at this time
      // Heuristically: hard-float is the standard today
      return "arm-linux-gnueabihf"
    }
  }

  throw new Error(`Unsupported platform/arch combination: ${platform}/${arch}`)
}