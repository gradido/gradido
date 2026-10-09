// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createI18n } from 'vue-i18n'
import de from '@/locales/de.json'
import MatchProfile from './MatchProfile.vue'
import { distanceKm } from '@/composables/useMatches'
import { contactByMemberQuery } from '@/graphql/contacts.graphql'
import { sendChatMessage } from '@/graphql/chat.graphql'

const push = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push })),
}))

// The member who looks at the map. A test that needs another one says so, and the next test
// starts from this one again.
const ME = { gradidoID: '11111111-aaaa-4aaa-8aaa-111111111111', username: 'Maren' }
const storeState = vi.hoisted(() => ({ gradidoID: '', username: '' }))
vi.mock('vuex', () => ({
  useStore: () => ({ state: storeState }),
}))

// The server, as the window asks it: whether the two are contacts (`query`), and the hello
// (`mutate`). Each answers as a test says.
const apollo = vi.hoisted(() => ({ query: vi.fn(), mutate: vi.fn() }))
vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: apollo }),
}))

// The wallet's own German: what stands in the field is Bernd's sentence (E-068), and these tests
// hold it word for word.
const i18n = createI18n({ legacy: false, locale: 'de', messages: { de } })

/**
 * The compose bar has its own spec; here it shows what it was handed and asks as a test says.
 * ⚠️ A stand-in declares whatever names it is given, so it cannot show that the real bar HAS
 * these props: the tests under "with the real compose bar" mount the real one for that.
 */
const ComposeBarStub = {
  name: 'ChatComposeBar',
  props: {
    name: String,
    first: Boolean,
    textOnly: Boolean,
    sending: Boolean,
    failed: Boolean,
    initialText: String,
  },
  emits: ['send'],
  template: '<div class="compose-stub" />',
}

// BModal teleports and only renders when open; the collapse hides its body. We
// care about the profile's own logic, not those two house widgets, so we stub
// them to render their slots inline and read the open state off the heading.
const stubs = {
  BModal: {
    name: 'BModal',
    props: { modelValue: Boolean },
    template:
      '<div v-if="modelValue" class="modal-stub"><slot name="title" /><slot /><slot name="footer" /></div>',
  },
  BCollapse: {
    props: ['modelValue'],
    template: '<div class="collapse-stub" :data-open="String(modelValue)"><slot /></div>',
  },
  CollapseIcon: true,
  IMdiCheck: true,
  IMdiChatOutline: true,
  ChatComposeBar: ComposeBarStub,
}

const noContact = { data: { contactList: { contacts: [] } } }
const aContact = (gradidoID) => ({ data: { contactList: { contacts: [{ user: { gradidoID } }] } } })
const copy = (over = {}) => ({
  data: { sendChatMessage: { id: 7, mailState: 'MAILED', deliveryState: 'DELIVERED', ...over } },
})

/** A promise that settles when the test says so: an answer that is still on its way. */
const held = () => {
  let settle
  let refuse
  const promise = new Promise((resolve, reject) => {
    settle = resolve
    refuse = reject
  })
  return { promise, resolve: settle, reject: refuse }
}

// The member's home, and places to the north of it at a distance a test names: one degree of
// latitude is the same number of kilometres everywhere on the sphere the wallet measures on.
const HOME = { lat: 49.28, lng: 9.69 }
const KM_PER_DEGREE = distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })
const north = (km) => ({ lat: HOME.lat + km / KM_PER_DEGREE, lng: HOME.lng })

const entry = (uuid, summary, strength, details = null, remote = false) => ({
  uuid,
  summary,
  details,
  strength,
  remote,
})

let wrapper = null

function mountProfile(match, { props = {}, global = {}, ...options } = {}) {
  wrapper = mount(MatchProfile, {
    props: { modelValue: true, match, ownPosition: HOME, ownReachKm: 25, ...props },
    global: { plugins: [i18n], stubs, ...global },
    ...options,
  })
  return wrapper
}

const baseMatch = (over = {}) => ({
  uuid: 'user-uuid-1',
  name: 'Sofia',
  community: { uuid: 'community-uuid-1', name: 'Gradido Künzelsau' },
  aboutMe: 'Ich lebe für Musik und den Garten.',
  position: north(9),
  channels: {},
  ...over,
})

const SOFIA = { gradidoID: 'user-uuid-1', communityUuid: 'community-uuid-1' }

