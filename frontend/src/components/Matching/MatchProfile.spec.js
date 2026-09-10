// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createI18n } from 'vue-i18n'
import MatchProfile from './MatchProfile.vue'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push })),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      matching: {
        tabs: { about: 'Über mich' },
        entries: { remote: 'Überregional' },
        type: {
          interesse: { prefix: 'Ich liebe' },
          angebot: { prefix: 'Ich biete' },
          gesuch: { prefix: 'Ich suche' },
        },
        profile: {
          aria: 'Profil von {name}',
          matchesMine: 'passt zu',
          more: '{n} weitere',
          sendEmail: 'E-Mail senden',
          sendGradido: 'Gradido senden',
        },
      },
    },
  },
})

// BModal teleports and only renders when open; the collapse hides its body. We
// care about the profile's own logic, not those two house widgets, so we stub
// them to render their slots inline and read the open state off the heading.
const stubs = {
  BModal: {
    template: '<div class="modal-stub"><slot name="title" /><slot /><slot name="footer" /></div>',
  },
  BCollapse: {
    props: ['modelValue'],
    template: '<div class="collapse-stub" :data-open="String(modelValue)"><slot /></div>',
  },
  CollapseIcon: true,
  'i-mdi-email-fast-outline': true,
}

const entry = (uuid, summary, strength, details = null, remote = false) => ({
  uuid,
  summary,
  details,
  strength,
  remote,
})

function mountProfile(match) {
  return mount(MatchProfile, {
    props: { modelValue: true, match },
    global: { plugins: [i18n], stubs },
  })
}

const baseMatch = (over = {}) => ({
  uuid: 'user-uuid-1',
  name: 'Sofia',
  community: { uuid: 'community-uuid-1', name: 'Gradido Künzelsau' },
  aboutMe: 'Ich lebe für Musik und den Garten.',
  channels: {},
  ...over,
})

