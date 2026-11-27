// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'

type Texts = { [key: string]: string | Texts }

const LOCALES = new URL('../../../frontend/src/locales/', import.meta.url)

/**
 * The text of `key` as the wallet's language file has it, `{name}` filled from `values`: what a
 * spec expects on the page, without a copy of the sentence. German where not said otherwise,
 * the language the specs run in (playwright.config.ts).
 */
export function text(key: string, values: Record<string, string | number> = {}, language = 'de') {
  let found: string | Texts | undefined = JSON.parse(
    readFileSync(new URL(`${language}.json`, LOCALES), 'utf8'),
  )
  for (const part of key.split('.')) {
    found = typeof found === 'object' ? found[part] : undefined
  }
  if (typeof found !== 'string') {
    throw new Error(`${language}.json has no text ${key}`)
  }
  return found.replace(/\{\s*(\w+)\s*\}/g, (_placeholder, name: string) => String(values[name]))
}
