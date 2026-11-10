// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType, type VNode } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  bearing8,
  CHANNELS,
  COMPASS8,
  describeDistance,
  LABEL_COLORS,
} from '@/components/Matching/displayCore'
import { type GeoPlace, GeoSearchField } from '@/components/Matching/GeoSearchField'
import ThemedSelect from '@/components/ThemedSelect.vue'
import { useGmsBase } from '@/composables/useGmsBase'
import { distanceKm } from '@/composables/useMatches'
import { makeGeoProvider } from '@/utils/geoSearchProvider'
import classes from './MatchList.module.scss'

type Channel = keyof typeof LABEL_COLORS
const CHANNEL_KEYS = CHANNELS as Channel[]

type Position = { lat: number; lng: number }
type Community = { uuid?: string; name: string }
type Entry = { summary: string; strength: number | null }
/** Somebody on the map: a match, a presence person, or the shown contact. */
export type ListPerson = {
  id?: number
  uuid?: string | null
  name: string
  community?: Community | null
  position: Position
  precision?: string
}
export type ListMatch = ListPerson & {
  uuid: string
  community: Community
  channels?: Partial<Record<Channel, Entry[]>>
  scores?: Partial<Record<Channel, { entry?: string | null }[]>>
}
/** The map's own shape: `{ match, stages, peak }`, already filtered and sorted by the parent. */
export type ListItem = {
  match: ListMatch
  stages?: Partial<Record<Channel, number>>
  peak?: number
}
/** The person as the map holds them, and their match item where the search found them. */
export type ListContact = { person: ListPerson; item: ListItem | null }

type Where = ReturnType<typeof describeDistance>

