// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { BPagination } from 'bootstrap-vue-next'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { forgetViewport } from './useViewport'
import { PHONE_PAGER_LIMIT, usePagerFit } from './usePagerFit'

/** A window on one side of the layout boundary: `matches` is "at least 1025px wide". */
const windowAt = (matches) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches, media: '', addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )

afterEach(() => {
  forgetViewport()
  vi.unstubAllGlobals()
})

const texts = (wrapper) => wrapper.findAll('li').map((li) => li.text().trim())

describe('usePagerFit', () => {
  it('shows three numbers and no ends on a phone', () => {
    windowAt(false)
    const { pagerLimit, pagerNoEnds } = usePagerFit()
    // The number itself, not the constant: a test against the constant stays green when the
    // constant is what changed.
    expect(pagerLimit.value).toBe(3)
    expect(PHONE_PAGER_LIMIT).toBe(3)
    expect(pagerNoEnds.value).toBe(true)
  })

  it('leaves the desk form as it was', () => {
    windowAt(true)
    const { pagerLimit, pagerNoEnds } = usePagerFit()
    expect(pagerLimit.value).toBe(5)
    expect(pagerNoEnds.value).toBe(false)
  })

  it('keeps the desk form where the browser cannot be asked', () => {
    // jsdom has no matchMedia: this is the state every other spec of the tree runs in.
    const { pagerLimit, pagerNoEnds } = usePagerFit()
    expect(pagerLimit.value).toBe(5)
    expect(pagerNoEnds.value).toBe(false)
  })

  it('takes a page its own number for the desk', () => {
    windowAt(true)
    expect(usePagerFit(3).pagerLimit.value).toBe(3)
  })

  /**
   * ⛔ Asked of the REAL component, not a stub: a stub answers to any prop name it is handed,
   * and `hide-ellipsis` got into four pagers that way (see the foot of Contacts.spec.js).
   * This asserts what the two values DO to bootstrap-vue-next's pager.
   */
  it('really takes the ends off the real pager and leaves three numbers', () => {
    windowAt(false)
    const { pagerLimit, pagerNoEnds } = usePagerFit()
    const props = {
      modelValue: 6,
      perPage: 25,
      totalRows: 290,
      pills: true,
      size: 'lg',
      noEllipsis: true,
    }
    const desk = mount(BPagination, { props })
    const phone = mount(BPagination, {
      props: { ...props, limit: pagerLimit.value, noGotoEndButtons: pagerNoEnds.value },
    })

    // The desk form has ends and five numbers, or the phone form below would prove nothing.
    expect(texts(desk)).toEqual(['«', '‹', '4', '5', '6', '7', '8', '›', '»'])
    expect(texts(phone)).toEqual(['‹', '5', '6', '7', '›'])

    desk.unmount()
    phone.unmount()
  })

  /**
   * ⛔ Why App.vue has to undo a class of the library below 576px: at the first page it marks
   * the middle one of three numbers for hiding there, and the pager read `‹ 1 3 ›`. The rule
   * itself is held in pageEdge.spec.js; this holds that the library still does it, so the
   * rule is not kept alive for nothing.
   */
  it('is given a middle number that the library hides on a narrow phone', () => {
    windowAt(false)
    const { pagerLimit, pagerNoEnds } = usePagerFit()
    const phone = mount(BPagination, {
      props: {
        modelValue: 1,
        perPage: 25,
        totalRows: 290,
        pills: true,
        size: 'lg',
        noEllipsis: true,
        limit: pagerLimit.value,
        noGotoEndButtons: pagerNoEnds.value,
      },
    })
    const hidden = phone
      .findAll('li')
      .filter((li) => li.classes().includes('bv-d-sm-down-none'))
      .map((li) => li.text().trim())
    expect(texts(phone)).toEqual(['‹', '1', '2', '3', '›'])
    expect(hidden).toEqual(['2'])
    phone.unmount()
  })

  /**
   * ⛔ Every pager of the wallet, not the one that was reported. Four pagers carried the same
   * five props, copied from one another; only a search over the files guards the next copy.
   * Comments are stripped first, or the explanations beside the pagers would count.
   */
  it('is what every pager in the wallet is set by, and every pager may wrap', () => {
    const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
    const vueFiles = []
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.vue')) vueFiles.push(full)
      }
    }
    walk(srcRoot)
    expect(vueFiles.length).toBeGreaterThan(50)

    const code = (file) =>
      readFileSync(file, 'utf8')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')

    const pagers = vueFiles.flatMap((file) =>
      [...code(file).matchAll(/<BPagination\b[\s\S]*?\/>/g)].map(([tag]) => ({ file, tag })),
    )
    // The four known ones at least, or an empty search would pass as "all of them".
    expect(pagers.map(({ file }) => file.slice(srcRoot.length + 1)).sort()).toEqual(
      expect.arrayContaining([
        'components/GddTransactionList.vue',
        'components/GdtTransactionList.vue',
        'components/PaginatorRouteParamsPage.vue',
        'pages/Contacts.vue',
      ]),
    )

    const unfit = pagers.filter(
      ({ file, tag }) =>
        !tag.includes(':limit="pagerLimit"') ||
        !tag.includes(':no-goto-end-buttons="pagerNoEnds"') ||
        !/class="[^"]*\bflex-wrap\b/.test(tag) ||
        !/usePagerFit\(/.test(code(file)),
    )
    expect(unfit.map(({ file }) => file.slice(srcRoot.length + 1))).toEqual([])
  })
})
