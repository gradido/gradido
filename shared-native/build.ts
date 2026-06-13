import { build, type Target } from './build_helper'
import { detectTargetTriple } from './build_helper/deps'
import {
  getNodePath,
  isWin32,
  nodeVersion,
} from './build_helper/host_configuration'

async function main() {
  const commonConfigs = {
    target: await detectTargetTriple(),
    mode: 'small',
    // cpu: ,
    nodeVersion: nodeVersion().replace(/^v/, ''),
    include: ['include', 'third_party'],
  }
  process.env.ZIG_GLOBAL_CACHE_DIR = './.zig-cache'
  process.env.ZIG_LOCAL_CACHE_DIR = './.zig-cache'

  const cflags: string[] = []
  if (isWin32()) {
    // on windows we need to link against the node library
    cflags.push(`-DNODE_LIB=${getNodePath()}`)
  }
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.log('Initial build may take a moment – please be patient.')
  await build({
    /*c_core_bun: {
      ...commonConfigs,
      output: `build/core`,
      std: 'c17',
      sources: [],
      cflags: ['-Dsodium=true', '-Dshared=true', '--release=small', '-DsingleOutputDir=true'],
      useBuildZig: true,
    } as Target,*/
    shared_native: {
      ...commonConfigs,
      output: 'build/shared_native.node',
      sources: [],
      cflags: ['-DNAPI_VERSION=8', '--release=small', '--build-file', 'build_napi.zig'].concat(
        cflags,
      ),
      useBuildZig: true,
      isNodeJsAddon: true,
      } as Target,
  })

  await build({})
}

main()