describe('MatchProfile', () => {
  beforeEach(() => push.mockClear())

  it('shows the name and community in the head', () => {
    const wrapper = mountProfile(baseMatch())
    expect(wrapper.find('.profile-name').text()).toBe('Sofia')
    expect(wrapper.find('.profile-community').text()).toBe('Gradido Künzelsau')
  })

  it('shows "Über mich" only when there is text', () => {
    const withAbout = mountProfile(baseMatch())
    expect(withAbout.find('.about-label').exists()).toBe(true)
    expect(withAbout.find('.about-text').text()).toContain('Musik')

    const withoutAbout = mountProfile(baseMatch({ aboutMe: null }))
    expect(withoutAbout.find('.about-label').exists()).toBe(false)
  })

  it('renders one area per non-empty channel; an empty channel is gone', () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: {
          interesse: [entry('e1', 'Permakultur', 0.57)],
          angebot: [], // empty: must not render
          gesuch: [entry('e2', 'einen Schlosser', null)],
        },
      }),
    )
    const areas = wrapper.findAll('.profile-area')
    expect(areas).toHaveLength(2)
    const stems = wrapper.findAll('.area-stem').map((s) => s.text())
    expect(stems).toEqual(['Ich liebe', 'Ich suche'])
  })

  it('opens an area with a match, keeps a match-less area closed', () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: {
          interesse: [entry('e1', 'Permakultur', 0.57)], // has a match -> open
          gesuch: [entry('e2', 'einen Schlosser', null)], // no match -> closed
        },
      }),
    )
    const heads = wrapper.findAll('.area-head')
    expect(heads[0].attributes('aria-expanded')).toBe('true')
    expect(heads[1].attributes('aria-expanded')).toBe('false')
  })

  it('sorts matches to the top by strength and folds the rest behind "X weitere"', async () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: {
          angebot: [
            entry('a', 'schwächerer Treffer', 0.4),
            entry('b', 'stärkerer Treffer', 0.6),
            entry('c', 'kein Treffer', null),
          ],
        },
      }),
    )
    // Two open, strongest first.
    let shown = wrapper.findAll('.entry-summary').map((s) => s.text())
    expect(shown).toEqual(['stärkerer Treffer', 'schwächerer Treffer'])

    // One entry is folded away.
    const more = wrapper.find('.more-btn')
    expect(more.exists()).toBe(true)
    expect(more.text()).toBe('1 weitere')

    await more.trigger('click')
    shown = wrapper.findAll('.entry-summary').map((s) => s.text())
    expect(shown).toHaveLength(3)
    expect(wrapper.find('.more-btn').exists()).toBe(false)
  })

  // Bernd, 10.09.2026: with two open, a third match lay behind "X weitere".
  it('keeps every match open, however many, and folds only the rest', () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: {
          angebot: [
            entry('r1', 'kein Treffer, der neueste', null),
            entry('m1', 'Treffer A', 0.46),
            entry('m2', 'Treffer B', 0.865),
            entry('r2', 'kein Treffer, älter', null),
            entry('m3', 'Treffer C', 0.595),
          ],
        },
      }),
    )
    const shown = wrapper.findAll('.entry-summary').map((s) => s.text())
    expect(shown).toEqual(['Treffer B', 'Treffer C', 'Treffer A'])
    expect(wrapper.find('.more-btn').text()).toBe('2 weitere')
  })

  it('stands a single match open beside the newest of the rest', () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: {
          gesuch: [
            entry('n', 'der neueste', null),
            entry('m', 'der Treffer', 0.73),
            entry('o', 'ein älterer', null),
          ],
        },
      }),
    )
    const shown = wrapper.findAll('.entry-summary').map((s) => s.text())
    expect(shown).toEqual(['der Treffer', 'der neueste'])
    expect(wrapper.find('.more-btn').text()).toBe('1 weitere')
  })

  // The dot is drawn by the stylesheet (.has-dot::before) from three variables; jsdom paints
  // nothing, so what can be read here is which sentence asks for a dot, and with what.
  it('puts a dot before a match only, sized and lit by its step, in the colour of its area', async () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: {
          angebot: [
            entry('s1', 'Stufe eins', 0.46),
            entry('s3', 'Stufe drei', 0.73),
            entry('s4', 'Stufe vier', 0.865),
            entry('s2', 'Stufe zwei', 0.595),
            entry('none', 'kein Treffer', null),
          ],
        },
      }),
    )
    const dots = wrapper
      .findAll('.entry-summary')
      .map((s) => [
        s.element.textContent,
        s.classes('has-dot'),
        s.classes('is-match'),
        s.element.style.getPropertyValue('--dot-size'),
        s.element.style.getPropertyValue('--dot-opacity'),
        s.element.style.getPropertyValue('--dot-color'),
      ])
    expect(dots).toEqual([
      ['Stufe vier', true, true, '12px', '0.865', '#10b981'],
      ['Stufe drei', true, true, '10px', '0.73', '#10b981'],
      ['Stufe zwei', true, true, '9px', '0.595', '#10b981'],
      ['Stufe eins', true, true, '8px', '0.46', '#10b981'],
    ])

    // Unfolded, the rest shows: no dot, no weight, nothing to draw with.
    await wrapper.find('.more-btn').trigger('click')
    const rest = wrapper.findAll('.entry-summary').at(4)
    expect(rest.element.textContent).toBe('kein Treffer')
    expect(rest.classes()).not.toContain('has-dot')
    expect(rest.classes()).not.toContain('is-match')
    expect(rest.attributes('style')).toBeUndefined()
  })

  it('names the entries of mine a match answers, one line each, and none under the rest', async () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: {
          angebot: [
            {
              ...entry('a', 'Botengänge und kleine Erledigungen', 0.865),
              matches: [
                { uuid: 'mine-1', matchingType: 'need', summary: 'jemanden, der zur Post geht' },
                { uuid: 'mine-2', matchingType: 'interest', summary: 'Spaziergänge' },
              ],
            },
            { ...entry('b', 'Kuchen für Feste', 0.46), matches: [] },
            entry('c', 'Chorsingen', null),
          ],
        },
      }),
    )
    await wrapper.find('.more-btn').trigger('click')
    const lines = wrapper
      .findAll('.entry')
      .map((item) => item.findAll('.entry-mine').map((line) => line.element.textContent))
    // The stem is my entry's own, read off its kind - not the area's.
    expect(lines).toEqual([
      ['passt zu Ich suche jemanden, der zur Post geht', 'passt zu Ich liebe Spaziergänge'],
      [],
      [],
    ])
  })

  it('shows a ring as it was: no dot, no line, every area shut', () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: {
          angebot: [entry('a', 'Klavierunterricht', null), entry('b', 'Rasen mähen', null)],
          gesuch: [entry('c', 'einen Schlosser', null)],
        },
      }),
    )
    expect(wrapper.findAll('.area-head').map((h) => h.attributes('aria-expanded'))).toEqual([
      'false',
      'false',
    ])
    expect(wrapper.find('.has-dot').exists()).toBe(false)
    expect(wrapper.find('.is-match').exists()).toBe(false)
    expect(wrapper.find('.entry-mine').exists()).toBe(false)
  })

  it('shows the count as a plain tally, never a score', () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: { angebot: [entry('a', 'x', 0.6), entry('b', 'y', 0.4), entry('c', 'z', null)] },
      }),
    )
    expect(wrapper.find('.area-count').text()).toBe('3')
    // No percentage or raw score leaks into the window.
    expect(wrapper.text()).not.toContain('%')
    expect(wrapper.text()).not.toContain('0.6')
  })

  it('shows the remote badge and details on an entry', () => {
    const wrapper = mountProfile(
      baseMatch({
        channels: { angebot: [entry('a', 'Klavierunterricht', 0.5, 'Auch Hausbesuche', true)] },
      }),
    )
    expect(wrapper.find('.remote-badge').text()).toBe('Überregional')
    expect(wrapper.find('.entry-details').text()).toBe('Auch Hausbesuche')
  })

  it('links the two send buttons to the recipient, e-mail carrying its mode', async () => {
    const wrapper = mountProfile(baseMatch())
    await wrapper.find('.send-gradido').trigger('click')
    expect(push).toHaveBeenCalledWith({ path: '/send/community-uuid-1/user-uuid-1' })

    await wrapper.find('.send-email').trigger('click')
    expect(push).toHaveBeenCalledWith({
      path: '/send/community-uuid-1/user-uuid-1',
      query: { art: 'email' },
    })
  })
})
