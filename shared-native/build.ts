import { build, type Target } from './build_helper'
import { detectTargetTriple } from './build_helper/deps'
import { getNodePath, isWin32, nodeVersion } from './build_helper/host_configuration'

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
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.log('Initial build may take a moment – please be patient.')
  await build({
    shared_native: {
      ...commonConfigs,
      cflags: ['-DNAPI_VERSION=8', '--release=small', '--build-file', 'build_napi.zig'].concat(
        cflags,
      ),
      isNodeJsAddon: true,
    } as Target,
    //*/
  })

  await build({})
}

main()
