// AI-GENERATED — not an architecture reference

import { describe, it, expect, beforeAll } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createI18n } from 'vue-i18n'
import { validate } from 'vee-validate'
import { loadAllRules } from '@/validation-rules'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

/**
 * A field that fails its `required` rule is named in the message by the key `form.<name>`,
 * where <name> is the name the field registers with vee-validate (`generateMessage` in
 * `validation-rules.js`). Without that key the key itself is the name: "form.newPassword
 * ist ein Pflichtfeld" stood under every new-password field of the wallet (reset password,
 * first password, change password in the settings, assisted registration) until 21.09.2026.
 *
 * The i18n lint cannot see this, because the key is put together at run time, and until
 * this file no spec loaded `validation-rules.js` at all.
 *
 * So this reads the names from the code and builds the message for each of them, in
 * German and in English, through the real rules. A name comes from one of two places:
 * - a string handed to `useField` (`useField('firstname', …)`), or
 * - a component that registers the name it is given (`useField(props.name, …)`): then the
 *   `name` attribute of every tag that uses it, or its prop default where a tag sets none.
 * A name that is only known at run time (`:name="…"`, a variable) cannot be read here and
 * fails the spec instead of slipping through.
 *
 * Comments come out first (HTML, block and whole-line ones): a comment that shows a tag or
 * a call is not a field.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class and node rejects
 * an instance of it as coming from another realm.
 */
const here = dirname(fileURLToPath(import.meta.url))

const sourceFiles = (dir) => {
  const found = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path))
    } else if (/\.(vue|js)$/.test(entry) && !/\.(spec|test)\.js$/.test(entry)) {
      found.push(path)
    }
  }
  return found
}

const withoutComments = (source) =>
  source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/** The first argument of a call, read from just after its opening parenthesis. */
const firstArgument = (code, from) => {
  let depth = 0
  for (let at = from; at < code.length; at++) {
    const char = code[at]
    if ('([{'.includes(char)) {
      depth += 1
    } else if (')]}'.includes(char)) {
      if (depth === 0) return code.slice(from, at).trim()
      depth -= 1
    } else if (char === ',' && depth === 0) {
      return code.slice(from, at).trim()
    }
  }
  return null
}

/** The attributes of a tag, read from just after its name; null where the tag is unreadable. */
const attributesOf = (code, from) => {
  const attributes = {}
  const token = /\s*(?:(\/?>)|([^\s=/>]+)(?:\s*=\s*("[^"]*"|'[^']*'))?)/y
  token.lastIndex = from
  let match = token.exec(code)
  while (match && !match[1]) {
    attributes[match[2]] = match[3] ? match[3].slice(1, -1) : true
    match = token.exec(code)
  }
  return match ? attributes : null
}

const kebab = (pascal) => pascal.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const files = sourceFiles(here).map((path) => ({
  where: relative(here, path),
  code: withoutComments(readFileSync(path, 'utf8')),
}))

const fields = new Map()
const unreadable = []
const addField = (name, where) => fields.set(name, [...(fields.get(name) ?? []), where])

const wrappers = []
for (const { where, code } of files) {
  for (const call of code.matchAll(/\buseField\(/g)) {
    const argument = firstArgument(code, call.index + call[0].length) ?? ''
    const literal = argument.match(/^(['"])([^'"]+)\1$/)
    if (literal) {
      addField(literal[2], where)
    } else if (
      where.endsWith('.vue') &&
      /\bname\b/.test(argument) &&
      /\bname\s*:\s*\{/.test(code)
    ) {
      const fallback = code.match(/\bname\s*:\s*\{[^{}]*?\bdefault\s*:\s*(['"])([^'"]+)\1/)?.[2]
      wrappers.push({ component: basename(where, '.vue'), fallback, home: where })
    } else {
      unreadable.push(`${where}: useField(${argument})`)
    }
  }
}

for (const { component, fallback, home } of wrappers) {
  const tag = kebab(component)
  const opening = new RegExp(`<(?:${component}|${tag})(?=[\\s/>])`, 'g')
  for (const { where, code } of files.filter((file) => file.where.endsWith('.vue'))) {
    for (const use of code.matchAll(opening)) {
      const attributes = attributesOf(code, use.index + use[0].length)
      if (!attributes) {
        unreadable.push(`${where}: a <${tag}> tag this spec cannot read`)
      } else if (':name' in attributes || 'v-bind:name' in attributes) {
        unreadable.push(`${where}: <${tag} :name="…">, a name only known at run time`)
      } else if (typeof attributes.name === 'string') {
        addField(attributes.name, where)
      } else if (fallback && !('name' in attributes)) {
        addField(fallback, where)
      } else {
        unreadable.push(`${where}: a <${tag}> whose name neither it nor ${home} spells out`)
      }
    }
  }
}

// A form-level schema or vee-validate's <Field> component would name fields in places this
// spec does not read. None is in use; the day one is, the spec has to learn to read it.
const OTHER_WAYS = [
  /\buseForm\(\s*\{[^()]*\bvalidationSchema\b/,
  /import\s*\{[^}]*\bField\b[^}]*\}\s*from\s*['"]vee-validate['"]/,
]

describe('the name a validation message gives a field', () => {
  it('reads this package and finds its fields', () => {
    expect(files.length).toBeGreaterThan(100)
    // One of each way a name is found, so that an empty result cannot pass as a clean one:
    // written at the tag, a prop default, a string handed to useField.
    expect(fields.get('newPassword') ?? []).toContain(
      'components/Inputs/InputPasswordConfirmation.vue',
    )
    expect(fields.get('password') ?? []).toContain('pages/Login.vue')
    expect(fields.get('firstname') ?? []).toContain('pages/Register.vue')
  })

  it('can read every name', () => {
    expect(unreadable).toEqual([])
  })

  it('finds no other way of naming a field', () => {
    const others = files
      .filter(({ code }) => OTHER_WAYS.some((way) => way.test(code)))
      .map(({ where }) => where)
    expect(others).toEqual([])
  })

  describe.each([
    ['de', de],
    ['en', en],
  ])('in %s', (language, messages) => {
    beforeAll(() => {
      // No fallback: a name that only English knows must still fail in German.
      const i18n = createI18n({
        legacy: false,
        locale: language,
        fallbackLocale: false,
        messages: { [language]: messages },
        missingWarn: false,
        fallbackWarn: false,
      })
      loadAllRules(i18n.global, null)
    })

    it('names every field in words', async () => {
      const unnamed = []
      for (const [name, where] of fields) {
        const word = messages.form?.[name]
        const { errors } = await validate('', 'required', { name })
        if (typeof word !== 'string' || !errors[0]?.includes(word)) {
          unnamed.push(`"${errors[0]}"  (${[...new Set(where)].join(', ')})`)
        }
      }
      expect(unnamed).toEqual([])
    })
  })
})
