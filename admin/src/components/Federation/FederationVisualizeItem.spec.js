// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { BCol, BRow, createBootstrap, vBTooltip } from 'bootstrap-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { FederationVisualizeItem } from './FederationVisualizeItem'

const today = new Date()
const threeDaysAgo = new Date(today)
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

const createItem = (overrides = {}) => ({
  id: 1,
  apiVersion: '2_0',
  createdAt: threeDaysAgo.toISOString(),
  lastAnnouncedAt: threeDaysAgo.toISOString(),
  verifiedAt: today.toISOString(),
  lastErrorAt: null,
  ...overrides,
})

describe('FederationVisualizeItem', () => {
  const createWrapper = (item = createItem()) =>
    mount(FederationVisualizeItem, {
      props: { item },
      global: {
        plugins: [
          createBootstrap(),
          createI18n({ legacy: false, locale: 'de', missingWarn: false, fallbackWarn: false }),
        ],
        // in the build the resolver imports it where the template names it
        directives: { 'b-tooltip': vBTooltip },
        stubs: { BRow, BCol, VariantIcon: true },
      },
    })

  const columns = (wrapper) => wrapper.findAll('.federation-visualize-item > .row > div')
  // The value of a column, without the small name a phone shows above it (`d-lg-none`).
  const valueIn = (column) => {
    const label = column.find('.d-lg-none')
    return label.exists() ? column.text().slice(label.text().length).trim() : column.text()
  }

  it('shows a federation verified since its last announcement as verified', () => {
    const icon = createWrapper().find('variant-icon-stub')
    expect(icon.attributes('icon')).toBe('check')
    expect(icon.attributes('variant')).toBe('success')
  })

  it('shows a federation announced after its verification as not verified', () => {
    const icon = createWrapper(
      createItem({ verifiedAt: threeDaysAgo.toISOString(), lastAnnouncedAt: today.toISOString() }),
    ).find('variant-icon-stub')
    expect(icon.attributes('icon')).toBe('x-circle')
    expect(icon.attributes('variant')).toBe('danger')
  })

  it('shows the api version', () => {
    expect(valueIn(columns(createWrapper())[1])).toBe('2_0')
    expect(columns(createWrapper())[1].classes()).toContain('ml-1')
  })

  // The tooltip renders the date it is given into the span, after the distance: what a reader
  // of the DOM sees is both. A missing date says "null" there and nothing as a distance.
  it('shows each date as a distance in the language of the interface, with the date as tooltip', () => {
    const item = createItem()
    const texts = columns(createWrapper(item)).map(valueIn)
    const threeDays = formatDistanceToNow(threeDaysAgo, { addSuffix: true, locale: de })
    const now = formatDistanceToNow(today, { addSuffix: true, locale: de })
    expect(texts.slice(2)).toEqual([
      `${threeDays}${item.createdAt}`,
      `${threeDays}${item.lastAnnouncedAt}`,
      `${now}${item.verifiedAt}`,
      'null',
    ])
  })

  // On a phone the six cells stand under each other, each with a small name of its own; from
  // 992px on the row of before, under the six heads (CommunityVisualizeItem).
  it('every cell carries its small label below the boundary', () => {
    const cells = columns(createWrapper())
    expect(
      cells.map((cell) =>
        cell
          .classes()
          .filter((c) => c.startsWith('col'))
          .sort(),
      ),
    ).toEqual(cells.map(() => ['col-12', 'col-lg']))
    expect(cells.map((cell) => cell.find('.d-block.d-lg-none').text())).toEqual([
      'federation.verified',
      'federation.apiVersion',
      'federation.createdAt',
      'federation.lastAnnouncedAt',
      'federation.verifiedAt',
      'federation.lastErrorAt',
    ])
  })
})
