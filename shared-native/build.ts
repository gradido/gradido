import { build, Target } from 'zig-build'
import fs from 'node:fs'
import { detectTargetTriple } from './buildHelper/detectTargetTriple'

async function main() {

  const target = await detectTargetTriple()

  if (!fs.existsSync('build')) {
    fs.mkdirSync('build')
  }

  const commonConfigs = {
    target,
    mode: 'small',
    cpu: 'native',
  }

  const commonNapiConfigs = {
    ...commonConfigs,
    librariesSearch: ['build'],
    libraries: ['core'],
  }


  await build(
  {
    core: {
      ...commonConfigs,
      output: 'build/libcore.a',
      type: 'static',
      sources: ['src/c/unit.c'],
      cflags: ['-g0', '-s', '-c']
    } as Target,
    c: {
      ...commonNapiConfigs,
      output: 'build/shared_native.node',      
      sources: ['src/napi/gradido_unit.c'],
      cflags: ['-g0', '-s'],
    } as Target,
    cpp: {
      ...commonNapiConfigs,
      output: 'build/shared_native_cpp.node',      
      sources: ['src/napi/GradidoUnit.cpp'],
      cflags: ['-g0', '-s', '-std=c++17'],
    } as Target,
  },
  undefined,
  './compile_commands.json',
)
}

main()