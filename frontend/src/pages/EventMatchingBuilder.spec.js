// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { parseQuery } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EventMatchingBuilder from './EventMatchingBuilder.vue'
import { renderQrCodeCanvas } from '@/utils/qrCode'
import de from '@/locales/de.json'
import en from '@/locales/en.json'

// The generator itself is replaced, its settings are not: the margin around the code is
// measured in the generator's own cells, and a made-up cell size would prove nothing.
vi.mock('@/utils/qrCode', async (importOriginal) => ({
  ...(await importOriginal()),
  renderQrCodeCanvas: vi.fn(),
}))

const toasts = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ useAppToast: () => toasts }))

// A plain object the tests may change: the page reads the address when it builds a link.
const config = vi.hoisted(() => ({ COMMUNITY_URL: 'https://gradido.example' }))
vi.mock('@/config', () => ({ default: config }))

const HOME = 'https://gradido.example'
const MODULE = 8
/** A drawn code as the generator hands it over: so many pixels wide, and nothing else. */
const codeOf = (link) => ({ width: 69 * MODULE, height: 69 * MODULE, link })

let paper
let i18n
let wrapper

const mountBuilder = () => {
  wrapper = mount(EventMatchingBuilder, { global: { plugins: [i18n] }, attachTo: document.body })
  return wrapper
}

const field = (name) => wrapper.find(`[data-test="builder-${name}"]`)
const link = () => field('link').element.value
// How long the page waits after the last key before it draws the code.
const PAUSE = 600
// Details the builder asks for before it makes a link. A test about something else types its
// sentence alone and gets these, once; a test about the details gives its own.
const DETAILS = 'Selbstheilung'
/** Typing alone: the text is in the fields, the code has not been asked for yet. */
const type = async (sentence, details) => {
  await field('sentence').setValue(sentence)
  if (details !== undefined) await field('details').setValue(details)
  else if (field('details').element.value === '') await field('details').setValue(DETAILS)
}
/** Time passing, and whatever was waiting on it. */
const wait = async (ms) => {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}
/** Typing, and then the pause after which the code is drawn. */
const write = async (sentence, details) => {
  await type(sentence, details)
  await wait(PAUSE)
}
const query = () => parseQuery(new URL(link()).search)
/** Drawings that finish when the test says so, in the order the test says. */
const heldDrawings = () => {
  const held = []
  renderQrCodeCanvas.mockImplementation(
    (address) =>
      new Promise((resolve, reject) => {
        held.push({ address, finish: () => resolve(codeOf(address)), fail: reject })
      }),
  )
  return held
}