describe('MatchProfile', () => {
  beforeEach(() => {
    push.mockClear()
    Object.assign(storeState, ME)
    apollo.query.mockReset()
    apollo.query.mockResolvedValue(noContact)
    apollo.mutate.mockReset()
    apollo.mutate.mockResolvedValue(copy())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

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

    // Three matches and nothing else: all open, and no "0 weitere" under them.
    const onlyMatches = mountProfile(
      baseMatch({
        channels: {
          angebot: [entry('m1', 'A', 0.46), entry('m2', 'B', 0.865), entry('m3', 'C', 0.595)],
        },
      }),
    )
    expect(onlyMatches.findAll('.entry-summary')).toHaveLength(3)
    expect(onlyMatches.find('.more-btn').exists()).toBe(false)
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

  it('leads "send Gradido" to the send form, as it always did', async () => {
    mountProfile(baseMatch())
    await wrapper.find('.send-gradido').trigger('click')
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({ path: '/send/community-uuid-1/user-uuid-1' })
  })

  /**
   * "Send an e-mail" led to the send form's letter. The first word in the foot took its place
   * (E-065): the bar is the same thing, and its answer arrives in a conversation.
   */
  it('has no "send e-mail" any more, in the window and in no language', () => {
    mountProfile(baseMatch())
    expect(wrapper.find('.send-email').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('E-Mail senden')

    const here = dirname(fileURLToPath(import.meta.url))
    for (const language of ['de', 'en', 'es', 'fr', 'nl', 'it', 'pt', 'ru', 'el', 'tr']) {
      const texts = JSON.parse(
        readFileSync(join(here, '..', '..', 'locales', `${language}.json`), 'utf8'),
      )
      expect(texts.matching.profile, language).not.toHaveProperty('sendEmail')
      expect(texts.matching.profile.sendGradido, language).toBeTruthy()
    }
  })

  /**
   * The first word, right in the profile (Bernd, 09.10.2026, E-065): the chat's compose bar in
   * the foot, the words already in its field (E-068), one press on its arrow.
   */
  describe('the first word', () => {
    const bar = () => wrapper.findComponent(ComposeBarStub)
    const sentLine = () => wrapper.find('[data-test="profile-hello-sent"]')
    const conversation = () => wrapper.find('[data-test="profile-conversation"]')
    const forTheEar = () => wrapper.find('[data-test="profile-hello-status"]')
    const actions = () => wrapper.find('.profile-actions')

    const WORDS =
      'Hallo Sofia, ich habe Dich auf der Gradido-Karte gefunden. ' +
      'Wir wohnen etwa 9 km voneinander entfernt. Magst Du Hallo zurücksagen? Maren'

    it('asks the server whether the two are contacts, by the pair of the person shown', async () => {
      mountProfile(baseMatch())
      await flushPromises()

      expect(apollo.query).toHaveBeenCalledTimes(1)
      expect(apollo.query).toHaveBeenCalledWith({
        query: contactByMemberQuery,
        variables: { ref: SOFIA },
        fetchPolicy: 'no-cache',
      })
    })

    it('stands the bar from the first moment, its arrow waiting for the answer', async () => {
      const answer = held()
      apollo.query.mockReturnValue(answer.promise)
      mountProfile(baseMatch())
      await wrapper.vm.$nextTick()

      // Before the server has said who this is: the bar is there, so the window does not grow
      // under a finger a moment later -- and nothing can be sent yet.
      expect(bar().exists()).toBe(true)
      expect(bar().props('sending')).toBe(true)

      answer.resolve(noContact)
      await flushPromises()
      expect(bar().exists()).toBe(true)
      expect(bar().props('sending')).toBe(false)
      expect(bar().props('failed')).toBe(false)
    })

    it('hands the bar the name, the first-message note and "only the text"', async () => {
      mountProfile(baseMatch())
      await flushPromises()

      expect(bar().props('name')).toBe('Sofia')
      expect(bar().props('first')).toBe(true)
      expect(bar().props('textOnly')).toBe(true)
    })

    it('puts the words into the field: found on the map, how far, the question, the name', async () => {
      mountProfile(baseMatch())
      await flushPromises()
      expect(bar().props('initialText')).toBe(WORDS)
    })

    it.each([
      [
        'whole kilometres from five on',
        { position: north(12.4) },
        {},
        'Hallo Sofia, ich habe Dich auf der Gradido-Karte gefunden. Wir wohnen etwa 12 km voneinander entfernt. Magst Du Hallo zurücksagen? Maren',
      ],
      [
        'no figure below five kilometres',
        { position: north(0.3) },
        {},
        'Hallo Sofia, ich habe Dich auf der Gradido-Karte gefunden. Wir wohnen nicht weit voneinander. Magst Du Hallo zurücksagen? Maren',
      ],
      [
        'nothing about it beyond the reach',
        { position: north(180) },
        {},
        'Hallo Sofia, ich habe Dich auf der Gradido-Karte gefunden. Magst Du Hallo zurücksagen? Maren',
      ],
      [
        'the reach the page hands in, not a fixed one',
        { position: north(180) },
        { ownReachKm: 200 },
        'Hallo Sofia, ich habe Dich auf der Gradido-Karte gefunden. Wir wohnen etwa 180 km voneinander entfernt. Magst Du Hallo zurücksagen? Maren',
      ],
      [
        "nothing about it where the member's home is not known",
        {},
        { ownPosition: null },
        'Hallo Sofia, ich habe Dich auf der Gradido-Karte gefunden. Magst Du Hallo zurücksagen? Maren',
      ],
      [
        'nothing about it where the other place is not known',
        { position: undefined },
        {},
        'Hallo Sofia, ich habe Dich auf der Gradido-Karte gefunden. Magst Du Hallo zurücksagen? Maren',
      ],
    ])('says how far apart the two live: %s', async (_, over, props, words) => {
      mountProfile(baseMatch(over), { props })
      await flushPromises()
      expect(bar().props('initialText')).toBe(words)
    })

    it("measures from the member's home, whatever the reach is measured from elsewhere", async () => {
      // The other person lives 9 km from home; a home 40 km further south puts them out of reach.
      mountProfile(baseMatch(), {
        props: { ownPosition: { lat: HOME.lat - 40 / KM_PER_DEGREE, lng: HOME.lng } },
      })
      await flushPromises()
      expect(bar().props('initialText')).not.toContain('km')
      expect(bar().props('initialText')).not.toContain('nicht weit')
    })

    it.each([[''], [null], ['ab']])(
      'signs with nothing where the member has no user name (%j)',
      async (username) => {
        storeState.username = username
        mountProfile(baseMatch())
        await flushPromises()
        expect(bar().props('initialText')).toBe(
          'Hallo Sofia, ich habe Dich auf der Gradido-Karte gefunden. ' +
            'Wir wohnen etwa 9 km voneinander entfernt. Magst Du Hallo zurücksagen?',
        )
      },
    )

    it('sends what the bar asks for to the pair, as the first message that goes by mail', async () => {
      mountProfile(baseMatch())
      await flushPromises()
      bar().vm.$emit('send', {
        body: 'Hallo Sofia, magst Du Kaffee?',
        notify: 'EMAIL',
        image: null,
      })
      await flushPromises()

      expect(apollo.mutate).toHaveBeenCalledTimes(1)
      expect(apollo.mutate).toHaveBeenCalledWith({
        mutation: sendChatMessage,
        variables: { ref: SOFIA, body: 'Hallo Sofia, magst Du Kaffee?', notify: 'EMAIL' },
      })
    })

    it('makes the arrow wait while the hello is on its way', async () => {
      const answer = held()
      apollo.mutate.mockReturnValue(answer.promise)
      mountProfile(baseMatch())
      await flushPromises()
      bar().vm.$emit('send', { body: 'Hallo', notify: 'EMAIL', image: null })
      await wrapper.vm.$nextTick()

      expect(bar().props('sending')).toBe(true)
      // A second press: nothing more goes out.
      bar().vm.$emit('send', { body: 'Hallo', notify: 'EMAIL', image: null })
      await wrapper.vm.$nextTick()
      expect(apollo.mutate).toHaveBeenCalledTimes(1)

      answer.resolve(copy())
      await flushPromises()
      expect(bar().exists()).toBe(false)
    })

    it('says what became of it where the bar stood, and opens the way into the conversation', async () => {
      mountProfile(baseMatch(), { attachTo: document.body })
      await flushPromises()
      expect(sentLine().exists()).toBe(false)
      expect(conversation().exists()).toBe(false)
      expect(forTheEar().text()).toBe('')

      bar().vm.$emit('send', { body: WORDS, notify: 'EMAIL', image: null })
      await flushPromises()

      expect(bar().exists()).toBe(false)
      expect(sentLine().text()).toBe('Gesendet. Sofia bekommt eine E-Mail.')
      expect(forTheEar().text()).toBe('Gesendet. Sofia bekommt eine E-Mail.')
      expect(conversation().text()).toBe('Zum Gespräch')
      // The bar is gone and with it whatever held the focus: a keyboard is on the way into
      // the conversation, not nowhere.
      expect(document.activeElement).toBe(conversation().element)
      // Two ways out now, sharing the row as the window's two buttons always did.
      expect(actions().classes()).not.toContain('is-single')
      expect(wrapper.find('.send-gradido').exists()).toBe(true)

      await conversation().trigger('click')
      expect(push).toHaveBeenCalledWith({
        path: '/contacts',
        query: { with: 'user-uuid-1', community: 'community-uuid-1' },
      })
    })

    it.each([
      ['a mail went out', {}, 'Gesendet. Sofia bekommt eine E-Mail.'],
      ['no mail went out', { mailState: null }, 'Gesendet.'],
      ['the mail was held back', { mailState: 'MUTED' }, 'Gesendet.'],
      [
        'the other community did not take it',
        { mailState: null, deliveryState: 'FAILED' },
        'Nicht zugestellt',
      ],
      [
        'it is not known yet whether it arrived',
        { mailState: null, deliveryState: 'PENDING' },
        'Noch nicht zugestellt',
      ],
      // Never "gets an e-mail" beside "not delivered", whatever the copy says about a mail.
      ['a copy says both', { mailState: 'MAILED', deliveryState: 'FAILED' }, 'Nicht zugestellt'],
    ])("says it in the server's words where %s", async (_, over, words) => {
      apollo.mutate.mockResolvedValue(copy(over))
      mountProfile(baseMatch())
      await flushPromises()
      bar().vm.$emit('send', { body: 'Hallo', notify: 'EMAIL', image: null })
      await flushPromises()

      expect(sentLine().text()).toBe(words)
      expect(forTheEar().text()).toBe(words)
      expect(conversation().exists()).toBe(true)
    })

    it('keeps the bar, marked as failed, where the hello did not go through', async () => {
      apollo.mutate.mockRejectedValue(new Error('CHAT_MESSAGE_NOT_SENT: NO_WAY_TO_DELIVER'))
      mountProfile(baseMatch())
      await flushPromises()
      bar().vm.$emit('send', { body: 'Hallo', notify: 'EMAIL', image: null })
      await flushPromises()

      expect(bar().exists()).toBe(true)
      expect(bar().props('failed')).toBe(true)
      expect(bar().props('sending')).toBe(false)
      expect(sentLine().exists()).toBe(false)
      expect(conversation().exists()).toBe(false)
      expect(forTheEar().text()).toBe('')
    })

    it('offers a contact the way into the conversation instead, beside "send Gradido"', async () => {
      apollo.query.mockResolvedValue(aContact('user-uuid-1'))
      mountProfile(baseMatch())
      await flushPromises()

      expect(bar().exists()).toBe(false)
      expect(sentLine().exists()).toBe(false)
      expect(conversation().text()).toBe('Zum Gespräch')
      expect(actions().classes()).not.toContain('is-single')
      expect(
        actions()
          .findAll('button')
          .map((button) => button.text()),
      ).toEqual(['Zum Gespräch', 'Gradido senden'])

      await conversation().trigger('click')
      expect(push).toHaveBeenCalledTimes(1)
      expect(push).toHaveBeenCalledWith({
        path: '/contacts',
        query: { with: 'user-uuid-1', community: 'community-uuid-1' },
      })
      expect(apollo.mutate).not.toHaveBeenCalled()
    })

    it('offers neither where the server could not be asked; "send Gradido" stays', async () => {
      apollo.query.mockRejectedValue(new Error('Network error'))
      mountProfile(baseMatch())
      await flushPromises()

      expect(bar().exists()).toBe(false)
      expect(conversation().exists()).toBe(false)
      expect(wrapper.find('.send-gradido').exists()).toBe(true)
      // Alone, the button keeps the width of its word (the stylesheet, below).
      expect(actions().classes()).toContain('is-single')
    })

    it('keeps "send Gradido" alone under the bar for somebody who is no contact', async () => {
      mountProfile(baseMatch())
      await flushPromises()
      expect(bar().exists()).toBe(true)
      expect(actions().classes()).toContain('is-single')
      expect(
        actions()
          .findAll('button')
          .map((button) => button.text()),
      ).toEqual(['Gradido senden'])
    })

    it("asks nobody and offers no first word on the member's own ring", async () => {
      storeState.gradidoID = 'USER-UUID-1'
      mountProfile(baseMatch())
      await flushPromises()

      expect(apollo.query).not.toHaveBeenCalled()
      expect(bar().exists()).toBe(false)
      expect(conversation().exists()).toBe(false)
    })

    it.each([
      ['a ring without a member', { uuid: null }],
      ['a ring without a community', { community: null }],
      ['a community without a uuid', { community: { uuid: null, name: 'Irgendwo' } }],
    ])('asks nobody and offers no first word for %s', async (_, over) => {
      mountProfile(baseMatch(over))
      await flushPromises()
      expect(apollo.query).not.toHaveBeenCalled()
      expect(bar().exists()).toBe(false)
      expect(conversation().exists()).toBe(false)
    })

    it('asks nobody while the window is shut', async () => {
      mountProfile(baseMatch(), { props: { modelValue: false } })
      await flushPromises()
      expect(apollo.query).not.toHaveBeenCalled()
    })

    // The page hands a new `match` object whenever more of the same person arrives -- their
    // entries from the profile route, the sentences of mine they answer.
    it('neither asks again nor makes the bar anew when more of the same person arrives', async () => {
      mountProfile(baseMatch())
      await flushPromises()
      const before = bar().vm.$.uid

      await wrapper.setProps({
        match: baseMatch({ channels: { interesse: [entry('e1', 'Permakultur', 0.57)] } }),
      })
      await flushPromises()

      expect(apollo.query).toHaveBeenCalledTimes(1)
      // The same bar, not one made anew: by the instance's own number.
      expect(bar().vm.$.uid).toBe(before)
    })

    it('asks anew for another person and makes the bar anew, with their name in the words', async () => {
      mountProfile(baseMatch())
      await flushPromises()
      const before = bar().vm.$.uid

      await wrapper.setProps({
        match: baseMatch({ uuid: 'user-uuid-2', name: 'Jonas', position: north(0.5) }),
      })
      await flushPromises()

      expect(apollo.query).toHaveBeenCalledTimes(2)
      expect(apollo.query).toHaveBeenLastCalledWith(
        expect.objectContaining({
          variables: { ref: { gradidoID: 'user-uuid-2', communityUuid: 'community-uuid-1' } },
        }),
      )
      expect(bar().vm.$.uid).not.toBe(before)
      expect(bar().props('name')).toBe('Jonas')
      expect(bar().props('initialText')).toBe(
        'Hallo Jonas, ich habe Dich auf der Gradido-Karte gefunden. ' +
          'Wir wohnen nicht weit voneinander. Magst Du Hallo zurücksagen? Maren',
      )
    })

    it('tells the same member of another community apart', async () => {
      mountProfile(baseMatch())
      await flushPromises()
      await wrapper.setProps({
        match: baseMatch({ community: { uuid: 'community-uuid-2', name: 'Anderswo' } }),
      })
      await flushPromises()

      expect(apollo.query).toHaveBeenCalledTimes(2)
      expect(apollo.query).toHaveBeenLastCalledWith(
        expect.objectContaining({
          variables: { ref: { gradidoID: 'user-uuid-1', communityUuid: 'community-uuid-2' } },
        }),
      )
    })

    it('asks again when the window opens on the same person once more', async () => {
      mountProfile(baseMatch())
      await flushPromises()
      bar().vm.$emit('send', { body: 'Hallo', notify: 'EMAIL', image: null })
      await flushPromises()
      expect(sentLine().exists()).toBe(true)

      // Shut, and open again: by now the server knows the two as contacts.
      apollo.query.mockResolvedValue(aContact('user-uuid-1'))
      await wrapper.setProps({ modelValue: false })
      await wrapper.setProps({ modelValue: true })
      await flushPromises()

      expect(apollo.query).toHaveBeenCalledTimes(2)
      expect(sentLine().exists()).toBe(false)
      expect(bar().exists()).toBe(false)
      expect(conversation().exists()).toBe(true)
    })

    // A message to another community takes seconds: time enough to look at somebody else.
    it("puts no late answer under another person's name", async () => {
      const toSofia = held()
      apollo.mutate.mockReturnValue(toSofia.promise)
      mountProfile(baseMatch())
      await flushPromises()
      bar().vm.$emit('send', { body: 'Hallo Sofia', notify: 'EMAIL', image: null })
      await wrapper.vm.$nextTick()

      await wrapper.setProps({ match: baseMatch({ uuid: 'user-uuid-2', name: 'Jonas' }) })
      await flushPromises()
      expect(bar().props('name')).toBe('Jonas')
      expect(bar().props('sending')).toBe(false)

      toSofia.resolve(copy())
      await flushPromises()
      expect(sentLine().exists()).toBe(false)
      expect(forTheEar().text()).toBe('')
      expect(conversation().exists()).toBe(false)
      expect(bar().props('name')).toBe('Jonas')
      expect(bar().props('failed')).toBe(false)
    })

    it("puts no late word about one person's standing under another's name", async () => {
      const aboutSofia = held()
      apollo.query.mockReturnValueOnce(aboutSofia.promise).mockResolvedValue(noContact)
      mountProfile(baseMatch())
      await wrapper.vm.$nextTick()
      await wrapper.setProps({ match: baseMatch({ uuid: 'user-uuid-2', name: 'Jonas' }) })
      await flushPromises()
      expect(bar().props('sending')).toBe(false)

      // Sofia turns out to be a contact -- Jonas is none.
      aboutSofia.resolve(aContact('user-uuid-1'))
      await flushPromises()
      expect(bar().exists()).toBe(true)
      expect(bar().props('name')).toBe('Jonas')
      expect(conversation().exists()).toBe(false)
    })

    /**
     * A stand-in answers to any name. That the bar HAS the props the window hands it, and asks
     * with the event the window listens to, only the real one can show.
     */
    describe('with the real compose bar', () => {
      const realStubs = {
        ...stubs,
        ChatComposeBar: false,
        // The bar's own signs and its picture editor: named in its template whatever it shows.
        IMdiEmailOutline: true,
        IMdiSend: true,
        IMdiPencilOutline: true,
        IMdiClose: true,
        IMdiReplyOutline: true,
        IMdiImageOutline: true,
        IMdiPencil: true,
        IMdiPaperclip: true,
        IMdiCamera: true,
        IMdiImage: true,
        IMdiFileDocument: true,
        IMdiCellphone: true,
        IMdiOpenInNew: true,
        ChatImageEditor: true,
      }
      const mountReal = (match = baseMatch(), options = {}) =>
        mountProfile(match, { global: { stubs: realStubs }, ...options })
      const field = () => wrapper.find('[data-test="chat-compose-field"]')
      const arrow = () => wrapper.find('[data-test="chat-compose-send"]')

      it('shows the words in the field, the note about the first mail, and no paperclip', async () => {
        mountReal()
        await flushPromises()

        expect(field().element.value).toBe(WORDS)
        expect(wrapper.find('[data-test="chat-compose-first"]').text()).toBe(
          'Die erste Nachricht geht auch per E-Mail an Sofia.',
        )
        expect(wrapper.find('[data-test="chat-compose-attach"]').exists()).toBe(false)
        // Before the first message there is no box to tick: the mail goes in any case.
        expect(wrapper.find('[data-test="chat-compose-email"]').exists()).toBe(false)
      })

      it('holds the arrow back until the server has said who this is', async () => {
        const answer = held()
        apollo.query.mockReturnValue(answer.promise)
        mountReal()
        await wrapper.vm.$nextTick()

        expect(field().element.value).toBe(WORDS)
        expect(arrow().attributes('aria-disabled')).toBe('true')
        await arrow().trigger('click')
        expect(apollo.mutate).not.toHaveBeenCalled()

        answer.resolve(noContact)
        await flushPromises()
        expect(arrow().attributes('aria-disabled')).toBe('false')
        // The words are still the ones that stood there: the answer made no bar anew.
        expect(field().element.value).toBe(WORDS)
      })

      it('sends the words as they stand in the field, with one press on the arrow', async () => {
        mountReal()
        await flushPromises()
        await arrow().trigger('click')
        await flushPromises()

        expect(apollo.mutate).toHaveBeenCalledTimes(1)
        expect(apollo.mutate).toHaveBeenCalledWith({
          mutation: sendChatMessage,
          variables: { ref: SOFIA, body: WORDS, notify: 'EMAIL' },
        })
        expect(wrapper.find('[data-test="profile-hello-sent"]').text()).toBe(
          'Gesendet. Sofia bekommt eine E-Mail.',
        )
        expect(field().exists()).toBe(false)
      })

      it('sends what the member made of the words', async () => {
        mountReal()
        await flushPromises()
        await field().setValue(`${WORDS}\nDu bietest Fahrradreparatur – genau das suche ich.`)
        await arrow().trigger('click')
        await flushPromises()

        expect(apollo.mutate.mock.calls[0][0].variables.body).toBe(
          `${WORDS}\nDu bietest Fahrradreparatur – genau das suche ich.`,
        )
      })

      it('keeps the words in the field and says so where the hello did not go through', async () => {
        apollo.mutate.mockRejectedValue(new Error('Network error'))
        mountReal()
        await flushPromises()
        await field().setValue('Hallo Sofia, magst Du Kaffee?')
        await arrow().trigger('click')
        await flushPromises()

        expect(field().element.value).toBe('Hallo Sofia, magst Du Kaffee?')
        expect(wrapper.find('[data-test="chat-compose-failed"]').text()).toBe(
          'Die Nachricht konnte nicht gesendet werden. Dein Text bleibt hier stehen.',
        )
        expect(arrow().attributes('aria-disabled')).toBe('false')

        // Another press tries again, and goes through.
        apollo.mutate.mockResolvedValue(copy())
        await arrow().trigger('click')
        await flushPromises()
        expect(apollo.mutate).toHaveBeenCalledTimes(2)
        expect(wrapper.find('[data-test="profile-hello-sent"]').exists()).toBe(true)
      })

      it('keeps what the member typed when more of the same person arrives', async () => {
        mountReal()
        await flushPromises()
        await field().setValue('Hallo Sofia, ich schreibe gerade etwas Eigenes')

        await wrapper.setProps({
          match: baseMatch({ channels: { interesse: [entry('e1', 'Permakultur', 0.57)] } }),
        })
        await flushPromises()
        expect(field().element.value).toBe('Hallo Sofia, ich schreibe gerade etwas Eigenes')
      })
    })

    /**
     * jsdom lays nothing out: what can be held here is that the rules stand in the stylesheet,
     * read without its comments (a rule named in a comment is not a rule).
     */
    describe('in the stylesheet', () => {
      const here = dirname(fileURLToPath(import.meta.url))
      const code = readFileSync(join(here, 'MatchProfile.vue'), 'utf8')
        .split('<style')[1]
        .replace(/\/\*[\s\S]*?\*\//g, '')
      const rule = (selector) =>
        code.match(new RegExp(`\\n${selector}\\s*\\{([^}]*)\\}`))?.[1]?.replace(/\s+/g, ' ') ?? ''

      it('reads rules, not comments', () => {
        expect(code).not.toContain('/*')
        expect(rule('\\.profile-actions')).toMatch(/display: flex;/)
      })

      // The bar draws a line over itself and keeps its distance from the thread above it. Here
      // the window's own foot draws that line. With one class the rule would weigh the same as
      // the bar's own, and the order of two stylesheets in the bundle would decide.
      it("takes the bar's own line and distance away, with a rule that outweighs the bar's", () => {
        const own = rule('\\.profile-foot \\.profile-hello')
        expect(own).toMatch(/margin-top: 0;/)
        expect(own).toMatch(/padding-top: 0;/)
        expect(own).toMatch(/border-top: 0;/)
        expect(rule('\\.profile-hello')).toBe('')
      })

      it('keeps a button that stands alone as wide as its word, at the left', () => {
        const alone = rule('\\.profile-actions\\.is-single \\.send-btn')
        expect(alone).toMatch(/flex: 0 1 auto;/)
        expect(alone).toMatch(/align-self: flex-start;/)
      })

      it('draws the way into the conversation as the outlined one of the two buttons', () => {
        expect(rule('\\.to-conversation')).toMatch(/background: transparent;/)
        expect(rule('\\.to-conversation')).toMatch(/color: #178d81;/)
        expect(rule('\\.send-email')).toBe('')
      })
    })
  })
})