export const MatchList = defineComponent({
  name: 'MatchList',
  props: {
    // Each item is { match, stages, peak } — the map's own shape, already filtered
    // and sorted by the parent. `stages` says which channels count for this person.
    matches: { type: Array as PropType<ListItem[]>, default: () => [] },
    // Presence people, filtered and sorted by the parent. Names are a stub today.
    silent: { type: Array as PropType<ListPerson[]>, default: () => [] },
    // Somebody the page was asked to show, or null: `{ person, item }` -- the person as the map
    // holds them, and their match item where the search found them (else null). Listed first.
    contact: { type: Object as PropType<ListContact | null>, default: null },
    // The member's own home: what the contact's distance is measured from, whatever the lens.
    home: { type: Object as PropType<Position | null>, default: null },
    // Where the distances are measured from: the search centre, or home under the travel lens.
    center: { type: Object as PropType<Position | null>, default: null },
    // Where the search is. The address search asks near it - not near `center`, which is the
    // member's home while the lens measures from there.
    searchCenter: { type: Object as PropType<Position | null>, default: null },
    // The place name of the search centre, resolved by the parent (a typed name, a
    // reverse lookup, "your home" or "the chosen point") and persisted there — so it
    // survives a mode switch or a reload. On a visit that shows a contact it is the place the
    // contact is found in, kept for the visit only, and '' until it is read.
    centerLabel: { type: String, default: '' },
    myPrecision: { type: String, default: 'genau' },
    // How far the search reaches: 'regional' or 'fern'. The list draws the same rows
    // either way — only the confirmation line above them changes, because the reach is
    // the one thing about a wide search that the rows themselves cannot show.
    reach: { type: String, default: 'regional' },
    // The radius of the STANDING reach, km — named in the wide line.
    radiusKm: { type: Number, default: 0 },
    sortMode: { type: String, default: 'naehe' },
    // The travel lens: 'suchpunkt' (distances from the search point) or 'wohnort'
    // (from home). showLens is true only once the two are different places.
    lensMode: { type: String, default: 'suchpunkt' },
    showLens: { type: Boolean, default: false },
  },
  emits: ['open', 'openContact', 'sort', 'lens', 'recenter'],
  setup(props, { emit }) {
    const { t, locale } = useI18n()

    // A comma for the ear, between two parts of a line that the eye sees a dot between (the dot is
    // CSS, and hidden from a screen reader). A sign, not a word: the same in every language. In
    // every line of the list: without it a screen reader was handed "Gaston-TischKI Playground"
    // (measured in the built wallet, the name Chrome computes for the line).
    const PAUSE = ', '

    /** What the search took hold of: the reach, the circle where it is wide, the place. */
    const centreLine = computed(() => {
      // Under a shown contact a centre without a name is one whose name is on its way (the parent
      // reads the place from the tiles). Nothing is said until it is there: the line is announced,
      // and a sentence that is replaced a moment later would be read out twice.
      if (!props.centerLabel && props.contact) {
        return ''
      }
      if (props.reach !== 'fern') {
        return t('matching.list.centeredOn', { place: props.centerLabel })
      }
      return props.centerLabel
        ? t('matching.list.centeredOnFern', { km: props.radiusKm, place: props.centerLabel })
        : t('matching.list.centeredOnFernNoPlace', { km: props.radiusKm })
    })

    // The sort and lens choices as ThemedSelect option lists ([{ value, text }]).
    const sortOptions = computed(() => [
      { value: 'naehe', text: t('matching.list.sortNaehe') },
      { value: 'passung', text: t('matching.list.sortPassung') },
      { value: 'breite', text: t('matching.list.sortBreite') },
    ])

    const lensOptions = computed(() => [
      { value: 'suchpunkt', text: t('matching.list.lensSearch') },
      { value: 'wohnort', text: t('matching.list.lensHome') },
    ])

    // --- which channels, the strongest line, the breadth ----------------------

    /** The matched channels of a person, in the fixed heart-first order. */
    const dotsFor = (item: ListItem) =>
      CHANNEL_KEYS.filter((channel) => (item.stages?.[channel] || 0) >= 1)

    /** The single strongest matched entry across the visible channels → its line. */
    const lineFor = (item: ListItem) => {
      let best: Entry | null = null
      let bestChannel: Channel | null = null
      for (const channel of CHANNEL_KEYS) {
        if ((item.stages?.[channel] || 0) < 1) {
          continue
        }
        for (const entry of item.match.channels?.[channel] || []) {
          if (entry.strength == null) {
            continue
          }
          if (!best || entry.strength > (best.strength as number)) {
            best = entry
            bestChannel = channel
          }
        }
      }
      if (!best) {
        return ''
      }
      return t(`matching.list.line.${bestChannel}`, { thing: best.summary })
    }

    /**
     * How many of my own entries this person answers, across the visible channels — the
     * thing the map could only glow and the profile could only imply. Different entries
     * of mine, counted by the entry each score answers: two of their entries on one of
     * mine are one. The line says "entries", so it counts entries; the glow counts the
     * things they are about (displayCore, channelStage). A typed question has no entry
     * of mine behind it and counts none.
     */
    const breadthOf = (item: ListItem) => {
      const mine = new Set<string>()
      for (const channel of CHANNEL_KEYS) {
        if ((item.stages?.[channel] || 0) < 1) {
          continue
        }
        for (const { entry } of item.match.scores?.[channel] || []) {
          if (entry !== null && entry !== undefined) {
            mine.add(entry)
          }
        }
      }
      return mine.size
    }

    // --- distance and direction, spoken honestly ------------------------------

    const whereFrom = (origin: Position | null, person: ListPerson): Where => {
      if (!origin) {
        return { band: 'near', km: null, showDirection: false, etwa: false }
      }
      const km = distanceKm(origin, person.position)
      return describeDistance(km, { mine: props.myPrecision, theirs: person.precision })
    }

    const dirFrom = (origin: Position | null, person: ListPerson) =>
      origin ? bearing8(origin, person.position) : 'n'

    /**
     * The place line. The distance is real text; the arrow is a decorative echo
     * (aria-hidden) and the bearing rides as a word, so a screen reader speaks it and
     * a sighted eye sees the arrow. The arrow snaps to the same eight points as the
     * word — the picture never claims more than the speech.
     */
    const placeText = (where: Where, dir: string): VNode => {
      if (where.band === 'near') {
        return <span>{t('matching.list.near')}</span>
      }
      const n = (where.km as number).toLocaleString(locale.value)
      const distance = where.etwa
        ? t('matching.list.kmEtwa', { n })
        : t('matching.list.kmExact', { n })
      if (!where.showDirection) {
        return <span class={['place', classes.place]}>{distance}</span>
      }
      const deg = COMPASS8.indexOf(dir) * 45
      return (
        <span class={['place', classes.place]}>
          {`${distance} `}
          <svg
            class='dir-arrow'
            viewBox='0 0 16 16'
            width={14}
            height={14}
            aria-hidden='true'
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <path
              d='M8 14 V4 M4.5 7 L8 3.5 L11.5 7'
              fill='none'
              stroke='currentColor'
              stroke-width={1.6}
              stroke-linecap='round'
              stroke-linejoin='round'
            />
          </svg>
          <span class='dir-word'>{t(`matching.list.dir.${dir}`)}</span>
        </span>
      )
    }

    /** From where the list measures: the search centre, or home under the travel lens. */
    const placeOf = (person: ListPerson) =>
      placeText(whereFrom(props.center, person), dirFrom(props.center, person))

    // --- address search (the blind member's only way to set the centre) --------

    // Made here, in setup, and the GMS address is read at each search rather than now: it arrives
    // asynchronously (utils/geoSearchProvider).
    const { gmsBase } = useGmsBase()
    const provider = makeGeoProvider({
      gmsBase,
      viewpoint: () => props.searchCenter,
      language: () => locale.value,
    })

    // The dot between two parts is drawn (CSS) and hidden from a screen reader, and the elements
    // keep no space between them: without the comma the line's name would run "Anna-SonneKI
    // Playground" and "im Nahbereichvon Deinem Zuhause aus" (measured in the built wallet, the
    // name Chrome computes). The comma is for the ear only.
    const separator = () => (
      <>
        <span class={['sr-only', classes['sr-only']]}>{PAUSE}</span>
        <span class={['row-sep', classes['row-sep']]} aria-hidden='true' />
      </>
    )

    /** The name, and the community where the row says so (`withCommunity`). */
    const rowHead = (person: ListPerson, withCommunity: boolean) => (
      <span class={['row-head', classes['row-head']]}>
        <span class={['row-name', classes['row-name']]}>{person.name}</span>
        {withCommunity ? (
          <>
            {separator()}
            <span class={['row-community', classes['row-community']]}>
              {person.community?.name}
            </span>
          </>
        ) : null}
      </span>
    )

    const rowDots = (item: ListItem) => (
      <span class={['row-dots', classes['row-dots']]} aria-hidden='true'>
        {dotsFor(item).map((channel) => (
          <span
            key={channel}
            class={['dot', classes.dot]}
            style={{ background: LABEL_COLORS[channel] }}
          />
        ))}
      </span>
    )

    const rowMatchLines = (item: ListItem) => (
      <>
        <span class={['row-line', classes['row-line']]}>{lineFor(item)}</span>
        {breadthOf(item) >= 2 ? (
          <span class={['row-breadth', classes['row-breadth']]}>
            {t('matching.list.meets', { n: breadthOf(item) })}
          </span>
        ) : null}
      </>
    )

    return () => {
      const { contact } = props
      return (
        <div class={['match-list', classes['match-list']]}>
          {/* The roof heading, screen-reader-only: it gives the section headings below a
              parent, so heading navigation reads h2 → h3 → h3 without a visible title. */}
          <h2 class={['sr-only', classes['sr-only']]}>{t('matching.list.heading')}</h2>

          {/* Controls first in reading order: the tally, how it is sorted, and where it
              is centred. On the map these sit around a canvas the eye scans at will; a
              screen reader has no such freedom, so what you reach for comes first. */}
          <div class={['list-controls', classes['list-controls']]}>
            <h3 class={['sr-only', classes['sr-only']]}>{t('matching.list.controlsHeading')}</h3>
            {/* Address search first: it is the way in (and a blind member's only way to
                set the centre — a map click is not open to them). Same order on desktop
                for consistency. */}
            <div class={['list-search', classes['list-search']]}>
              <label class={['control-label', classes['control-label']]} for='match-list-search'>
                {t('matching.map.search')}
              </label>
              <GeoSearchField
                id='match-list-search'
                provider={provider}
                onPick={(place: GeoPlace) => emit('recenter', place)}
              />
            </div>

            <div class={['list-sort', classes['list-sort']]}>
              <label class={['control-label', classes['control-label']]} for='match-list-sort'>
                {t('matching.list.sortBy')}
              </label>
              {/* ThemedSelect emits `change` with the chosen value directly (not a DOM event). */}
              <ThemedSelect
                id='match-list-sort'
                modelValue={props.sortMode}
                options={sortOptions.value}
                onChange={(value: string) => emit('sort', value)}
              />
            </div>

            {/* The travel lens: appears only once the search has left home, and switches
                whether the shown distances measure from the search point or from home. */}
            {props.showLens ? (
              <div class={['list-sort', classes['list-sort']]}>
                <label class={['control-label', classes['control-label']]} for='match-list-lens'>
                  {t('matching.list.lensBy')}
                </label>
                <ThemedSelect
                  id='match-list-lens'
                  modelValue={props.lensMode}
                  options={lensOptions.value}
                  onChange={(value: string) => emit('lens', value)}
                />
              </div>
            ) : null}

            {/* Confirmation that the search took hold: the place stays named (and is
                announced). Its own full-width row inside the controls; on a phone it is
                ordered directly under the search field, not under the sort.

                In the wide reach the line says so and names the circle: the same list shape
                is answering a different question, and only the sentence can tell you which.
                The regional line stays as it was - the radius there is the one the member
                has always had, and repeating it would be noise.

                ⚠️ And it shows WITHOUT a place name, where the regional one does not. The map
                names every centre once it knows the member's home (a typed name, "your home"
                or "the chosen point"), so the name is only missing before that - "centred on
                nothing" is worth hiding, but the reach and the circle are not.

                Under a shown contact the line keeps its place while it has nothing to say: the
                place the contact is found in is read a moment after the search moved onto them,
                and a line that came and went would push the sort up and down under a finger. On
                a phone that place is two lines (center-label-visit). */}
            {props.centerLabel || contact || props.reach === 'fern' ? (
              <p
                class={[
                  'center-label',
                  classes['center-label'],
                  contact ? ['center-label-visit', classes['center-label-visit']] : '',
                ]}
                role='status'
                aria-live='polite'
              >
                {centreLine.value}
              </p>
            ) : null}
          </div>

          {/* Somebody the page was asked to show -- a contact, from the contact window's pin (Bernd,
              09.10.2026). First, under a heading of their own, whatever the boxes under the map let
              through: the member came for this person, and the list is the one place a screen reader
              meets them (the map is inert under it). The search stands on them, so a distance from
              the search point would always read "nearby": theirs is measured from the member's home,
              and says so. Where the search found them as well, the line says what answers the
              member's entries, as a match's line does -- and they are not listed a second time below
              (the parent hands the two lists over without them). */}
          {contact ? (
            <section
              class={['list-section', 'list-section-contact', classes['list-section-contact']]}
              aria-labelledby='match-list-contact-head'
            >
              <h3 id='match-list-contact-head' class={['section-head', classes['section-head']]}>
                {t('matching.list.contactHeading')}
              </h3>
              <ul class={['rows', classes.rows]}>
                <li>
                  <button
                    type='button'
                    class={['row', classes.row, 'row-match', classes['row-match'], 'row-contact']}
                    data-test='match-list-contact'
                    onClick={() => emit('openContact')}
                  >
                    {contact.item ? rowDots(contact.item) : null}
                    <span class={['row-body', classes['row-body']]}>
                      {rowHead(contact.person, Boolean(contact.person.community?.name))}
                      {props.home ? (
                        <span
                          class={['row-where', classes['row-where']]}
                          data-test='match-list-contact-where'
                        >
                          {placeText(
                            whereFrom(props.home, contact.person),
                            dirFrom(props.home, contact.person),
                          )}
                          {separator()}
                          <span>{t('matching.list.fromHome')}</span>
                        </span>
                      ) : null}
                      {contact.item ? rowMatchLines(contact.item) : null}
                    </span>
                  </button>
                </li>
              </ul>
            </section>
          ) : null}

          {/* Your matches. The heading names the group; each person is one item; the
              order is the ranking, spoken as sequence and never as a number. */}
          {props.matches.length ? (
            <section class='list-section' aria-labelledby='match-list-matches-head'>
              <h3 id='match-list-matches-head' class={['section-head', classes['section-head']]}>
                {t('matching.list.matchesHeading')}
              </h3>
              <ul class={['rows', classes.rows]}>
                {props.matches.map((item) => (
                  <li key={item.match.uuid}>
                    <button
                      type='button'
                      class={['row', classes.row, 'row-match', classes['row-match']]}
                      onClick={() => emit('open', item.match)}
                    >
                      {rowDots(item)}
                      <span class={['row-body', classes['row-body']]}>
                        {rowHead(item.match, true)}
                        <span class={['row-where', classes['row-where']]}>
                          {placeOf(item.match)}
                        </span>
                        {rowMatchLines(item)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Everyone else nearby. A silent line opens the same window as a match (GMS-111):
              somebody without a match is still somebody to read about and to reach, and a
              line worth hearing while the network is small. Only a person the GMS names can
              be opened; an older GMS names nobody, and the line then says so by being off. */}
          {props.silent.length ? (
            <section class='list-section' aria-labelledby='match-list-others-head'>
              <h3 id='match-list-others-head' class={['section-head', classes['section-head']]}>
                {t('matching.list.othersHeading')}
              </h3>
              <ul class={['rows', classes.rows]}>
                {props.silent.map((person) => (
                  <li key={person.id}>
                    <button
                      type='button'
                      class={['row', classes.row, 'row-silent', classes['row-silent']]}
                      disabled={!(person.uuid && person.community?.uuid)}
                      onClick={() => emit('open', person)}
                    >
                      <span class={['row-body', classes['row-body']]}>
                        {rowHead(person, Boolean(person.community))}
                        <span class={['row-where', classes['row-where']]}>{placeOf(person)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Not under somebody the page shows: "nobody here" would stand under a name. */}
          {!contact && !props.matches.length && !props.silent.length ? (
            <p class={['list-empty', classes['list-empty']]}>{t('matching.list.empty')}</p>
          ) : null}
        </div>
      )
    }
  },
})
