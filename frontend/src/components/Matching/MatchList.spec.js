// AI-GENERATED — not an architecture reference
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import MatchList from './MatchList.vue'

// The address search reaches OpenStreetMap; the list's own logic does not need it,
// so we hand it a provider that answers nothing.
vi.mock('leaflet-geosearch', () => ({
  OpenStreetMapProvider: class {
    async search() {
      return []
    }
  },
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
          othersHeading: 'Weitere Menschen in Deiner Nähe',
          near: 'im Nahbereich',
          kmEtwa: 'etwa {n} km',
          kmExact: '{n} km',
          meets: 'trifft {n} Deiner Einträge',
          empty: 'Hier ist gerade niemand.',
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
      scores: over.scores || { angebot: [0.55] },
    },
    stages: over.stages || { interesse: 0, angebot: 3, gesuch: 0 },
    peak: over.peak || 3,
  }
}

function silentPerson(over = {}) {
  return {
    uuid: over.uuid || 's1',
    name: over.name || 'Paul',
    community: { name: over.community || 'Gradido Hamburg' },
    position: over.position || FAR,
    precision: over.precision || 'ungefaehr',
    hasEntries: over.hasEntries ?? false,
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
          scores: { angebot: [0.5, 0.45] },
        }),
      ],
    })
    expect(many.find('.row-breadth').text()).toBe('trifft 2 Deiner Einträge')
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

  it('shows silent people in their own section, not as buttons', () => {
    const wrapper = mountList({ silent: [silentPerson()] })
    const heads = wrapper.findAll('.section-head').map((h) => h.text())
    expect(heads).toContain('Weitere Menschen in Deiner Nähe')
    expect(wrapper.find('.row-silent').exists()).toBe(true)
    expect(wrapper.find('.row-silent').element.tagName).not.toBe('BUTTON')
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
})
