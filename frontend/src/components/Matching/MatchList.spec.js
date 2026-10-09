// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import MatchList from './MatchList.vue'
import GeoSearchField from './GeoSearchField.vue'

// The address search goes through the real provider; only the network ends are replaced: the
// GMS search itself and the address it answers under.
const GMS = 'https://ki-playground-gms.gradido.net/gms/'
const { searchPlaces } = vi.hoisted(() => ({ searchPlaces: vi.fn(async () => []) }))
vi.mock('@/utils/geoSearch', () => ({ searchPlaces }))
vi.mock('@/composables/useGmsBase', () => ({
  useGmsBase: () => ({ gmsBase: async () => GMS }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      matching: {
        map: { found: '{n} Menschen gefunden', search: 'Ort oder Adresse suchen' },
        list: {
          sortBy: 'Sortieren nach',
          sortNaehe: 'Nähe',
          sortPassung: 'Passung',
          sortBreite: 'wer auf das meiste passt',
          matchesHeading: 'Deine Treffer',
          // Copied from de.json, both of them — the wide line is the one this file
          // measures, and the regional one is its control.
          centeredOn: 'Umkreis um {place}',
          centeredOnFern: 'Überregional · {km} km um {place}',
          centeredOnFernNoPlace: 'Überregional · {km} km',
          othersHeading: 'Weitere Menschen in Deiner Nähe',
          near: 'im Nahbereich',
          kmEtwa: 'etwa {n} km',
          kmExact: '{n} km',
          meets: 'trifft {n} Deiner Einträge',
          empty: 'Hier ist gerade niemand.',
          contactHeading: 'Dein Kontakt',
          fromHome: 'von Deinem Zuhause aus',
          dir: {
            n: 'nördlich',
            ne: 'nordöstlich',
            e: 'östlich',
            se: 'südöstlich',
            s: 'südlich',
            sw: 'südwestlich',
            w: 'westlich',
            nw: 'nordwestlich',
          },
          line: {
            angebot: 'bietet {thing} — das suchst Du',
            gesuch: 'sucht {thing} — das bietest Du',
            interesse: 'teilt Dein Interesse an {thing}',
          },
        },
      },
    },
  },
})

const CENTRE = { lat: 50, lng: 10 }
const PRAGUE = { lat: 50.0874654, lng: 14.4212535 }
const PFARRWEG = { lat: 49.2816472, lng: 9.7405781, label: 'Pfarrweg 2, 74653 Kuenzelsau' }

// ~1 km, ~20 km due north of the centre — clear of every band boundary.
const NEAR = { lat: 50.009, lng: 10 }
const FAR = { lat: 50.18, lng: 10 }

const entry = (summary, strength) => ({
  uuid: summary,
  summary,
  details: null,
  strength,
  remote: false,
})

function matchItem(over = {}) {
  return {
    match: {
      uuid: over.uuid || 'm1',
      name: over.name || 'Sofia',
      community: { name: over.community || 'Gradido Künzelsau' },
      position: over.position || NEAR,
      precision: over.precision || 'genau',
      channels: over.channels || { angebot: [entry('Fahrradreparatur', 0.55)] },
      scores: over.scores || {
        angebot: [{ strength: 0.55, entry: 'my-need', subject: 'fahrrad' }],
      },
    },
    stages: over.stages || { interesse: 0, angebot: 3, gesuch: 0 },
    peak: over.peak || 3,
  }
}

// What the presence route gives since 10.09.2026 (toPresence): the pair that names the
// person, their community, whether they have entries, a point and how precisely they
// let themselves be found.
function silentPerson(over = {}) {
  return {
    id: 1,
    uuid: 'p-1',
    name: 'Paul',
    community: { uuid: 'c-1', name: 'Gradido Hamburg' },
    hasEntries: false,
    position: FAR,
    precision: 'ungefaehr',
    ...over,
  }
}

