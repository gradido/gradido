// AI-GENERATED — not an architecture reference
import { expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const page = (folder: string) =>
  readFileSync(new URL(`../../${folder}/index.html`, import.meta.url), 'utf8')

// Two copies until the switch: Vite takes index.html from its own folder only. What is changed in
// one (meta tags, the theme before the first paint, the manifest) has to be changed in the other.
test('index.html is the old wallet’s, but for the entry it loads', () => {
  expect(page('frontend-mithril')).toBe(page('frontend').replace('/src/main.js', '/src/main.ts'))
})
