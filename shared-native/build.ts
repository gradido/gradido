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
    include: ['include', 'third_party'],
  }

  const coreFileName = getCoreFileName()
  const libs: { librariesSearch?: string[]; libraries?: string[] } = {}

  if (isWin32()) {
    // on windows we need to link against the node library
    libs.librariesSearch = [getNodePath()]
    libs.libraries = ['node']
  }
  const libSrcs = ['src/data/unit.c', 'src/utils/converter.c', 'src/utils/duration.c']
  await build(
    {
      c_core: {
        ...commonConfigs,
        sources: libSrcs,
        output: `build/${coreFileName}`,
        type: 'shared',
        std: 'c17',
        cflags: ['-g0', '-s'],
      } as Target,
      cpp_napi: {
        ...commonConfigs,
        ...libs,
        output: 'build/shared_native.node',
        sources: ['bindings/napi/gradidoUnit.cpp', ...libSrcs],
        cflags: ['-g0', '-s', '-DNAPI_VERSION=8'],
      } as Target,
    },
    undefined,
    './compile_commands.json',
  )
}

main()