beforeEach(() => {
  vi.clearAllMocks()
  // The pause before the code is drawn, and nothing else: promises and Vue's own queue run on.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  config.COMMUNITY_URL = HOME
  i18n = createI18n({ legacy: false, locale: 'de', fallbackLocale: 'en', messages: { de, en } })
  renderQrCodeCanvas.mockImplementation((address) => Promise.resolve(codeOf(address)))
  // jsdom draws nothing. What the page does to its own sheet is recorded instead: the size it
  // gives it, the white it lays down and where it sets the code.
  paper = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => paper)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (type) {
    return `data:${type};sheet=${this.width}x${this.height};code=${paper.drawImage.mock.lastCall[0].link}`
  })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('EventMatchingBuilder', () => {
  describe('before the host has written a name', () => {
    it('suggests the word "Projekt" with a space behind it', () => {
      mountBuilder()
      expect(field('sentence').element.value).toBe('Projekt ')
    })

    it('shows a quiet line where the result will stand, and draws nothing', async () => {
      mountBuilder()
      await flushPromises()

      expect(field('result').exists()).toBe(false)
      expect(field('waiting').text()).toBe(de.eventMatching.builder.waiting)
      expect(renderQrCodeCanvas).not.toHaveBeenCalled()
    })

    // "More than the suggestion" is the rule, and the suggestion is a word, not a prefix one
    // has to keep: an empty field and the bare word both say nothing about any project.
    it.each([[''], ['   '], ['Projekt'], ['Projekt   ']])(
      'takes %j for no name at all',
      async (sentence) => {
        mountBuilder()
        await write(sentence)

        expect(field('result').exists()).toBe(false)
        expect(field('waiting').exists()).toBe(true)
      },
    )

    // The details are asked for as well: the form a guest's link opens saves an entry only
    // with details, and without them would open with its button greyed out.
    it('asks for the details once there is a name, and makes no link without them', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing', '')

      expect(field('result').exists()).toBe(false)
      expect(field('waiting').text()).toBe(de.eventMatching.builder.detailsMissing)
      expect(renderQrCodeCanvas).not.toHaveBeenCalled()

      await write('Kongress Frequency Healing', 'Selbstheilung')
      expect(field('result').exists()).toBe(true)
      expect(field('waiting').exists()).toBe(false)
    })

    it('takes details that are only space for none', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing', ' \n ')

      expect(field('result').exists()).toBe(false)
      expect(field('waiting').text()).toBe(de.eventMatching.builder.detailsMissing)
    })

    it('asks for the name first, whether or not the details are there', async () => {
      mountBuilder()
      await write('Projekt ', '')
      expect(field('waiting').text()).toBe(de.eventMatching.builder.waiting)

      await write('Projekt ', 'Selbstheilung')
      expect(field('waiting').text()).toBe(de.eventMatching.builder.waiting)
    })

    it('takes back the result when the details are taken out', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing', 'Selbstheilung')
      expect(field('code-picture').exists()).toBe(true)

      await write('Kongress Frequency Healing', '')
      expect(field('result').exists()).toBe(false)
      expect(field('waiting').text()).toBe(de.eventMatching.builder.detailsMissing)
    })

    it('takes a sentence without the suggested word as it is', async () => {
      mountBuilder()
      await write('Training Rücken ohne Bewegung')

      expect(query().interest).toBe('Training Rücken ohne Bewegung')
    })
  })

  describe('the sentence as a guest will read it', () => {
    it('stands under the field, in quotation marks, and follows the typing', async () => {
      mountBuilder()
      expect(field('preview').text()).toBe('„Ich liebe Projekt“')

      await write('Kongress Frequency Healing')
      expect(field('preview').text()).toBe('„Ich liebe Kongress Frequency Healing“')
    })

    it('shows the open sentence while the field is empty', async () => {
      mountBuilder()
      await write('')

      expect(field('preview').text()).toBe('„Ich liebe …“')
    })

    // The words in front are the entry form's own, read from where that form reads them, so
    // the two cannot drift apart: what is previewed here is what the entry will say.
    it('starts with the words the entry form puts in front of an interest', async () => {
      mountBuilder()
      i18n.global.locale.value = 'en'
      await write('Congress Frequency Healing')

      expect(field('preview').text()).toBe(
        `“${en.matching.type.interesse.prefix} Congress Frequency Healing”`,
      )
    })
  })

  describe('the link', () => {
    it('is the entrance of this community with the sentence, the details, remote and the version', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing', 'Selbstheilung')

      // The whole string: nothing in front, nothing behind.
      expect(link()).toBe(
        `${HOME}/project?interest=Kongress+Frequency+Healing&details=Selbstheilung&remote=1&v=1`,
      )
    })

    it('carries the details once there are some, without the space around them', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing', '  Selbstheilung, Biohacking, Longevity \n')

      expect(query()).toEqual({
        interest: 'Kongress Frequency Healing',
        details: 'Selbstheilung, Biohacking, Longevity',
        remote: '1',
        v: '1',
      })
    })

    it('says remote=0 once the box is unticked, and remote=1 with it ticked', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')
      const box = wrapper.find('input[type="checkbox"]')
      expect(box.element.checked).toBe(true)

      await box.setValue(false)
      expect(query().remote).toBe('0')

      await box.setValue(true)
      expect(query().remote).toBe('1')
    })

    // The contract of the link names four parameters. A fifth would be a promise to everybody
    // who was ever sent one.
    it('never carries anything but the four parameters', async () => {
      mountBuilder()
      for (const [sentence, details] of [
        ['Kongress A', 'mit Details'],
        ['Kurs ?x=1&y=2#z', 'a=b&c=d'],
      ]) {
        await write(sentence, details)
        const names = Object.keys(query())
        expect(
          names.filter((name) => !['interest', 'details', 'remote', 'v'].includes(name)),
        ).toEqual([])
        expect(query().v).toBe('1')
      }
    })

    // The entrance reads `route.query`. So what matters is not how the link looks but what
    // vue-router makes of it again -- every character a title may hold, line breaks included.
    it('gives the router back exactly what was written', async () => {
      const sentence = 'Kongress „Deutschland am Abgrund“ & mehr + 100 % #1 = ? /'
      const details =
        "Erste Zeile: Ärzte, Bäuerinnen, 'Köche'\nZweite Zeile; mit Emoji 🌱 und Ελληνικά"
      mountBuilder()
      await write(sentence, details)

      expect(query()).toEqual({ interest: sentence, details, remote: '1', v: '1' })
      // Plain ASCII, so it survives a mail, a messenger and a QR code alike.
      expect(link()).toMatch(/^[\x21-\x7e]+$/)
    })

    it('stands on the configured address whether or not that ends in a slash', async () => {
      config.COMMUNITY_URL = `${HOME}/`
      mountBuilder()
      await write('Kongress Frequency Healing')

      expect(link().startsWith(`${HOME}/project?interest=`)).toBe(true)
    })

    it('stands on the address in the address bar where the configuration names none', async () => {
      config.COMMUNITY_URL = ''
      mountBuilder()
      await write('Kongress Frequency Healing')

      expect(link().startsWith(`${window.location.origin}/project?interest=`)).toBe(true)
    })
  })

  describe('the limits', () => {
    it('gives the fields the limits a person meets while typing', () => {
      mountBuilder()

      expect(field('sentence').attributes('maxlength')).toBe('160')
      expect(field('details').attributes('maxlength')).toBe('300')
    })

    // `maxlength` is the browser's. This is the page's own: however a longer text got into a
    // field, the link carries 160 and 300 and no more.
    it('builds no more than 160 characters of sentence and 300 of details into the link', async () => {
      mountBuilder()
      await write(`Kongress ${'a'.repeat(152)}`, 'b'.repeat(301))

      expect(query().interest).toHaveLength(160)
      expect(query().interest).toBe(`Kongress ${'a'.repeat(151)}`)
      expect(query().details).toBe('b'.repeat(300))
    })

    it('counts the details as they are typed, up to the limit', async () => {
      mountBuilder()
      expect(field('details-count').text()).toBe('0 / 300')

      await write('Kongress A', 'Zwölf Zeichen')
      expect(field('details-count').text()).toBe('13 / 300')

      await write('Kongress A', 'b'.repeat(305))
      expect(field('details-count').text()).toBe('300 / 300')
    })

    // An emoji is two units long. Cut between them, half of it would travel as "�".
    it('does not cut a character in two at the limit', async () => {
      mountBuilder()
      await write(`${'a'.repeat(159)}🌱`, `${'b'.repeat(299)}🌱`)

      expect(query().interest).toBe('a'.repeat(159))
      expect(query().details).toBe('b'.repeat(299))
    })

    it('keeps a character that ends exactly on the limit', async () => {
      mountBuilder()
      await write(`${'a'.repeat(158)}🌱`)

      expect(query().interest).toBe(`${'a'.repeat(158)}🌱`)
    })

    // The cut falls behind the emoji, not into it: nothing of it is taken away.
    it('keeps a whole character that stands right in front of the cut', async () => {
      mountBuilder()
      await write(`${'a'.repeat(158)}🌱x`)

      expect(query().interest).toBe(`${'a'.repeat(158)}🌱`)
    })
  })

  describe('the code', () => {
    it('is drawn from exactly the link in the field', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing', 'Selbstheilung')

      expect(renderQrCodeCanvas).toHaveBeenLastCalledWith(link())
      expect(paper.drawImage.mock.lastCall[0].link).toBe(link())
    })

    // The generator draws no margin, and the picture is meant for slides. The standard asks for
    // four modules of white around a code; laid on a ground that was not white, one of two
    // readers tried gave up without them and read the code with them. Cut from the generator's
    // own cell size.
    it('stands on white with a margin of four modules around it', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')
      const code = paper.drawImage.mock.lastCall[0]
      const margin = 4 * MODULE

      expect(paper.fillStyle).toBe('#fff')
      expect(paper.fillRect).toHaveBeenLastCalledWith(
        0,
        0,
        code.width + 2 * margin,
        code.height + 2 * margin,
      )
      expect(paper.drawImage).toHaveBeenLastCalledWith(code, margin, margin)
      // White first, then the code: the other way round the sheet would be white all over.
      expect(paper.fillRect.mock.invocationCallOrder.at(-1)).toBeLessThan(
        paper.drawImage.mock.invocationCallOrder.at(-1),
      )
      expect(field('code-picture').attributes('src')).toBe(
        `data:image/png;sheet=${code.width + 2 * margin}x${code.height + 2 * margin};code=${link()}`,
      )
    })

    it('has a text for whoever cannot see it', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')

      expect(field('code-picture').attributes('alt')).toBe(de.eventMatching.builder.codeAlt)
    })

    // Drawing a code holds a phone for a tenth of a second and more. At every key that made
    // typing stutter, so the code waits until the host pauses.
    describe('waiting for the host to pause', () => {
      it('is not drawn while the host types, and is drawn once they pause', async () => {
        mountBuilder()
        await type('Kongress Frequency Healing')
        await wait(PAUSE - 1)
        expect(renderQrCodeCanvas).not.toHaveBeenCalled()
        expect(field('code-picture').exists()).toBe(false)

        await wait(1)
        expect(renderQrCodeCanvas.mock.calls).toEqual([[link()]])
        expect(field('code-picture').attributes('src')).toContain(`code=${link()}`)
      })

      it('starts the wait anew with every key, and draws the last link only', async () => {
        mountBuilder()
        await type('Kongress A')
        await wait(PAUSE - 100)
        await type('Kongress AB')
        await wait(PAUSE - 100)
        expect(renderQrCodeCanvas).not.toHaveBeenCalled()

        await wait(100)
        expect(link()).toContain('Kongress+AB')
        expect(renderQrCodeCanvas.mock.calls).toEqual([[link()]])
      })

      // A space at the end of a word changes nothing in the link. It is a key all the same:
      // counted from the letter before it, the pause would end as the next word begins.
      it('starts the wait anew with a key that leaves the link as it was', async () => {
        mountBuilder()
        await type('Kongress A')
        await wait(PAUSE - 100)
        const before = link()
        await type('Kongress A ')
        expect(link()).toBe(before)
        await wait(PAUSE - 100)
        expect(renderQrCodeCanvas).not.toHaveBeenCalled()

        await wait(100)
        expect(renderQrCodeCanvas.mock.calls).toEqual([[before]])
      })

      it('does the same in the details', async () => {
        mountBuilder()
        await type('Kongress A', 'Selbstheilung')
        await wait(PAUSE - 100)
        await type('Kongress A', 'Selbstheilung ')
        await wait(PAUSE - 100)
        expect(renderQrCodeCanvas).not.toHaveBeenCalled()

        await wait(100)
        expect(renderQrCodeCanvas.mock.calls).toEqual([[link()]])
      })

      it('draws nothing again for a key that leaves a link as it was whose code is there', async () => {
        mountBuilder()
        await write('Kongress A')
        expect(renderQrCodeCanvas).toHaveBeenCalledTimes(1)

        await type('Kongress A ')
        await wait(PAUSE * 3)
        expect(renderQrCodeCanvas).toHaveBeenCalledTimes(1)
        expect(field('code-picture').classes()).not.toContain('is-waiting')
      })

      // Typed on and taken back before the pause is over: the code in the box is this link's.
      it('draws nothing again for a link that comes back to the one whose code is there', async () => {
        mountBuilder()
        await write('Kongress A')
        await type('Kongress AB')
        expect(field('code-picture').classes()).toContain('is-waiting')

        await type('Kongress A')
        expect(field('code-picture').classes()).not.toContain('is-waiting')
        await wait(PAUSE * 3)
        expect(renderQrCodeCanvas).toHaveBeenCalledTimes(1)
      })

      it('waits after a tick of the box as after a key', async () => {
        mountBuilder()
        await write('Kongress A')
        renderQrCodeCanvas.mockClear()

        await wrapper.find('input[type="checkbox"]').setValue(false)
        await wait(PAUSE - 1)
        expect(renderQrCodeCanvas).not.toHaveBeenCalled()

        await wait(1)
        expect(renderQrCodeCanvas.mock.calls).toEqual([[link()]])
        expect(link()).toContain('remote=0')
      })

      // What stands in the box meanwhile is the code of the link BEFORE. It is shown faded, so
      // nobody takes it for the code of the link above it.
      it('shows the code of the link before faded until the new one is drawn', async () => {
        mountBuilder()
        await write('Kongress A')
        const before = field('code-picture').attributes('src')
        expect(field('code-picture').classes()).not.toContain('is-waiting')

        await type('Kongress AB')
        expect(field('code-picture').attributes('src')).toBe(before)
        expect(field('code-picture').classes()).toContain('is-waiting')

        await wait(PAUSE)
        expect(field('code-picture').attributes('src')).toContain(`code=${link()}`)
        expect(field('code-picture').classes()).not.toContain('is-waiting')
      })

      it('draws nothing for a name taken out again before the pause is over', async () => {
        mountBuilder()
        await type('Kongress A')
        await wait(PAUSE - 1)
        await type('Projekt ')
        await wait(PAUSE * 3)

        expect(renderQrCodeCanvas).not.toHaveBeenCalled()
      })

      it('forgets the code when the name is taken out', async () => {
        mountBuilder()
        await write('Kongress A')
        expect(field('code-picture').exists()).toBe(true)

        await type('Projekt ')
        await type('Kongress B')

        // Until the new one is drawn the box is empty rather than showing the code of "A".
        expect(field('code').exists()).toBe(true)
        expect(field('code-picture').exists()).toBe(false)
      })

      it('draws nothing once the page has been left', async () => {
        mountBuilder()
        await type('Kongress A')
        wrapper.unmount()
        wrapper = undefined
        await wait(PAUSE * 3)

        expect(renderQrCodeCanvas).not.toHaveBeenCalled()
      })
    })

    describe('while a drawing is under way', () => {
      it('does not let a slower drawing of an earlier link land on the newer one', async () => {
        const held = heldDrawings()
        mountBuilder()
        await write('Kongress A')
        await write('Kongress AB')
        expect(held.map((drawing) => drawing.address)).toEqual([
          `${HOME}/project?interest=Kongress+A&details=Selbstheilung&remote=1&v=1`,
          `${HOME}/project?interest=Kongress+AB&details=Selbstheilung&remote=1&v=1`,
        ])

        held[1].finish()
        await flushPromises()
        held[0].finish()
        await flushPromises()

        expect(link()).toContain('Kongress+AB')
        expect(field('code-picture').attributes('src')).toContain(`code=${link()}`)
        expect(field('code-picture').classes()).not.toContain('is-waiting')
      })

      it('does not let an earlier drawing that FAILS take the newer code away', async () => {
        const held = heldDrawings()
        mountBuilder()
        await write('Kongress A')
        await write('Kongress AB')

        held[1].finish()
        await flushPromises()
        held[0].fail(new Error('cannot load image'))
        await flushPromises()

        expect(field('code-failed').exists()).toBe(false)
        expect(field('code-picture').attributes('src')).toContain(`code=${link()}`)
      })

      // One link, drawn twice: typed, changed, typed again. The drawing started last decides,
      // also where the earlier one ends later and ends badly.
      it('does not let an earlier drawing of the SAME link undo the later one', async () => {
        const held = heldDrawings()
        mountBuilder()
        await write('Kongress A')
        await write('Kongress AB')
        await write('Kongress A')
        expect(held.map((drawing) => drawing.address.includes('Kongress+A&'))).toEqual([
          true,
          false,
          true,
        ])

        held[2].finish()
        await flushPromises()
        held[0].fail(new Error('cannot load image'))
        await flushPromises()

        expect(field('code-failed').exists()).toBe(false)
        expect(field('code-picture').attributes('src')).toContain(`code=${link()}`)
      })

      // The other order: the earlier one first. It is the code of a link that is no longer on
      // the page, so it is not shown at all.
      it('drops a drawing that lands after its link has gone', async () => {
        const held = heldDrawings()
        mountBuilder()
        await write('Kongress A')
        await write('Kongress AB')

        held[0].finish()
        await flushPromises()
        expect(field('code-picture').exists()).toBe(false)

        held[1].finish()
        await flushPromises()
        expect(field('code-picture').attributes('src')).toContain('Kongress+AB&')
      })
    })

    describe('saved as a file', () => {
      let saved

      beforeEach(() => {
        saved = []
        // jsdom would try to go where the link points. What matters is what it was handed.
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
          saved.push({ href: this.getAttribute('href'), download: this.getAttribute('download') })
        })
      })

      const press = async () => {
        await field('download-code').trigger('click')
        await flushPromises()
      }

      it('is the picture that is shown, under its file name', async () => {
        mountBuilder()
        await write('Kongress Frequency Healing')
        await press()

        expect(saved).toEqual([
          {
            href: field('code-picture').attributes('src'),
            download: 'gradido-project-matching.png',
          },
        ])
        expect(saved[0].href).toContain(`code=${link()}`)
      })

      // Pressed right after the last key the button must not do nothing, and must not save the
      // code of the link before either.
      it('does not wait for the pause: pressed while typing, it draws at once and saves that', async () => {
        mountBuilder()
        await write('Kongress A')
        await type('Kongress AB')
        renderQrCodeCanvas.mockClear()
        await press()

        expect(link()).toContain('Kongress+AB')
        expect(renderQrCodeCanvas.mock.calls).toEqual([[link()]])
        expect(saved.map((file) => file.href)).toEqual([expect.stringContaining(`code=${link()}`)])

        // ...and the drawing that was waiting for the pause is not made a second time.
        await wait(PAUSE * 3)
        expect(renderQrCodeCanvas).toHaveBeenCalledTimes(1)
      })

      it('saves nothing where the host types on while it is drawn', async () => {
        const held = heldDrawings()
        mountBuilder()
        await type('Kongress A')
        await press()
        await type('Kongress AB')
        held[0].finish()
        await flushPromises()

        expect(saved).toEqual([])
      })

      // ...and not the code of the link before in its place, which is still in the box then.
      it('does not save the code of an earlier link either, where the host types on', async () => {
        mountBuilder()
        await write('Kongress A')
        const held = heldDrawings()
        await type('Kongress AB')
        await press()
        await type('Kongress ABC')
        held[0].finish()
        await flushPromises()

        expect(field('code-picture').attributes('src')).toContain('interest=Kongress+A&details')
        expect(saved).toEqual([])
      })

      it('cannot be pressed a second time while it is drawn', async () => {
        const held = heldDrawings()
        mountBuilder()
        await type('Kongress A')
        await press()
        expect(field('download-code').attributes('disabled')).toBeDefined()

        await press()
        expect(held).toHaveLength(1)

        held[0].finish()
        await flushPromises()
        expect(saved).toHaveLength(1)
        expect(field('download-code').attributes('disabled')).toBeUndefined()
      })

      it('saves nothing once the page has been left while it was drawn', async () => {
        const held = heldDrawings()
        mountBuilder()
        await type('Kongress A')
        await press()
        wrapper.unmount()
        wrapper = undefined
        held[0].finish()
        await flushPromises()

        expect(saved).toEqual([])
      })

      it('is on offer again after a drawing that failed', async () => {
        const held = heldDrawings()
        mountBuilder()
        await type('Kongress A')
        await press()
        held[0].fail(new Error('cannot load image'))
        await flushPromises()

        expect(saved).toEqual([])
        expect(field('download-code').attributes('disabled')).toBeUndefined()
      })
    })

    describe('where the link is too long for a code', () => {
      const CYRILLIC = 'я'
      // 1273 characters is what a code holds at the level the coin needs. The details are
      // padded so that the link has exactly `length` of them.
      const writeLinkOf = async (length) => {
        await write('Kongress X', CYRILLIC.repeat(200))
        const padding = length - link().length
        expect(padding).toBeGreaterThanOrEqual(0)
        expect(padding).toBeLessThanOrEqual(100)
        await write('Kongress X', CYRILLIC.repeat(200) + 'a'.repeat(padding))
        expect(link()).toHaveLength(length)
      }

      it('still draws the longest link a code can hold', async () => {
        mountBuilder()
        await writeLinkOf(1273)

        expect(field('code-too-long').exists()).toBe(false)
        expect(renderQrCodeCanvas).toHaveBeenLastCalledWith(link())
        expect(field('code-picture').exists()).toBe(true)
      })

      it('says so one character further, instead of asking the generator', async () => {
        mountBuilder()
        await writeLinkOf(1273)
        renderQrCodeCanvas.mockClear()
        await writeLinkOf(1274)

        expect(field('code-too-long').text()).toBe(de.eventMatching.builder.codeTooLong)
        expect(field('code-picture').exists()).toBe(false)
        expect(renderQrCodeCanvas.mock.calls.filter(([address]) => address.length > 1273)).toEqual(
          [],
        )
      })

      // At once, not after the pause: the note is a fact about the link, nothing is drawn for it.
      it('says so at once, and takes the code of the shorter link away', async () => {
        mountBuilder()
        await writeLinkOf(1273)
        await type('Kongress X', `${CYRILLIC.repeat(200)}aaaaaaaaaa`)

        expect(field('code-too-long').exists()).toBe(true)
        expect(field('code-picture').exists()).toBe(false)
      })

      it('offers no file then', async () => {
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
        mountBuilder()
        await writeLinkOf(1274)
        renderQrCodeCanvas.mockClear()

        expect(field('download-code').attributes('disabled')).toBeDefined()
        await field('download-code').trigger('click')
        await flushPromises()
        expect(renderQrCodeCanvas).not.toHaveBeenCalled()
        expect(click).not.toHaveBeenCalled()
      })

      it('keeps the link and the paragraph, which do not depend on the code', async () => {
        mountBuilder()
        await writeLinkOf(1274)

        expect(link()).toHaveLength(1274)
        expect(field('mail').element.value.endsWith(`\n${link()}`)).toBe(true)
      })

      it('draws again once the text is shorter', async () => {
        mountBuilder()
        await writeLinkOf(1274)
        await write('Kongress X', 'kurz')

        expect(field('code-too-long').exists()).toBe(false)
        expect(field('code-picture').attributes('src')).toContain(`code=${link()}`)
        expect(field('download-code').attributes('disabled')).toBeUndefined()
      })

      // The number is the generator's, not ours: this holds it against the real one, with the
      // wallet's own settings. jsdom has no canvas, so drawing is let through unseen.
      it('is the limit of the generator the wallet uses', async () => {
        const { qrCodeOptions } = await vi.importActual('@/utils/qrCode')
        const { qrcanvas } = await vi.importActual('qrcanvas')
        HTMLCanvasElement.prototype.getContext.mockImplementation(
          () => new Proxy({}, { get: (target, name) => target[name] ?? (() => ({})) }),
        )
        const drawing = (length) => () => qrcanvas(qrCodeOptions('a'.repeat(length), null))

        expect(drawing(1273)).not.toThrow()
        expect(drawing(1274)).toThrow(/overflow/)
      })
    })

    describe('where it cannot be drawn', () => {
      const refuse = () =>
        renderQrCodeCanvas.mockImplementation(() =>
          Promise.reject(new Error('cannot load image: /img/gdd-coin.png')),
        )
      const draw = () =>
        renderQrCodeCanvas.mockImplementation((address) => Promise.resolve(codeOf(address)))

      beforeEach(refuse)

      it('says so in the place of the code', async () => {
        mountBuilder()
        await write('Kongress Frequency Healing')

        expect(field('code-failed').text()).toBe(de.eventMatching.builder.codeFailed)
        expect(field('code-picture').exists()).toBe(false)
      })

      it('leaves the link and the paragraph as they are', async () => {
        mountBuilder()
        await write('Kongress Frequency Healing')

        expect(link()).toBe(
          `${HOME}/project?interest=Kongress+Frequency+Healing&details=Selbstheilung&remote=1&v=1`,
        )
        expect(field('mail').element.value.endsWith(`\n${link()}`)).toBe(true)
      })

      it('tries again with the next link', async () => {
        mountBuilder()
        await write('Kongress Frequency Healing')
        draw()
        await write('Kongress Frequency Healing 2026')

        expect(field('code-failed').exists()).toBe(false)
        expect(field('code-picture').attributes('src')).toContain(`code=${link()}`)
      })

      // The note is about the code, not about one link. Taken away for the length of every
      // pause, it would blink at each word the host writes.
      it('goes on saying so while the host types on, until a code comes', async () => {
        mountBuilder()
        await write('Kongress Frequency Healing')
        draw()
        await type('Kongress Frequency Healing 2026')
        expect(field('code-failed').exists()).toBe(true)

        await wait(PAUSE)
        expect(field('code-failed').exists()).toBe(false)
        expect(field('code-picture').attributes('src')).toContain(`code=${link()}`)
      })

      // The link has not changed, so nothing would try again by itself. The button does.
      it('tries again when the button is pressed, and saves the code if it comes', async () => {
        const saved = []
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
          saved.push(this.getAttribute('href'))
        })
        mountBuilder()
        await write('Kongress Frequency Healing')
        expect(field('download-code').attributes('disabled')).toBeUndefined()

        await field('download-code').trigger('click')
        await flushPromises()
        expect(renderQrCodeCanvas).toHaveBeenCalledTimes(2)
        expect(saved).toEqual([])
        expect(field('code-failed').exists()).toBe(true)

        draw()
        await field('download-code').trigger('click')
        await flushPromises()
        expect(saved).toEqual([expect.stringContaining(`code=${link()}`)])
        expect(field('code-failed').exists()).toBe(false)
        expect(field('code-picture').exists()).toBe(true)
      })

      it('says the same where the sheet itself cannot be drawn on', async () => {
        draw()
        HTMLCanvasElement.prototype.getContext.mockImplementation(() => null)
        mountBuilder()
        await write('Kongress Frequency Healing')

        expect(field('code-failed').exists()).toBe(true)
      })
    })
  })

  describe('the paragraph for the invitation', () => {
    it('is the text with the link on a line of its own at the end', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')

      expect(field('mail').element.value).toBe(`${de.eventMatching.builder.mailText}\n${link()}`)
    })
  })

  describe('copying', () => {
    let writeText

    // The wallet always has a clipboard: where the browser brings none, main.js loads one. So
    // what can happen is that copying is refused, not that the call is missing.
    beforeEach(() => {
      writeText = vi.fn().mockResolvedValue()
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    })

    afterEach(() => {
      delete navigator.clipboard
    })

    it('copies the link and says so', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')
      await field('copy-link').trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledTimes(1)
      expect(writeText).toHaveBeenCalledWith(link())
      expect(toasts.toastSuccess).toHaveBeenCalledTimes(1)
      expect(toasts.toastSuccess).toHaveBeenCalledWith(de.eventMatching.builder.linkCopied)
      expect(toasts.toastError).not.toHaveBeenCalled()
    })

    it('copies the paragraph, link included, and says so', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')
      await field('copy-mail').trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledTimes(1)
      expect(writeText).toHaveBeenCalledWith(field('mail').element.value)
      expect(writeText.mock.lastCall[0].endsWith(link())).toBe(true)
      expect(toasts.toastSuccess).toHaveBeenCalledTimes(1)
      expect(toasts.toastSuccess).toHaveBeenCalledWith(de.eventMatching.builder.mailCopied)
    })

    it('does not say "copied" before it is', async () => {
      let finish
      writeText.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
      mountBuilder()
      await write('Kongress Frequency Healing')
      await field('copy-link').trigger('click')
      await flushPromises()
      expect(toasts.toastSuccess).not.toHaveBeenCalled()

      finish()
      await flushPromises()
      expect(toasts.toastSuccess).toHaveBeenCalledTimes(1)
    })

    it('says that copying is not possible where the device refuses', async () => {
      writeText.mockRejectedValue(new Error('NotAllowedError'))
      mountBuilder()
      await write('Kongress Frequency Healing')
      await field('copy-link').trigger('click')
      await flushPromises()

      expect(toasts.toastSuccess).not.toHaveBeenCalled()
      expect(toasts.toastError).toHaveBeenCalledTimes(1)
      expect(toasts.toastError).toHaveBeenCalledWith(de.eventMatching.builder.copyFailed)
    })

    it('marks the whole text when a field of the result is entered, for copying by hand', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')
      for (const name of ['link', 'mail']) {
        const select = vi.spyOn(field(name).element, 'select')
        await field(name).trigger('focus')
        expect(select).toHaveBeenCalledTimes(1)
        expect(field(name).attributes('readonly')).toBeDefined()
      }
    })
  })

  describe('the suggested word and the language', () => {
    it('follows the language for as long as nobody has written in the field', async () => {
      mountBuilder()
      i18n.global.locale.value = 'en'
      await flushPromises()

      expect(field('sentence').element.value).toBe('Project ')
      expect(field('result').exists()).toBe(false)
    })

    it('leaves a sentence the host has written alone', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')
      i18n.global.locale.value = 'en'
      await flushPromises()

      expect(field('sentence').element.value).toBe('Kongress Frequency Healing')
      expect(query().interest).toBe('Kongress Frequency Healing')
    })

    // The host took the space away, so the field counts as written in and stays. But the bare
    // word of the language before is nobody's project in the new language either.
    it('does not take the suggested word of the language before for a name', async () => {
      mountBuilder()
      await write('Projekt')
      i18n.global.locale.value = 'en'
      await flushPromises()

      expect(field('sentence').element.value).toBe('Projekt')
      expect(field('result').exists()).toBe(false)
    })

    // Typed by hand, the word of the new language is something the host wrote: it was never
    // suggested to them.
    it('takes what the host then writes, whatever word it is', async () => {
      mountBuilder()
      await write('Projekt')
      i18n.global.locale.value = 'en'
      await flushPromises()
      await write('Project')

      expect(query().interest).toBe('Project')
    })

    it('follows the language again and again while the field stays untouched', async () => {
      mountBuilder()
      i18n.global.locale.value = 'en'
      await flushPromises()
      i18n.global.locale.value = 'de'
      await flushPromises()

      expect(field('sentence').element.value).toBe('Projekt ')
      expect(field('result').exists()).toBe(false)
    })
  })

  describe('what is typed stays in this browser', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'EventMatchingBuilder.vue'),
      'utf8',
    )
      // The comments say what the page does not do, in the very words looked for below.
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

    it('reads the page without its comments, and finds what it is made of', () => {
      expect(source).toContain('renderQrCodeCanvas')
      expect(source).not.toContain('AI-GENERATED')
    })

    // The page's own code. What the built wallet asks for while a host types was counted in the
    // browser: the coin of the code and nothing else.
    it.each([
      ['a store', /vuex|pinia|useStore|useWalletStore|\$store/],
      [
        'a request',
        /apollo|useQuery|useLazyQuery|useMutation|fetch\(|XMLHttpRequest|sendBeacon|new Image|WebSocket|EventSource/,
      ],
      ['storage on the device', /localStorage|sessionStorage|indexedDB|document\.cookie/],
    ])('names neither %s in its own code', (_what, pattern) => {
      expect(source).not.toMatch(pattern)
    })

    // The browser keeps what is typed into fields in a memory of its own, and offers it again.
    it('asks the browser not to keep the sentence for later either', () => {
      mountBuilder()

      expect(field('sentence').attributes('autocomplete')).toBe('off')
    })

    it('writes nothing to the device while the host types, copies and saves', async () => {
      const stored = vi.spyOn(Storage.prototype, 'setItem')
      const cookie = vi.spyOn(Document.prototype, 'cookie', 'set')
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: vi.fn().mockResolvedValue() },
      })
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      mountBuilder()
      await write('Kongress Frequency Healing', 'Selbstheilung')
      for (const name of ['copy-link', 'copy-mail', 'download-code']) {
        await field(name).trigger('click')
        await flushPromises()
      }
      delete navigator.clipboard

      expect(toasts.toastSuccess).toHaveBeenCalledTimes(2)
      expect(stored).not.toHaveBeenCalled()
      expect(cookie).not.toHaveBeenCalled()
    })
  })

  describe('for somebody who does not see the page', () => {
    it('names the sentence field by its question and the words in front of it', async () => {
      mountBuilder()
      const names = field('sentence').attributes('aria-labelledby').split(' ')

      expect(names.map((id) => wrapper.find(`#${id}`).text())).toEqual([
        de.matching.new.completeSentence,
        de.matching.type.interesse.prefix,
      ])
    })

    // What a screen reader says after the name of a field: the whole sentence and the hint for
    // the sentence, the hint and the count for the details, the hint for the box.
    it('describes each field by what stands under it', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing', 'Selbstheilung')
      const described = (element) =>
        element
          .attributes('aria-describedby')
          .split(' ')
          .map((id) => wrapper.find(`#${id}`).text())

      expect(described(field('sentence'))).toEqual([
        '„Ich liebe Kongress Frequency Healing“',
        de.eventMatching.builder.sentenceHint,
      ])
      expect(described(field('details'))).toEqual([
        de.eventMatching.builder.detailsHint,
        '13 / 300',
      ])
      expect(described(wrapper.find('input[type="checkbox"]'))).toEqual([
        de.eventMatching.builder.remoteHint,
      ])
    })

    it('says that the details are required', () => {
      mountBuilder()

      expect(field('details').attributes('aria-required')).toBe('true')
      expect(field('sentence').attributes('aria-required')).toBeUndefined()
    })

    it('points every description at something that is there exactly once', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')
      const pointers = wrapper
        .findAll('[aria-describedby], [aria-labelledby], label[for]')
        .flatMap((element) =>
          ['aria-describedby', 'aria-labelledby', 'for']
            .map((name) => element.attributes(name))
            .filter(Boolean)
            .flatMap((ids) => ids.split(' ')),
        )

      expect(pointers.length).toBeGreaterThanOrEqual(10)
      for (const id of pointers) {
        expect(document.querySelectorAll(`[id="${id}"]`), id).toHaveLength(1)
      }
    })

    it('gives each field of the result a label of its own', async () => {
      mountBuilder()
      await write('Kongress Frequency Healing')

      expect(wrapper.find('label[for="event-matching-link"]').text()).toBe(
        de.eventMatching.builder.linkLabel,
      )
      expect(wrapper.find('label[for="event-matching-mail"]').text()).toBe(
        de.eventMatching.builder.mailLabel,
      )
    })
  })
})
