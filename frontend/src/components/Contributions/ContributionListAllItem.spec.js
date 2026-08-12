import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { BRow, BCol } from 'bootstrap-vue-next'
import ContributionListAllItem from './ContributionListAllItem'

// This file used to be a byte-identical copy of ContributionListItem.spec.js and mounted
// that component instead — the community row had no coverage at all. It has now, and the
// point of it is the data-protection guarantee: this row shows a deed, never its author.

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      creation: 'Creation',
      '(': '(',
      ')': ')',
      h: 'h',
      moderatorChangedMemo: 'A moderator changed this text',
      contribution: {
        number: 'Contribution no. {number}',
        alert: { denied: 'rejected' },
        creationGroup: { none: '(no group)' },
      },
    },
  },
  datetimeFormats: {
    en: { short: { year: 'numeric', month: 'short', day: 'numeric' } },
  },
})

const mocks = { $filters: { GDD: vi.fn((value) => `${value} GDD`) } }

const PROPS = {
  id: 4711,
  memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
  amount: '200',
  contributionDate: '2022-06-07',
  contributionStatus: 'CONFIRMED',
  creationGroups: [],
}

const mountWrapper = (props = {}) =>
  mount(ContributionListAllItem, {
    global: {
      plugins: [i18n],
      mocks,
      stubs: ['BAvatar', 'VariantIcon'],
      components: { BRow, BCol },
    },
    props: { ...PROPS, ...props },
  })

describe('ContributionListAllItem', () => {
  it('has a DIV .contribution-list-item', () => {
    expect(mountWrapper().find('div.contribution-list-item').exists()).toBe(true)
  })

  it('identifies the contribution by its number', () => {
    const wrapper = mountWrapper()
    expect(wrapper.find('[data-test="contribution-number"]').text()).toBe('Contribution no. 4711')
  })

  it('shows no name, even when a person is handed in', () => {
    // The backend does not send a person (see WalletContributionFilter.test.ts). This is
    // the second lock: should one ever arrive again, the row must still not print it.
    const wrapper = mountWrapper({
      user: { firstName: 'Bibi', lastName: 'Bloxberg', alias: 'bibi-b' },
    })
    const text = wrapper.text()
    for (const name of ['Bibi', 'Bloxberg', 'bibi-b']) {
      expect(text).not.toContain(name)
    }
  })

  it('shows the deed, the group and the amount', () => {
    const wrapper = mountWrapper({ creationGroups: [{ tag: 'choir', name: 'Choir' }] })
    expect(wrapper.text()).toContain('Ich habe 10 Stunden die Elbwiesen von Müll befreit.')
    // The wallet shows the group name only -- the tag is dropped (kept in the admin).
    expect(wrapper.text()).toContain('Choir')
    expect(wrapper.text()).not.toContain('#choir')
    expect(wrapper.text()).toContain('200 GDD')
  })

  it('says "(no group)" when the contribution belongs to none', () => {
    expect(mountWrapper().text()).toContain('(no group)')
  })

  it('marks a denied contribution as rejected', () => {
    expect(mountWrapper({ contributionStatus: 'DENIED' }).text()).toContain('rejected')
  })

  it('does not mark a confirmed contribution as rejected', () => {
    expect(mountWrapper().text()).not.toContain('rejected')
  })
})
