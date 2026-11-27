// AI-GENERATED — not an architecture reference
import { expect, it, mock } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'

const writeText = mock((_text: string) => Promise.resolve())
const toastSuccess = mock()
const toastError = mock()
mock.module('clipboard-polyfill', () => ({ writeText }))
mock.module('@/components/ui/Toasts', () => ({ toastSuccess, toastError }))

const { copyText } = await import('./clipboard')

it('says copied once the text is copied', async () => {
  expect(await copyText('gradido.net/u/bibi', 'Copied')).toBe(true)
  expect(writeText).toHaveBeenCalledWith('gradido.net/u/bibi')
  expect(toastSuccess).toHaveBeenCalledWith('Copied')
  expect(toastError).not.toHaveBeenCalled()
})

it('says so where it could not be copied, and never copied', async () => {
  toastSuccess.mockClear()
  writeText.mockRejectedValueOnce(new Error('no clipboard'))
  expect(await copyText('gradido.net/u/bibi', 'Copied')).toBe(false)
  expect(toastSuccess).not.toHaveBeenCalled()
  expect(toastError).toHaveBeenCalledWith(
    'Unfortunately, your device does not allow copying! Please copy the link by hand!',
  )
})

// The polyfill is called by `copyText`, not installed over `navigator.clipboard`: whoever
// calls the browser's own could not copy on a page without TLS.
it('is the only file of the wallet that reaches for the clipboard', () => {
  const src = `${import.meta.dir}/..`
  const reaching = readdirSync(src, { recursive: true, encoding: 'utf8' }).filter(
    (file) =>
      file.endsWith('.ts') &&
      !file.endsWith('.test.ts') &&
      file !== 'browser/clipboard.ts' &&
      /navigator\s*\.\s*clipboard|clipboard-polyfill/.test(readFileSync(`${src}/${file}`, 'utf8')),
  )
  expect(reaching).toEqual([])
})
