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
    expect(columns(createWrapper())[1].text()).toBe('2_0')
    expect(columns(createWrapper())[1].classes()).toContain('ml-1')
  })

  // The tooltip renders the date it is given into the span, after the distance: what a reader
  // of the DOM sees is both. A missing date says "null" there and nothing as a distance.
  it('shows each date as a distance in the language of the interface, with the date as tooltip', () => {
    const item = createItem()
    const texts = columns(createWrapper(item)).map((column) => column.text())
    const threeDays = formatDistanceToNow(threeDaysAgo, { addSuffix: true, locale: de })
    const now = formatDistanceToNow(today, { addSuffix: true, locale: de })
    expect(texts.slice(2)).toEqual([
      `${threeDays}${item.createdAt}`,
      `${threeDays}${item.lastAnnouncedAt}`,
      `${now}${item.verifiedAt}`,
      'null',
    ])
  })
})
