import { build, type Target } from './build_helper'
import { detectTargetTriple } from './build_helper/deps'
import {
  getCoreFileName,
  getNodePath,
  isWin32,
  nodeVersion,
} from './build_helper/host_configuration'
import  path from 'node:path'

async function main() {
  const commonConfigs = {
    target: await detectTargetTriple(),
    mode: 'small',
    // cpu: ,
    nodeVersion: nodeVersion().replace(/^v/, ''),
    include: ['include', 'third_party'],
  }

  await build({
      c_core_full: {
        ...commonConfigs,
        output: `build/core`,
        std: 'c17',
        sources: [],
        cflags: ['-Dsodium=true', '-Dshared=true', '--release=small'],
        useBuildZig: true
      } as Target,
      /*c_core: {
        ...commonConfigs,
        output: `build/${coreFileName}`,
        sources: libSrcs,
        type: 'shared',
        std: 'c17',
        cflags: ['-g0', '-s'].concat(cflags),
      } as Target,
      cpp_napi: {
        ...commonConfigs,
        ...libs,
        output: 'build/shared_native.node',
        sources: ['bindings/napi/gradidoUnit.cpp'],
        cflags: ['-g0', '-s', '-DNAPI_VERSION=8'].concat(cflags),
        } as Target,
        //*/
    },
    undefined,
    './compile_commands.json',
  )
  const libs: { librariesSearch: string[]; libraries: string[] } = {
    librariesSearch: ['./build'],
    libraries: ['gradido_blockchain_core']
  }

  if (isWin32()) {
    // on windows we need to link against the node library
    libs.librariesSearch.push(getNodePath())
    libs.libraries.push('node')
  }
  process.env.ZIG_GLOBAL_CACHE_DIR = './.zig-cache'
  process.env.ZIG_LOCAL_CACHE_DIR  = './.zig-cache'
  await build({
    cpp_napi: {
      ...commonConfigs,
      ...libs,
      output: 'build/shared_native.node',
      sources: ['bindings/napi/gradidoUnit.cpp'],
      cflags: ['-g0', '-s', '-DNAPI_VERSION=8', '-O2', '-fno-fast-math', '-fwrapv']
    } as Target
  })
}

main()
