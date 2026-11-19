import { expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { build } from 'esbuild'

it('shared/browser pulls in nothing a browser cannot load', async () => {
  // a `node:*` import fails the build itself; a package shows up as an import of the bundle
  const { metafile } = await build({
    entryPoints: [`${import.meta.dir}/browser.ts`],
    bundle: true,
    platform: 'browser',
    packages: 'external',
    format: 'esm',
    write: false,
    metafile: true,
    logLevel: 'silent',
  })
  const packages = Object.values(metafile.outputs).flatMap((o) => o.imports.map((i) => i.path))
  expect([...new Set(packages)].sort()).toEqual(['uuid', 'valibot'])
  // globals of Node no import shows
  const usesNodeGlobal = []
  for (const file of Object.keys(metafile.inputs)) {
    if (/\bBuffer\b|\bprocess\./.test(readFileSync(`${import.meta.dir}/../${file}`, 'utf8'))) {
      usesNodeGlobal.push(file)
    }
  }
  expect(usesNodeGlobal).toEqual([])
})