// The sort and lens controls are ThemedSelects (themed dropdowns, no native <select>).
// ThemedSelect is registered app-wide rather than imported, so it does not resolve in a
// unit mount; stub it by name so every mount renders cleanly and the tests do not lean on
// auto-import. It carries `change`, which the list turns into `sort` / `lens`.
const THEMED_SELECT_STUB = {
  name: 'ThemedSelect',
  props: ['options', 'modelValue'],
  template: '<div />',
}

function mountList(props = {}, stubs = { ThemedSelect: THEMED_SELECT_STUB }) {
  return mount(MatchList, {
    props: {
      matches: [],
      silent: [],
      center: CENTRE,
      myPrecision: 'genau',
      sortMode: 'naehe',
      ...props,
    },
    global: { plugins: [i18n], stubs },
  })
}

describe('MatchList', () => {
  // The same rows answer a different question in the wide reach, and only the line
  // above them can say which - so it names the reach and the circle it used.
  it('says which reach the search took, and names the circle in the wide one', () => {
    const regional = mountList({ centerLabel: 'Kuenzelsau' })
    expect(regional.find('.center-label').text()).toBe('Umkreis um Kuenzelsau')

    const wide = mountList({ centerLabel: 'Kuenzelsau', reach: 'fern', radiusKm: 500 })
    expect(wide.find('.center-label').text()).toBe('Überregional · 500 km um Kuenzelsau')
  })

  // The map names every centre once it knows the member's home, so the label is empty only
  // before that. "Centred on nothing" is worth hiding; the reach and its circle are not.
  it('still names the wide circle when no place name could be resolved', () => {
    const wide = mountList({ centerLabel: '', reach: 'fern', radiusKm: 500 })
    expect(wide.find('.center-label').text()).toBe('Überregional · 500 km')

    // The regional line says nothing without a place, so it stays hidden.
    const regional = mountList({ centerLabel: '', reach: 'regional' })
    expect(regional.find('.center-label').exists()).toBe(false)
  })

  it('names the group, the person and their community', () => {
    const wrapper = mountList({ matches: [matchItem()] })
    expect(wrapper.find('.section-head').text()).toBe('Deine Treffer')
    expect(wrapper.find('.row-name').text()).toBe('Sofia')
    expect(wrapper.find('.row-community').text()).toBe('Gradido Künzelsau')
  })

  it('reads the strongest matched entry as a reciprocal line', () => {
    const wrapper = mountList({ matches: [matchItem()] })
    expect(wrapper.find('.row-line').text()).toBe('bietet Fahrradreparatur — das suchst Du')
  })

  it('names the breadth only when more than one entry is answered', () => {
    const one = mountList({ matches: [matchItem()] })
    expect(one.find('.row-breadth').exists()).toBe(false)

    const many = mountList({
      matches: [
        matchItem({
          channels: { angebot: [entry('a', 0.5), entry('b', 0.45)] },
          scores: {
            angebot: [
              { strength: 0.5, entry: 'my-need', subject: 'fahrrad' },
              { strength: 0.45, entry: 'my-other-need', subject: 'wohnung' },
            ],
          },
        }),
      ],
    })
    expect(many.find('.row-breadth').text()).toBe('trifft 2 Deiner Einträge')
  })

  // The line counts entries of MINE: two of the bike dealer's offers answering one
  // need of mine meet one of my entries, not two.
  it('counts two of their entries on one of mine as one of mine', () => {
    const dealer = mountList({
      matches: [
        matchItem({
          channels: { angebot: [entry('a', 0.5), entry('b', 0.45)] },
          scores: {
            angebot: [
              { strength: 0.5, entry: 'my-need', subject: 'fahrrad' },
              { strength: 0.45, entry: 'my-need', subject: 'fahrrad' },
            ],
          },
        }),
      ],
    })
    expect(dealer.find('.row-breadth').exists()).toBe(false)
  })

  it('never leaks a score or a percentage into a row', () => {
    const wrapper = mountList({ matches: [matchItem()] })
    expect(wrapper.text()).not.toContain('%')
    expect(wrapper.text()).not.toContain('0.55')
  })

  it('keeps a blurred near person vague and directionless', () => {
    const wrapper = mountList({ matches: [matchItem({ position: NEAR, precision: 'ungefaehr' })] })
    expect(wrapper.find('.row-where').text()).toContain('im Nahbereich')
    expect(wrapper.find('.dir-word').exists()).toBe(false)
  })

  it('speaks distance and a direction word once far enough out', () => {
    const wrapper = mountList({ matches: [matchItem({ position: FAR, precision: 'ungefaehr' })] })
    const where = wrapper.find('.row-where').text()
    expect(where).toContain('km')
    expect(where).toContain('nördlich')
  })

  it('gives an exact person a figure even up close', () => {
    const wrapper = mountList({ matches: [matchItem({ position: NEAR, precision: 'genau' })] })
    const where = wrapper.find('.row-where').text()
    expect(where).toContain('km')
    expect(where).not.toContain('Nahbereich')
  })

  it('opens the profile of a clicked match', async () => {
    const wrapper = mountList({ matches: [matchItem()] })
    await wrapper.find('.row-match').trigger('click')
    expect(wrapper.emitted('open')[0][0].name).toBe('Sofia')
  })

  it('names a silent person, and their community once the GMS names it', () => {
    const older = mountList({ silent: [silentPerson({ uuid: null, community: null })] })
    expect(older.find('.row-silent .row-name').text()).toBe('Paul')
    expect(older.find('.row-silent .row-community').exists()).toBe(false)

    const named = mountList({ silent: [silentPerson()] })
    expect(named.find('.row-silent .row-community').text()).toBe('Gradido Hamburg')
  })

  // Bernd, 10.09.2026: the grey ones open the same window as a match (GMS-111).
  it('shows silent people in their own section, each a button that opens them', async () => {
    const wrapper = mountList({ silent: [silentPerson()] })
    const heads = wrapper.findAll('.section-head').map((h) => h.text())
    expect(heads).toContain('Weitere Menschen in Deiner Nähe')

    const row = wrapper.find('.row-silent')
    expect(row.element.tagName).toBe('BUTTON')
    await row.trigger('click')
    expect(wrapper.emitted('open')[0][0]).toEqual(silentPerson())
  })

  // An older GMS names nobody on its presence route: nothing to open, and the line says
  // so by being off rather than by a window that cannot fill.
  it('keeps a silent line off when the GMS does not name the person', async () => {
    const wrapper = mountList({ silent: [silentPerson({ uuid: null, community: null })] })
    const row = wrapper.find('.row-silent')

    expect(row.attributes('disabled')).toBeDefined()
    await row.trigger('click')
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('emits the chosen sort', () => {
    const wrapper = mountList({ matches: [matchItem()] })
    wrapper.findComponent(THEMED_SELECT_STUB).vm.$emit('change', 'breite')
    expect(wrapper.emitted('sort')[0]).toEqual(['breite'])
  })

  it('says so plainly when there is no one', () => {
    const wrapper = mountList()
    expect(wrapper.find('.list-empty').text()).toBe('Hier ist gerade niemand.')
  })

  // Somebody the page was asked to show (Bernd, 09.10.2026): a contact, from the pin in the
  // contact window. In the list they could not be found at all -- the map is inert under it --,
  // so they stand first, under a heading of their own.
  describe('the contact the page shows', () => {
    // The search stands on them: `center` is their own point, and home lies ~20 km south of it.
    const HOME = { lat: 49.82, lng: 10 }
    const person = (over = {}) => ({
      uuid: 'c-anna',
      name: 'Anna-Sonne',
      community: { uuid: 'c-1', name: 'KI Playground' },
      position: CENTRE,
      precision: 'genau',
      ...over,
    })
    const contact = (over = {}) => ({ person: person(), item: null, ...over })
    const row = (wrapper) => wrapper.find('[data-test="match-list-contact"]')
    const heads = (wrapper) => wrapper.findAll('.section-head').map((h) => h.text())

    it('stands first, under a heading of their own, before the matches and the others', () => {
      const wrapper = mountList({
        contact: contact(),
        home: HOME,
        matches: [matchItem()],
        silent: [silentPerson()],
      })

      expect(heads(wrapper)).toEqual([
        'Dein Kontakt',
        'Deine Treffer',
        'Weitere Menschen in Deiner Nähe',
      ])
      const names = wrapper.findAll('.row-name').map((n) => n.text())
      expect(names).toEqual(['Anna-Sonne', 'Sofia', 'Paul'])
      expect(row(wrapper).find('.row-community').text()).toBe('KI Playground')
    })

    // A heading a screen reader can jump to, naming its section.
    it('is a section named by its heading, with one item that is a button', () => {
      const wrapper = mountList({ contact: contact(), home: HOME })
      const section = row(wrapper).element.closest('section')
      const head = wrapper.find('#match-list-contact-head')

      expect(section.getAttribute('aria-labelledby')).toBe('match-list-contact-head')
      expect(head.element.tagName).toBe('H3')
      expect(head.text()).toBe('Dein Kontakt')
      expect(section.querySelectorAll('li')).toHaveLength(1)
      expect(row(wrapper).element.tagName).toBe('BUTTON')
      expect(row(wrapper).attributes('type')).toBe('button')
    })

    // The search stands on the person, so the list's own measure -- from the search point --
    // would call every such contact "nearby". Theirs is measured from the member's home, and
    // the line says so.
    it("says how far they live from the member's home, not from the search point", () => {
      const wrapper = mountList({ contact: contact(), home: HOME, center: CENTRE })
      const where = wrapper.find('[data-test="match-list-contact-where"]').text()

      expect(where).toContain('20 km')
      expect(where).toContain('nördlich')
      expect(where).toContain('von Deinem Zuhause aus')
      expect(where).not.toContain('im Nahbereich')
    })

    // The control: a match on the very same point is no distance away in its own row --
    // measured, as every row below is, from where the list measures.
    it('leaves the rows below measured as they were', () => {
      const wrapper = mountList({
        contact: contact(),
        home: HOME,
        center: CENTRE,
        matches: [matchItem({ position: CENTRE })],
      })

      const below = wrapper.find('li .row-match:not(.row-contact) .row-where').text()
      expect(below).toContain('0 km')
      expect(below).not.toContain('von Deinem Zuhause aus')
    })

    // A blurred point within a few kilometres of home is "nearby" -- of the home, and says so.
    it('calls a contact with a blurred point close to home nearby, from home', () => {
      const wrapper = mountList({
        contact: contact({ person: person({ position: NEAR, precision: 'ungefaehr' }) }),
        home: CENTRE,
        center: NEAR,
      })
      const where = wrapper.find('[data-test="match-list-contact-where"]')

      expect(where.text()).toContain('im Nahbereich')
      expect(where.text()).toContain('von Deinem Zuhause aus')
    })

    // Measured in the built wallet: the name Chrome computes for a line is its text run together,
    // and the dot between two parts is drawn, not text -- a screen reader was handed
    // "Carla-SonneKI Playground im Nahbereichvon Deinem Zuhause aus".
    it('has a comma for the ear where the eye sees a dot', () => {
      const wrapper = mountList({
        contact: contact({ person: person({ position: NEAR, precision: 'ungefaehr' }) }),
        home: CENTRE,
      })
      const said = row(wrapper).element.textContent

      expect(said).toContain('Anna-Sonne, KI Playground')
      expect(said).toContain('im Nahbereich, von Deinem Zuhause aus')
      // On screen there is the dot, and the comma stands where only a screen reader meets it.
      const commas = row(wrapper).findAll('.sr-only')
      expect(commas).toHaveLength(2)
      for (const dot of row(wrapper).findAll('.row-sep')) {
        expect(dot.attributes('aria-hidden')).toBe('true')
        expect(dot.text()).toBe('')
      }
    })

    it('says nothing about a distance while the home is not known', () => {
      const wrapper = mountList({ contact: contact() })

      expect(row(wrapper).exists()).toBe(true)
      expect(wrapper.find('[data-test="match-list-contact-where"]').exists()).toBe(false)
    })

    it('asks the page to open them, and no other line', async () => {
      const wrapper = mountList({ contact: contact(), home: HOME, matches: [matchItem()] })

      await row(wrapper).trigger('click')

      expect(wrapper.emitted('openContact')).toHaveLength(1)
      expect(wrapper.emitted('open')).toBeUndefined()
    })

    // Where the search found them as well, their line says what answers the member's entries,
    // as a match's line does, with its dots -- they are not listed a second time below.
    it('carries what the search knows of them where it found them', () => {
      const item = matchItem({
        uuid: 'c-anna',
        name: 'Anna-Sonne',
        position: CENTRE,
        channels: {
          angebot: [entry('Fahrradreparatur', 0.55)],
          gesuch: [entry('Hilfe im Garten', 0.4)],
        },
        scores: {
          angebot: [{ strength: 0.55, entry: 'my-need', subject: 'fahrrad' }],
          gesuch: [{ strength: 0.4, entry: 'my-offer', subject: 'garten' }],
        },
        stages: { interesse: 0, angebot: 3, gesuch: 2 },
      })
      const wrapper = mountList({ contact: contact({ item }), home: HOME })

      expect(row(wrapper).findAll('.dot')).toHaveLength(2)
      expect(row(wrapper).find('.row-line').text()).toBe('bietet Fahrradreparatur — das suchst Du')
      expect(row(wrapper).find('.row-breadth').text()).toBe('trifft 2 Deiner Einträge')
    })

    it('carries neither dots nor a line where the search did not find them', () => {
      const wrapper = mountList({ contact: contact(), home: HOME })

      expect(row(wrapper).find('.row-dots').exists()).toBe(false)
      expect(row(wrapper).find('.row-line').exists()).toBe(false)
    })

    // "Nobody here" would stand under a name.
    it('does not say that nobody is here under them', () => {
      const wrapper = mountList({ contact: contact(), home: HOME })

      expect(wrapper.find('.list-empty').exists()).toBe(false)
    })

    it('leaves no dangling dot for a person whose community has no name', () => {
      const wrapper = mountList({
        contact: contact({ person: person({ community: { uuid: 'c-1', name: '' } }) }),
        home: HOME,
      })

      expect(row(wrapper).find('.row-community').exists()).toBe(false)
      expect(row(wrapper).find('.row-head .row-sep').exists()).toBe(false)
    })

    // The control: an ordinary visit has no such section.
    it('is not there where the page shows nobody', () => {
      const wrapper = mountList({ matches: [matchItem()], home: HOME })

      expect(row(wrapper).exists()).toBe(false)
      expect(heads(wrapper)).toEqual(['Deine Treffer'])
    })
  })

  // The blind member's only way to set the centre. What the field does with it is measured
  // in its own spec (components/Matching/GeoSearchField); here only what the list hands it
  // and what it makes of what comes back.
  describe('the address search', () => {
    const field = (wrapper) => wrapper.findComponent(GeoSearchField)

    it('hands the field a provider that asks the GMS near the search centre, in the wallet language', async () => {
      const wrapper = mountList({ center: CENTRE, searchCenter: PRAGUE })

      await field(wrapper).props('provider').search({ query: 'Pfarrweg 2' })

      expect(searchPlaces).toHaveBeenCalledWith(GMS, 'Pfarrweg 2', {
        near: PRAGUE,
        language: 'de',
      })
    })

    it('moves the search to the place the field picked, with its name', async () => {
      const wrapper = mountList()

      await field(wrapper).vm.$emit('pick', PFARRWEG)

      expect(wrapper.emitted('recenter')).toEqual([[PFARRWEG]])
    })
  })
})
