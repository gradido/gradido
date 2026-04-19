import { build, Target } from 'zig-build'
import { detectTargetTriple, setup_dependencies } from './build_helper/deps'
import {
  getCoreFileName,
  getNodePath,
  isWin32,
  nodeVersion,
} from './build_helper/host_configuration'

async function main() {
  await setup_dependencies()

  const commonConfigs = {
    target: await detectTargetTriple(),
    mode: 'small',
    cpu: 'native',
    nodeVersion: nodeVersion().replace(/^v/, ''),
  }

  const coreFileName = getCoreFileName()
  const libs: { librariesSearch?: string[]; libraries?: string[] } = {}

  if (isWin32()) {
    // on windows we need to link against the node library
    libs.librariesSearch = [getNodePath()]
    libs.libraries = ['node']
  }

  await build(
    {
      c_core: {
        ...commonConfigs,
        sources: ['src/c/unit.c', 'src/c/utils.c'],
        output: `build/${coreFileName}`,
        type: 'shared',
        std: 'c17',
        cflags: ['-g0', '-s'],
      } as Target,
      cpp_napi: {
        ...commonConfigs,
        ...libs,
        output: 'build/shared_native.node',
        sources: ['src/napi/gradidoUnit.cpp', 'src/c/unit.c', 'src/c/utils.c'],
        cflags: ['-g0', '-s', '-DNAPI_VERSION=8'],
      } as Target,
    },
    undefined,
    './compile_commands.json',
  )
}

main()
