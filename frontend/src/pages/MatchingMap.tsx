// AI-GENERATED — not an architecture reference
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { BButton, BCol, BFormInput, BModal, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import {
  type CSSProperties,
  computed,
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
  withKeys,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  crowdRadiusOf,
  DEFAULTS,
  HIT_MIN,
  hitSizeOf,
  LABEL_COLORS,
  listPeak,
  markerColor,
  peakStage,
  sanitizeSelection,
  scoresOf,
  stagesOf,
  topScore,
} from '@/components/Matching/displayCore'
import { GeoSearchField } from '@/components/Matching/GeoSearchField'
import { type ClusterPerson, MatchCluster } from '@/components/Matching/MatchCluster'
import { MatchList } from '@/components/Matching/MatchList'
import { MatchProfile, type ProfileMatch } from '@/components/Matching/MatchProfile'
import { MatchQuery, type QuerySelection } from '@/components/Matching/MatchQuery'
import { isOneself } from '@/composables/useContactOnMap'
import { useEntryDraft } from '@/composables/useEntryDraft'
import { useGmsBase } from '@/composables/useGmsBase'
import {
  distanceKm,
  forWindow,
  GMS_REJECTED,
  isUsablePlace,
  type MapMatch,
  type MapPresence,
  useMatches,
  withMine,
  withProfile,
} from '@/composables/useMatches'
import { useAppToast } from '@/composables/useToast'
import { listMatchingEntries, userLocationQuery } from '@/graphql/queries'
import { useWalletStore } from '@/store/useWalletStore'
import { escapeHtml } from '@/utils/escapeHtml'
import { makeGeoProvider } from '@/utils/geoSearchProvider'
import { loadMapEngine } from '@/utils/mapEngine'
import { isPlace, hasPosition as isPositionSet } from '@/utils/matchingPosition'
import { mapPrefPrefix } from '@/utils/matchingPrefs'
import { reverseName } from '@/utils/reverseGeocode'
import BiArrowLeft from '~icons/bi/arrow-left'
import BiBell from '~icons/bi/bell'
import './MatchingMap.css'
import classes from './MatchingMap.module.scss'

/**
 * A state class in both spellings: the plain name, which the specs and the global stylesheet
 * (MatchingMap.css) read, and the module's, which carries the rule.
 */
const stateClass = (name: string) => [name, classes[name]]

type Point = { lat: number; lng: number }
/** What BFormInput's model carries (its own `Numberish`, which the package does not export). */
type Numberish = string | number
/** A point with the name it came with, where a search field found it. */
type Place = Point & { label?: string }
/** Somebody the page was asked to show, as the map draws them (whereIs). */
type ShownPerson = {
  uuid: string
  name: string
  community: { uuid: string; name: string }
  position: Point
  precision: string
}
/** Anyone a window can open on: a match, a grey ring, or the shown person. */
type Person = MapMatch | MapPresence | ShownPerson
/** Two records name one person by the pair, however a server spells it (samePerson). */
type Named =
  | { uuid?: string | null; community?: { uuid?: string | null } | null }
  | null
  | undefined
/** A match the map draws: `{ match, stages, peak }`. */
type VisibleMatch = { match: MapMatch; stages: Record<string, number>; peak: number }
/** One of my own entries, as listMatchingEntries delivers it. */
type MyEntry = {
  uuid: string
  matchingType: string
  summary: string
  active?: boolean
  keyed?: boolean
}
type View = { lat: number; lng: number; zoom: number }

type Engine = typeof import('@/utils/mapEngine/maplibre')
type MapHandle = NonNullable<ReturnType<Engine['createMap']>['value']>
type MarkerHandle = ReturnType<MapHandle['marker']>
type MarkerGroup = ReturnType<MapHandle['group']>

const LOOKS = ['dunkel', 'normal', 'hell'] as const
type Look = (typeof LOOKS)[number]
const FILTERS = ['interesse', 'angebot', 'gesuch'] as const
// The two grey buckets of "everyone else", split so the list can silence the ones
// with nothing to read on their own. On the map both draw as rings and the fill
// tells them apart (GMS-74); here two checkboxes do. Both start on — while the
// network is small the silent are most of it, and a name nearby is a lead.
const OTHERS = ['andereMit', 'andereOhne'] as const
/** The five boxes under the map. */
type FilterKey = (typeof FILTERS)[number] | (typeof OTHERS)[number]
// Stub: the searcher's own precision. Live it comes from their position setting.
// With it 'genau', the exact people read exactly and the approximate ones blur —
// the coarser of the two ends always wins (describeDistance).
const MY_PRECISION = 'genau'

// Everything the map remembers is written straight to localStorage rather than into
// the persisted-state blob, so it survives a logout: logout removes only this app's
// own blob ('gradido-frontend', see store/store.js) and leaves keys outside it alone.
// That is deliberate -- the auto-logout is rarely a decision the member made, and
// there is no sense in punishing them for it by forgetting where they were searching.
//
// ⛔ But it used to survive INTO THE NEXT MEMBER as well: one flat prefix for the whole
// device, with nobody in it. Bernd found it on 10.09.2026 -- a keep-offer he switched
// off once stayed off for every account after, and a second account was carrying the
// street name of the one before it. The prefix carries the gradidoID now; see
// utils/matchingPrefs.
const DEFAULT_RADIUS = 25
// The wide reach starts wider: 500 km reaches Hamburg from Kuenzelsau and stops short
// of Vienna, which is about the size of a question somebody would still travel for.
const DEFAULT_RADIUS_FERN = 500
const MAX_RADIUS = 20000
// Regional first: the switch opens where the map has always stood.
const REACHES = ['regional', 'fern'] as const
type Reach = (typeof REACHES)[number]
// The zoom the map is built with. The real one arrives a tick later, from the
// remembered view or from the circle.
const BOOTSTRAP_ZOOM = 8

// Marker sizes in screen pixels per step. They stay constant while zooming, the
// way a pin does — a glow that grew with the zoom would read as a bigger match.
// Step 5, which only breadth reaches (GMS-184), follows the growth of the four before
// it (each step about 1.25 to 1.3 times the last): computed, not yet seen - it is
// judged by eye at its acceptance.
const GLOW_SIZE: Record<number, number> = { 1: 48, 2: 64, 3: 82, 4: 104, 5: 130 }
const DISC_SIZE: Record<number, number> = { 1: 20, 2: 28, 3: 38, 4: 48, 5: 60 }

// The veil over everything outside the search. It dims by taking contrast away,
// not light: on the dark map the stars are bright, so a pale wash costs them
// their edge — on the light maps a dark one does. The inside stays untouched;
// that is where the people are.
const MASK = {
  dunkel: { fill: '#ffffff', opacity: 0.08, edge: 'rgb(255 255 255 / 30%)' },
  normal: { fill: '#000000', opacity: 0.08, edge: 'rgb(0 0 0 / 35%)' },
  hell: { fill: '#000000', opacity: 0.08, edge: 'rgb(0 0 0 / 35%)' },
}

// The crosshair fades from full at COVER_FADE px between the map's middle and the
// search centre down to gone at COVER_TOL; within SNAP_TOL the map eases the last
// pixels onto the centre so "on the centre" is exact at any zoom.
const COVER_TOL = 14
const COVER_FADE = 72
const SNAP_TOL = 24
// Matches whose screen points fall within CROWD_PX of the tapped one share the spot —
// the tap resolves the crowd instead of blindly opening the top marker. The radius is
// the largest tap area, not a number of its own: two tap areas overlap when their
// centres are closer than that, a tap there is ambiguous, and the map zooms in instead
// of guessing whose area took it (F-10).
const CROWD_PX = crowdRadiusOf(DISC_SIZE)

// The grey rings: small on purpose - they are many, and they are not matches. Their tap
// area is the markers' all the same (HIT_MIN, F-10), reached through the engine's tap
// tolerance: a tap counts as on a ring within radius + half the line + tolerance of its
// centre (`ringAt` in utils/mapEngine/maplibre).
const RING_RADIUS = 5
const RING_WEIGHT = 2
const RING_TOLERANCE = HIT_MIN / 2 - RING_RADIUS - RING_WEIGHT / 2

// Somebody the map was asked to show (the contact window's pin): a gold ring around their
// point, wide enough to stand around a glowing match's tap area or the house. Their point is
// the one the GMS blurred.
const SHOWN_RING = 56
// What names a person in the address: two uuids, as the contacts page is asked with.
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const MatchingMap = defineComponent({
  name: 'MatchingMap',
  setup(_, { expose }) {
    const { t, locale } = useI18n()
    const router = useRouter()
    const route = useRoute()
    const entryDraft = useEntryDraft()
    const store = useWalletStore()
    const { toastError } = useAppToast()
    // The address the GMS search answers under. Asked for here because it needs the Apollo client,
    // which only setup can reach - the control that searches with it is built a quarter second
    // after mounting.
    const { gmsBase } = useGmsBase()

    // True where this device cannot draw the map (no WebGL 2, K-013): a line under it says why.
    const noWebgl = ref(false)

    // The prefix that belongs to whoever is signed in. Null where the store cannot say -- then
    // nothing is read and nothing is written, because a map on its defaults is the honest
    // answer to "whose settings are these?" and the old flat key was the dishonest one.
    //
    // The sweep of those old flat keys used to stand here and now runs at sign-out, beside the
    // seven other things that must not outlive one member: an account without a position never
    // reaches this page, so on exactly those devices the old keys were never cleared.
    const prefPrefix = mapPrefPrefix(store.gradidoID)

    const mapContainer = ref<HTMLDivElement | null>(null)
    // The element initMap hangs on the map as the search control.
    const searchHost = ref<HTMLDivElement | null>(null)
    const look = ref(readLook())
    const mode = ref(readMode())
    const sortMode = ref(readSort())
    const lensMode = ref(readLens())
    const breite = ref(readBreite())
    const visible = reactive(readVisible())

    const reach = ref(readReach())
    const radiusRegional = ref(readRadiusFor('regional'))
    const radiusFern = ref(readRadiusFor('fern'))
    // One number for the whole page — the one the standing reach owns. Everything that
    // reads the radius (the circle, the framing, the search, the list) reads this, so the
    // two radii stay an implementation detail of the switch.
    const radius = computed(() =>
      reach.value === 'fern' ? radiusFern.value : radiusRegional.value,
    )
    const searchCenter = ref(readCenter())
    // The place name of the current centre, for the list's confirmation line. Kept in
    // `pref` so it survives a mode switch, another page, and the logout — the label was
    // the only part that used to be lost; the centre itself was always saved.
    const centerLabel = ref(readPref<string>('centerLabel', ''))
    const radiusModal = ref(false)
    // What the field hands back: a number where the words were one, else the words (BFormInput's
    // own `number` modifier).
    const radiusDraft = ref<Numberish | null>(DEFAULT_RADIUS)

    const {
      matches,
      presence,
      error: searchError,
      load,
      suggest,
      profile: loadProfile,
    } = useMatches()

    // A search that did not come through says so, in words the member can read. The
    // GMS answers with status codes and its own messages, neither meant for a screen.
    // Old results are already gone by the time this fires, so the toast is the only
    // thing that explains the empty map.
    watch(searchError, (err) => {
      if (!err) {
        return
      }
      // Two different facts, two different sentences. A 4xx is the GMS answering and
      // refusing — it is there, it read the request, it would not have it — and calling that
      // "not reachable" is what pointed the whole morning of 09.09.2026 at a healthy server
      // while the wallet was asking it about a latitude of `undefined`.
      // Two whole t() calls rather than one with the key chosen inside it: the i18n lint
      // counts literal keys only, and a computed key reads to it as both of them being unused.
      toastError(
        err.code === GMS_REJECTED
          ? t('matching.map.searchRejected')
          : t('matching.map.searchFailed'),
      )
    })

    /**
     * What is being searched for right now — remembered under `pref.` like every other
     * choice on this page.
     *
     * It used to be the one exception, on the argument that a typed question is a one-off
     * and yesterday's word in the field would puzzle rather than help. The offer to keep
     * a search is what overturned that: taking it up LEAVES this page for the entry form,
     * and coming back to a blank map meant losing the very results you had just decided
     * were worth keeping. Someone who saves the search first and looks properly second is
     * doing the sensible thing, and the page was punishing them for it.
     *
     * `pref.` and not something shorter-lived, for the reason Bernd gave when the map's
     * viewport was decided: it is his own device. The words never travel to the address
     * bar or the history — that rule is untouched, and it was always the real one.
     */
    const selection = ref(readSelection())

    // My own entries, so one of them can be the question. Real data, not the stub -
    // they are mine, and the wallet already holds them.
    const myEntries = ref<MyEntry[]>([])
    // cache-and-network, not cache-first: the entries tab writes this same list, and a
    // member who adds an entry and comes straight here would otherwise not find it in
    // the menu - the one thing they just made.
    const { onResult: onEntries } = useQuery(listMatchingEntries, null, {
      fetchPolicy: 'cache-and-network',
    })
    const { client: apolloClient } = useApolloClient()
    const entryKey = (entries: MyEntry[]) =>
      entries
        .map((entry) => entry.uuid)
        .sort()
        .join()
    // The entries that have their words here (`keyed`). The GMS finds with them once the keying run
    // has handed the words over, a moment later -- or, where that send failed, not before the
    // member's next edit: `keyed` says "worked out", not "arrived over there".
    const keyedKey = (entries: MyEntry[]) => entryKey(entries.filter((entry) => entry.keyed))

    /**
     * An entry of mine that has no words yet, asked about until it has them.
     *
     * The GMS finds with an entry only once it has its words, and those are worked out a moment
     * after a save -- or, for a member who has just become findable (an event link's account on
     * its way from "home" to here), only from then on. The search this page asks on arrival comes
     * before them and finds nothing, and the page would show an empty map until the member left
     * and came back. So while a live entry of mine has no words, the list is asked again, less
     * often as time goes on, and the first answer in which one has them asks the search again
     * (onEntries). The member who picked that entry above sees it fill without touching anything.
     *
     * Only while the member is findable: the words are worked out for members who take part, and
     * for anybody else nothing would come. And not for ever: a community that does not have its
     * entries keyed would otherwise be asked every few seconds for as long as the page is open.
     * These pauses add up to a little over two minutes; the words come in seconds once asked for.
     */
    const WORDS_ASKED_AFTER_MS = [
      2000, 3000, 4000, 5000, 6000, 8000, 10000, 15000, 20000, 25000, 30000,
    ]
    let wordsAsked = 0
    let wordsTimer: ReturnType<typeof setTimeout> | null = null
    let pageAlive = true
    /**
     * The search after the words, asked once more a moment later. `keyed` says the words were worked
     * out here; they reach the GMS with the keying run's publish right after, and a search that is
     * quicker than that publish finds nothing with them (coderabbit, #4150). One more search three
     * seconds on catches a publish that was slow, on its own clock: the list's questions may be used
     * up by then. A publish that failed it cannot mend -- the member's next edit or a repair run does.
     */
    const SEARCH_AGAIN_AFTER_WORDS_MS = 3000
    let wordsSearchTimer: ReturnType<typeof setTimeout> | null = null
    function searchAfterWords() {
      arrivalOver()
      searchUnasked()
      clearTimeout(wordsSearchTimer ?? undefined)
      // Cleared on unmount, so it never searches for a page that is gone.
      wordsSearchTimer = setTimeout(() => {
        wordsSearchTimer = null
        searchUnasked()
      }, SEARCH_AGAIN_AFTER_WORDS_MS)
    }
    const waitsForWords = () =>
      Boolean(store.gmsAllowed) && myEntries.value.some((entry) => entry.keyed === false)
    function askAgainForWords() {
      if (wordsTimer || !waitsForWords() || wordsAsked >= WORDS_ASKED_AFTER_MS.length) {
        return
      }
      wordsTimer = setTimeout(askForWords, WORDS_ASKED_AFTER_MS[wordsAsked])
    }
    /**
     * One question for the list, the page's own and not the member's doing: ⛔ `renewSession:
     * false`, or every one of them would move the idle logout ten minutes on
     * (plugins/apolloProvider.js) -- eleven of them where the words never come. A question of
     * Apollo's own (`refetch`) cannot say so. A question that fails is asked again after the next
     * pause, within the same count.
     *
     * ⛔ Its answer is taken only where no list has come in while it was on its way (`listsTaken`):
     * the page's own list may have answered meanwhile -- the arrival's network answer, or this very
     * answer, which the cache hands to onEntries as well where it changed the list -- and an answer
     * read before it must not write over it (coderabbit, #4150). Where that list still has an entry
     * without words, it has asked again itself (takeEntries). Written to the cache all the same:
     * the next visit then starts on the words this one found.
     */
    let listsTaken = 0
    async function askForWords() {
      wordsTimer = null
      wordsAsked++
      const takenBefore = listsTaken
      try {
        const { data } = await apolloClient.query({
          query: listMatchingEntries,
          fetchPolicy: 'network-only',
          context: { renewSession: false },
        })
        if (!pageAlive || listsTaken !== takenBefore) {
          return
        }
        if (!data?.listMatchingEntries) {
          throw new Error('listMatchingEntries: no answer')
        }
        takeEntries(data.listMatchingEntries)
      } catch {
        if (pageAlive) {
          askAgainForWords()
        }
      }
    }

    onEntries((result) => takeEntries(result.data?.listMatchingEntries))
    function takeEntries(list: MyEntry[] | undefined) {
      listsTaken++
      const keyBefore = entryKey(myEntries.value)
      const keyedBefore = keyedKey(myEntries.value)
      myEntries.value = (list ?? []).filter((entry) => entry.active)
      askAgainForWords()
      // A remembered choice can outlive what it points at: the entry may have been
      // deleted or paused since. Left standing it would show as "all my entries" in the
      // bar while the search narrowed to something that no longer exists — a page that
      // says one thing and does another. The state that always works is the fallback.
      const chosen = selection.value
      if (chosen.kind === 'entry' && !myEntries.value.some((e) => e.uuid === chosen.uuid)) {
        // Not the member's choice but the page's own: its search waits like the others the page
        // asks of its own accord (searchUnasked).
        onSelection({ kind: 'all' }, { unasked: true })
        // onSelection searches on its own; asking twice would be the same question.
        return
      }
      // Ask again once the list has actually changed: an entry added, paused or deleted
      // changes what the GMS answers. The GMS reads my entries through the token, not
      // from this list, so every search is already tagged with the entry of mine each
      // match answers - on a cold load the list arriving after the location repeats the
      // first search once, a round trip spent for the simpler rule. Before a centre exists
      // runSearch returns without asking.
      //
      // And once an entry of mine has its words: the GMS finds with it from then on, and the search
      // asked before them found nothing with it (askAgainForWords). That search is a later one, not
      // the arrival's: a window left open last time is not brought back by it (arrivalOver).
      if (entryKey(myEntries.value) !== keyBefore) {
        searchUnasked()
      } else if (keyedKey(myEntries.value) !== keyedBefore) {
        searchAfterWords()
      }
    }

    /**
     * Take a typed search over to the entry form, filled in.
     *
     * Handed over in memory rather than as a route parameter: the words are the
     * member's own, and an address bar keeps them long after the moment. The form still
     * opens and still has to be sent: an invitation, not an entry made behind their back.
     */
    function keepAsEntry() {
      if (!searchQuery.value) {
        return
      }
      entryDraft.put({
        summary: searchQuery.value.text,
        matchingType: searchQuery.value.matchingType,
      })
      answerKeepOffer()
      router.push('/matching/entries')
    }

    /**
     * Answered for THIS question, not for good — and it has to outlive the page.
     *
     * Taking the offer up LEAVES the map for the entry form, so a marker that lived only
     * in memory would be gone on the way back and the band would rise again, offering to
     * keep a search that was just kept. Saying no is stored for the same reason: it is an
     * answer to a sentence, and the sentence is still on screen when you return.
     *
     * A new question clears it. Both answers mean "not for this one" — never "never
     * again", because the offer is our answer to why so few members ever write an entry.
     */
    const keepDismissed = ref(readPref<unknown>('queryAnswered', false) === true)

    /**
     * Never offer this again - the member's own answer, kept like every other choice on
     * this page. Separate from `queryAnswered`, which is about ONE search and is taken
     * back the moment the next one is typed; this one is not taken back by anything here.
     */
    const keepOfferOff = ref(readPref<unknown>('queryOfferNever', false) === true)
    /** Ticked but not yet acted on: it says what the next answer means, not more. */
    const keepNever = ref(false)

    const showKeepOffer = computed(
      () => Boolean(searchQuery.value) && !keepDismissed.value && !keepOfferOff.value,
    )

    function answerKeepOffer(answered = true) {
      keepDismissed.value = answered
      writePref('queryAnswered', answered)
      if (!answered) {
        // The offer is being armed again for a new search, so a tick nobody acted on
        // does not carry over into it.
        keepNever.value = false
        return
      }
      if (keepNever.value) {
        keepOfferOff.value = true
        writePref('queryOfferNever', true)
      }
    }

    function onSelection(next: QuerySelection, { unasked = false }: { unasked?: boolean } = {}) {
      selection.value = next
      writePref('query', next)
      answerKeepOffer(false)
      closeCluster()
      if (unasked) {
        searchUnasked()
      } else {
        runSearch()
      }
    }

    // What the search asks for beyond the place: nothing for "everything" and for a
    // single entry of mine (the entry only narrows what is SHOWN, the search is the
    // same), and the typed sentence when there is one.
    const searchQuery = computed(() =>
      selection.value.kind === 'typed'
        ? { text: selection.value.text, matchingType: selection.value.matchingType }
        : null,
    )

    // The profile window. `pref.gms.map.profile` holds the uuid of the open person,
    // so it survives the round trip to the send form and the auto-logout — you come
    // back to the map AND to whoever you were looking at.
    const profileOpen = ref(false)
    const activeMatch = ref<ProfileMatch | null>(null)
    // What the window shows: the person, and under each matched entry the entries of mine it
    // answers (withMine). Computed, not set once, so the lines come even when my entries
    // arrive after the window has opened.
    const windowMatch = computed(() => withMine(activeMatch.value, myEntries.value))
    const clusterOpen = ref(false)
    const activeCluster = ref<ClusterPerson[]>([])
    // True while zoomed into a cluster: the map is centred on the crowd, not on the
    // search centre, so the crosshair stays hidden — a tap must not move the search
    // there. clusterZoomBase is the zoom we came from; dropping back to it ends it.
    let inClusterZoom = false
    let clusterZoomBase = 0

    let map: MapHandle | null = null
    // Held so unmounting can call it off; initMap runs a quarter second after mount.
    let initTimer: ReturnType<typeof setTimeout> | null = null
    // What the search field asks. Made here rather than in initMap, because the field is in
    // the template from the first tick - and the GMS address is read at each search rather
    // than now: it arrives asynchronously (utils/geoSearchProvider).
    const geoProvider = makeGeoProvider({
      gmsBase,
      viewpoint: () => map?.getCenter() ?? null,
      language: () => locale.value,
    })
    // The markers of the matches come and go together, so they share a group; the house
    // and the centre disc are single markers. The grey rings and the mask belong to the
    // engine, which keeps one of each (setPresence, setCircle).
    let matchLayer: MarkerGroup | null = null
    let ownLayer: MarkerHandle | null = null
    let centreLayer: MarkerHandle | null = null
    let snapping = false

    const ownPosition = ref<Point | null>(null)
    // 0 when the map's middle sits on the search centre — the crosshair fades out then,
    // and only the disc marks the spot; 1 when it is far enough that setting a new centre
    // there makes sense.
    const crosshairOpacity = ref(1)
    const crosshairStyle = computed<CSSProperties>(() => ({
      opacity: crosshairOpacity.value,
      pointerEvents: crosshairOpacity.value < 0.06 ? 'none' : 'auto',
    }))

    // The matches the map is showing right now. Drawing and counting both read this
    // one list, so the heading can never claim a person the map does not draw.
    /**
     * The focus lens: only what answers ONE entry of mine.
     *
     * Pure display. The search asked the very same question of the server; this narrows
     * what came back, so switching between my entries costs nothing and changes nothing
     * out there. The scores are rebuilt from the narrowed entries, or a person would
     * keep glowing for an entry the member just filtered away.
     */
    const focusedMatches = computed(() => {
      if (selection.value.kind !== 'entry') {
        return matches.value
      }
      const wanted = selection.value.uuid
      const narrowed: MapMatch[] = []
      for (const match of matches.value) {
        const channels: Record<string, MapMatch['channels'][string]> = {}
        for (const [channel, entries] of Object.entries(match.channels ?? {})) {
          const kept = entries.filter((entry) => entry.matchedEntryUuid === wanted)
          if (kept.length) {
            channels[channel] = kept
          }
        }
        if (Object.keys(channels).length) {
          narrowed.push({ ...match, channels, scores: scoresOf(channels) })
        }
      }
      return narrowed
    })

    // The matches the map is showing right now. Drawing and counting both read this
    // one list, so the heading can never claim a person the map does not draw.
    //
    // The channel boxes are in charge here whatever the question is. They used to be
    // bypassed during a typed one, so that a box ticked off weeks ago could not empty it
    // - but the boxes were still on screen and still in charge for a search narrowed to
    // one of my own entries, which has exactly the same single channel. Protecting one
    // and not the other made the control mean different things at different moments,
    // which is worse than the case it was guarding against: an unticked box that leaves
    // the map dark at least says so, in writing, right under the map.
    const visibleMatches = computed(() => {
      const shown: VisibleMatch[] = []
      for (const match of focusedMatches.value) {
        const stages = stagesOf(match, DEFAULTS, breite.value, visible)
        const peak = peakStage(stages)
        if (peak < 1) {
          continue
        }
        shown.push({ match, stages, peak })
      }
      return shown
    })

    // The presence rings the filter lets through, split by whether they have entries.
    //
    // Empty in the wide reach, and decided HERE rather than waited for: the answer clears
    // `presence`, but only after a token fetch and a round trip, and until then the rings of
    // the 25 km circle would sit inside the 500 km one, be counted in the found line and
    // listed under "others nearby" - with the two boxes that would hide them gone from the
    // controls at that very moment. Everything that shows a ring reads this one computed
    // (the map's drawPresence, foundCount, the list's sortedPresence), so saying it once
    // here covers all three.
    const visiblePresence = computed(() =>
      reach.value === 'fern'
        ? []
        : presence.value.filter((person) =>
            person.hasEntries ? visible.andereMit : visible.andereOhne,
          ),
    )

    // Everyone the map is showing — the glowing matches plus the grey rings. They are
    // people too, so they count; the filter itself breaks the number down.
    const foundCount = computed(() => visibleMatches.value.length + visiblePresence.value.length)

    // The map lets the eye roam; a list must pick an order, and that choice is the one
    // stance a list takes where the map could stay neutral. Proximity opens it: early
    // on almost everyone is silent, so there is little glow to rank and distance always
    // means something. Fit and breadth sort by the same peak the map glows by — breadth
    // counted only here, so a list sort never quietly flips the map's amplifier — with
    // the continuous score breaking ties and distance behind that.
    // Distances — and the proximity sort — measure from the lens origin: the search
    // point, or home when the travel lens is switched there. So what the list shows is
    // what it sorts by; the two never drift apart.
    const lensOrigin = computed(() =>
      lensMode.value === 'wohnort' && ownPosition.value ? ownPosition.value : searchCenter.value,
    )

    // How far from home a point may lie and still count as home, in km. A small distance, not
    // an exact match, so float and snap noise at home never makes it somewhere else.
    const HOME_KM = 0.1

    /** Whether a point is the member's own home, within that noise. */
    function isHomePoint(point: Point | null) {
      if (!ownPosition.value || !point) {
        return false
      }
      return distanceKm(ownPosition.value, point) <= HOME_KM
    }

    // The lens only says something once the search has left home; until then both
    // origins give the same reading, so the switch stays out of the way (and off a
    // phone).
    const showLens = computed(() => {
      if (!ownPosition.value || !searchCenter.value) {
        return false
      }
      return distanceKm(ownPosition.value, searchCenter.value) > HOME_KM
    })

    /**
     * The name the list's line gives the centre (K-002). The member's home is their home, named
     * without asking anybody - also where a name is stored for it: until K-002 the first visit and
     * the home button stored the reverse lookup of the home, and that street name would otherwise
     * go on naming it. Any other centre keeps the name it came with (typed, or looked up for a
     * point set on the map), or is the point the member chose. Empty while the home is not known
     * yet, so the line cannot call a point "chosen" that turns out to be the home -- and while the
     * search stands on somebody the page shows and the place they are found in is still being read
     * (nameVisitCentre): nobody chose that point, and the line says nothing rather than something
     * it takes back a moment later.
     */
    const centerLabelShown = computed(() => {
      if (isHomePoint(searchCenter.value)) {
        return t('matching.map.centreHome')
      }
      if (centerLabel.value) {
        return centerLabel.value
      }
      if (!ownPosition.value || !searchCenter.value) {
        return ''
      }
      if (isShownPoint(searchCenter.value)) {
        return ''
      }
      return t('matching.map.centrePoint')
    })

    /** Whether two points are one and the same, to the last digit. */
    function isSamePoint(one: Point | null | undefined, other: Point | null | undefined) {
      return !!one && !!other && one.lat === other.lat && one.lng === other.lng
    }

    /** Whether a point is the published point of the person the page shows. */
    function isShownPoint(point: Point | null) {
      return isSamePoint(point, shown.value?.position)
    }

    // How precisely the point is known that the list measures from: the member's own, for their home
    // and for a search point they chose. On a visit that shows somebody the search stands on THEIR
    // published point, and that may be blurred -- measured from there, a figure with a decimal and a
    // bearing would claim more than is known. The coarser end wins (describeDistance), so the list
    // is told which end this one is.
    //
    // The member's own home is known exactly, also where the shown person is found on that very
    // point -- somebody under the same roof, at the same address (coderabbit on #4117): from the
    // home, a distance is as precise as on any visit.
    const originPrecision = computed(() => {
      const origin = lensOrigin.value
      const person = shown.value
      if (
        !person ||
        !isSamePoint(origin, person.position) ||
        isSamePoint(origin, ownPosition.value)
      ) {
        return MY_PRECISION
      }
      return person.precision
    })

    function centreDistance(person: { position: Point }) {
      return lensOrigin.value ? distanceKm(lensOrigin.value, person.position) : 0
    }

    const sortedMatches = computed(() => {
      const items = [...visibleMatches.value]
      if (sortMode.value === 'naehe') {
        return items.sort((a, b) => centreDistance(a.match) - centreDistance(b.match))
      }
      return items.sort((a, b) => {
        const pa = listPeak(a.match, sortMode.value, visible)
        const pb = listPeak(b.match, sortMode.value, visible)
        if (pb !== pa) {
          return pb - pa
        }
        const ta = topScore(a.match, visible)
        const tb = topScore(b.match, visible)
        if (tb !== ta) {
          return tb - ta
        }
        return centreDistance(a.match) - centreDistance(b.match)
      })
    })

    const sortedPresence = computed(() =>
      [...visiblePresence.value].sort((a, b) => centreDistance(a) - centreDistance(b)),
    )

    const enabled = computed(() => Boolean(store.gmsAllowed))
    const { onResult, onError } = useQuery(
      userLocationQuery,
      {},
      { fetchPolicy: 'network-only', enabled },
    )

    onResult(({ data }) => {
      const location = data?.userLocation
      if (!location) {
        return
      }
      // No pin, no map: the entry gate on the matching page says the same thing, and
      // a map centred on nothing would be a riddle rather than an answer. The router
      // guard turns this member away before the page is built at all; this is the belt
      // for the answer that arrives AFTER it, when the store said yes and the server
      // says no.
      //
      // Two numbers, not a truthy object: until 09.09.2026 this read `!location.userLocation`,
      // and an account without a position was answered `{}` — truthy, so the redirect stayed
      // silent and everything below ran on (undefined, undefined).
      if (!isPositionSet(location.userLocation)) {
        // Correct the store on the way out, not only the navigation. The guard in front of
        // this page reads it, so leaving a stale yes standing would admit the member again on
        // the next attempt and the bounce would repeat, silently, every time.
        store.setUserLocation(null)
        router.replace('/matching/position')
        return
      }
      ownPosition.value = {
        lat: location.userLocation.latitude,
        lng: location.userLocation.longitude,
      }
      // First visit ever: the search starts where the member is. That is the normal
      // search — who is near me — and the only moment we get to choose it for them.
      // Nothing is looked up for its name: the list calls it the member's home
      // (centerLabelShown), so the home position is not sent to a reverse lookup (K-002).
      if (!searchCenter.value) {
        searchCenter.value = { ...ownPosition.value }
      }
      // Written down is the member's OWN centre. On a visit that shows somebody the live one may
      // stand on them already (searchAroundShown), and that one is not theirs: the home is.
      if (!readCenter()) {
        writePref('center', visitSearch ? { ...ownPosition.value } : searchCenter.value)
      }
      drawOwn()
      drawCircle()
      restoreView()
      searchUnasked()
    })
    onError((error) => toastError(error.message))

    /**
     * Somebody the page was asked to show (Bernd, 09.10.2026): a contact, named in the address by
     * the pair a conversation is asked for with -- `/matching/karte?with=<gradidoID>&community=<uuid>`,
     * where the contact window's pin leads. Read off the route, so the page answers to whatever
     * address it stands under. A pair that is not two uuids names nobody, and the GMS is not asked
     * about it.
     *
     * Nor does the member's own id name anybody to show: the house is their mark. Such an address
     * is what is left when one account signs out on this page and the contact it showed signs in on
     * the same browser -- the way back after signing in is the address the first one stood on.
     */
    const askedPerson = computed(() => {
      const { with: gradidoID, community: communityUuid } = route.query ?? {}
      const named = [gradidoID, communityUuid].every(
        (part) => typeof part === 'string' && UUID_SHAPE.test(part),
      )
      return named && !isOneself(gradidoID, store)
        ? { gradidoID: gradidoID as string, communityUuid: communityUuid as string }
        : null
    })

    // The person as the map draws them, once the GMS has said where they stand: in a ring's shape
    // (toPresence) -- name, community, the point the GMS blurred -- so the window opens on them as
    // on any ring, and the list names them first (MatchList, "Dein Kontakt").
    const shown = ref<ShownPerson | null>(null)
    let shownLayer: MarkerHandle | null = null
    // Counts the persons asked for: an answer for an earlier address, or for a page that is gone,
    // is let go.
    let shownRequest = 0
    // Whether the search stands on the shown person for this visit only (searchAroundShown). The
    // centre and its name are then not the member's own: neither is written down, and neither is
    // the view -- the next visit opens where the member last searched and looked for themselves. A
    // search the member moves is theirs again, with the view of it (moveSearchTo).
    let visitSearch = false
    // Whether the map still has to be brought onto the circle of that search. It is brought there
    // ONCE -- when the person is known and the map is there, whichever comes last -- and never
    // pulled back: by the next thing that restores the view (a location answer that comes late) the
    // member may have looked elsewhere.
    let visitFramePending = false
    // Whether an answer about the person is still on its way, and whether a search the page asks
    // of its own accord waits for it (searchUnasked).
    let asking = false
    let searchHeld = false
    // Whether the member moved the search themselves while that answer was on its way. Then it
    // stays where they put it: the person is marked and listed, and the search is not taken from
    // under the member's hand.
    let movedWhileAsking = false

    /**
     * Ask the GMS where the person stands -- its profile route, which answers for the pair wherever
     * they live --, then mark them, name them first in the list and search around them: for this
     * visit the search stands on the person (Bernd, 09.10.2026). The map then shows who lives around
     * them, and the list -- the one representation a blind member has -- reads the same.
     *
     * Somebody the GMS does not hold (any more) is not on the map, and the member is told so; the
     * page then stands as it would without the address. The pin is only offered for somebody who was
     * there a moment ago, so this is the rare case: "findable" switched off in between, or an
     * address kept from another day.
     *
     * ⛔ Every way out of here settles the search: around the person, or as the member left it
     * (searchOnOwnAgain) -- also where the page stays and only its address changes.
     */
    async function showAsked() {
      const request = ++shownRequest
      shown.value = null
      drawShown()
      updateCentreCover()
      const person = askedPerson.value
      let answer: Awaited<ReturnType<typeof whereIs>> | null = null
      if (person && enabled.value) {
        asking = true
        movedWhileAsking = false
        answer = await whereIs(person)
        // An answer for an earlier address, or for a page that is gone: the question that came after
        // it settles the search, and nothing is said about this one.
        if (request !== shownRequest) {
          return
        }
      }
      asking = false
      if (answer?.refusal) {
        toastError(answer.refusal)
      }
      if (!answer?.person) {
        searchOnOwnAgain()
        return
      }
      const found = answer.person
      shown.value = found
      drawShown()
      // The crosshair steps back over them (and comes back where the mark was taken away above):
      // it is told here, not only by the next move of the map.
      updateCentreCover()
      if (movedWhileAsking) {
        searchOnOwnAgain()
        return
      }
      searchAroundShown(found)
    }

    /**
     * Where the GMS holds a person: `{ person }` as the map draws them, or `{ refusal }` -- the
     * sentence for the member -- where there is nobody to show.
     */
    async function whereIs({
      gradidoID,
      communityUuid,
    }: {
      gradidoID: string
      communityUuid: string
    }): Promise<{ refusal?: string; person?: ShownPerson }> {
      let published = null
      try {
        published = await loadProfile(gradidoID, communityUuid)
      } catch (err) {
        // Two whole t() calls rather than one with the key chosen inside it: the i18n lint counts
        // literal keys only.
        return {
          refusal:
            (err as { status?: number })?.status === 404
              ? t('matching.map.contactNotOnMap')
              : t('matching.profile.unavailable'),
        }
      }
      // The GMS is a foreign system: a point off the globe is finite and is no place, and MapLibre
      // refuses to stand a marker on one.
      if (!isUsablePlace(published?.position)) {
        return { refusal: t('matching.map.contactNotOnMap') }
      }
      return {
        person: {
          uuid: published.uuid ?? gradidoID,
          name: published.name ?? '',
          community: published.community?.uuid
            ? published.community
            : { uuid: communityUuid, name: published.community?.name ?? '' },
          position: published.position,
          precision: published.precision,
        },
      }
    }

    /**
     * For this visit the search stands on the shown person: its centre on their point, the radius as
     * the member has it, the map framing that circle, and the list's line naming the place they are
     * found in ("Umkreis um Wehlheiden, Kassel" -- nameVisitCentre). Nothing of it is written down --
     * see `visitSearch`.
     */
    function searchAroundShown({ position, name }: ShownPerson) {
      visitSearch = true
      inClusterZoom = false
      // Only an overlay that is open: closing writes it away, and one remembered for the way back
      // from the send form is not this visit's to forget.
      if (clusterOpen.value) {
        closeCluster()
      }
      searchCenter.value = { lat: position.lat, lng: position.lng }
      nameVisitCentre(position, name)
      drawCircle()
      drawCentre()
      visitFramePending = true
      frameVisit()
      // Asked at once, whether or not the member's home is known yet: an answer about the home that
      // fails or stays out must not leave the visit without its search. Where that answer comes
      // after, it asks the same search once more, as it does after the member's entries on any
      // visit.
      runSearch()
    }

    // The circle of the visit's search in view, at once -- the person stands in its middle. Once:
    // see `visitFramePending`.
    function frameVisit() {
      if (!map || !visitSearch || !visitFramePending) {
        return
      }
      visitFramePending = false
      zoomToCircle()
      updateCentreCover()
    }

    /**
     * No visit (any more): the search stands where the member left it. The page stays while its
     * address changes, so a visit can end here -- the address names nobody any more, or somebody who
     * is not on the map -- and the centre the member did not choose goes with it. A first search
     * that waited for the answer about the person is asked now.
     */
    function searchOnOwnAgain() {
      const held = searchHeld
      searchHeld = false
      if (!visitSearch) {
        if (held) {
          runSearch()
        }
        return
      }
      visitSearch = false
      visitFramePending = false
      inClusterZoom = false
      if (clusterOpen.value) {
        closeCluster()
      }
      searchCenter.value = readCenter() ?? (ownPosition.value ? { ...ownPosition.value } : null)
      labelRequest++
      centerLabel.value = readPref('centerLabel', '')
      drawCircle()
      drawCentre()
      restoreView()
      updateCentreCover()
      runSearch()
    }

    /**
     * Whether the search draws the shown person itself -- as a glowing match or a grey ring. Then
     * the gold ring stands around that mark; where the search does not reach them (they may live
     * anywhere), the ring carries a point of its own in its middle, so it never stands around
     * nothing. Said to the stylesheet through a class on the shell, not by drawing the marker anew:
     * the search answers after the person does, and a marker drawn twice would land twice.
     */
    const shownIsDrawn = computed(() => {
      const person = shown.value
      if (!person) {
        return false
      }
      const same = (other: Named) => samePerson(person, other)
      return (
        visibleMatches.value.some(({ match }) => same(match)) || visiblePresence.value.some(same)
      )
    })

    // The list names the shown person once: first, under a heading of their own (MatchList), with
    // what the search knows of them where it found them -- and not a second time among the matches
    // or the others below. Whatever the boxes under the map let through: the member came for them.
    const listContact = computed(() => {
      const person = shown.value
      if (!person) {
        return null
      }
      const item = visibleMatches.value.find(({ match }) => samePerson(person, match)) ?? null
      return { person, item }
    })
    const listMatches = computed(() =>
      shown.value
        ? sortedMatches.value.filter(({ match }) => !samePerson(shown.value, match))
        : sortedMatches.value,
    )
    const listPresence = computed(() =>
      shown.value
        ? sortedPresence.value.filter((other) => !samePerson(shown.value, other))
        : sortedPresence.value,
    )

    /** Whether two records name one person: the pair, however a server spells it. */
    function samePerson(one: Named, other: Named) {
      const lower = (value: unknown) => String(value ?? '').toLowerCase()
      return (
        !!one?.uuid &&
        lower(one.uuid) === lower(other?.uuid) &&
        lower(one.community?.uuid) === lower(other?.community?.uuid)
      )
    }

    /**
     * A tap on the ring or the name: their profile, in the one window (GMS-111). Where the search
     * found them as well, the window opens on what the search knows -- a match with the entries
     * that answer me, as a tap on their glow would.
     */
    function openShown() {
      const person = shown.value
      if (!person) {
        return
      }
      const same = (other: Named) => samePerson(person, other)
      openProfile(focusedMatches.value.find(same) ?? presence.value.find(same) ?? person)
    }

    // ⛔ The name is set as markup's TEXT (escapeHtml): the engine takes a marker's inside as HTML,
    // and the name was written by somebody else and comes back from the GMS. The ring is drawn in a
    // box that lets taps through; the centred core takes them, as on a coloured marker, and the
    // name does too.
    function shownHtml(name: string) {
      const label = name ? `<div class="gk-shown-name">${escapeHtml(name)}</div>` : ''
      return `<div class="gk-shown-ring"></div><div class="gk-shown-point"></div><div class="gk-hit" style="width:${HIT_MIN}px;height:${HIT_MIN}px"></div>${label}`
    }

    function drawShown() {
      if (shownLayer) {
        shownLayer.remove()
        shownLayer = null
      }
      if (!map || !shown.value) {
        return
      }
      const { position, name } = shown.value
      // Above the matches and the centre disc, under the house (500): a neighbour's ring stands
      // around one's own house, not over it.
      shownLayer = map.marker({
        lat: position.lat,
        lng: position.lng,
        className: 'gk-marker gk-clickable gk-shown',
        html: shownHtml(name),
        size: [SHOWN_RING, SHOWN_RING],
        anchor: [SHOWN_RING / 2, SHOWN_RING / 2],
        interactive: true,
        // A tab stop with a name, unlike the markers of the search: this is who the member came
        // for, and a keyboard on the map reaches them without going to the list first. (The list
        // names them too, first of all -- that is where a screen reader meets them.)
        focusable: true,
        ariaLabel: t('matching.profile.aria', { name }),
        zIndex: 450,
        onClick: openShown,
      })
    }

    // Asked on arrival, and again should the address come to name somebody else. By the pair, not
    // by the object: `askedPerson` is made anew with every navigation, and one that keeps the page
    // and the pair is no new question.
    watch(
      () =>
        askedPerson.value
          ? `${askedPerson.value.communityUuid}/${askedPerson.value.gradidoID}`
          : '',
      () => showAsked(),
      { immediate: true },
    )

    /**
     * Where one setting lives, or null where there is nobody to attribute it to.
     *
     * ⛔ The rule in one place, so both seams keep it: no member, no key. Gluing `null` to the
     * setting name would build `nullmode`, `nullcenter` -- and those are ordinary keys on an
     * origin the wallet SHARES with the admin, so they can be written and read by something
     * that is not this page. Reading one would hand an anonymous map somebody else's state;
     * writing one would litter the browser with settings nobody can attribute or ever clear.
     * Both are the flat prefix again, in a new costume.
     */
    function prefKey(key: string) {
      return prefPrefix ? prefPrefix + key : null
    }

    /** A stored choice, or `fallback`. Said as `unknown` where the reader checks the shape itself. */
    function readPref<T>(key: string, fallback: T): T {
      const storageKey = prefKey(key)
      if (!storageKey) {
        return fallback
      }
      try {
        const raw = window.localStorage?.getItem(storageKey)
        return raw ? JSON.parse(raw) : fallback
      } catch {
        // A stale or hand-edited value must not take the map down with it.
        return fallback
      }
    }

    function writePref(key: string, value: unknown) {
      const storageKey = prefKey(key)
      if (!storageKey) {
        return
      }
      try {
        window.localStorage?.setItem(storageKey, JSON.stringify(value))
      } catch {
        // Storage full or blocked: losing the preference beats losing the map.
      }
    }

    function readLook(): Look {
      const stored = readPref<unknown>('look', null)
      return (LOOKS as readonly unknown[]).includes(stored) ? (stored as Look) : 'dunkel'
    }

    function readSelection() {
      return sanitizeSelection(readPref<unknown>('query', null))
    }

    // Two radii, two keys, because each reach owns its own: switching the reach must not
    // drag the other circle along, and coming back must find the number one left there.
    // `radius` stays the REGIONAL key — renaming it would silently reset the circle of
    // every member who already set one.
    function readRadiusFor(which: Reach) {
      const wide = which === 'fern'
      const stored = readPref<unknown>(wide ? 'radiusFern' : 'radius', null)
      const fallback = wide ? DEFAULT_RADIUS_FERN : DEFAULT_RADIUS
      return typeof stored === 'number' &&
        Number.isFinite(stored) &&
        stored >= 1 &&
        stored <= MAX_RADIUS
        ? stored
        : fallback
    }

    // A standing preference like the mode, not a switch to flip each visit.
    function readReach(): Reach {
      return readPref<unknown>('reach', null) === 'fern' ? 'fern' : 'regional'
    }

    function readCenter() {
      const stored = readPref<unknown>('center', null)
      return isPlace(stored) ? stored : null
    }

    function setLook(next: Look) {
      look.value = next
      writePref('look', next)
    }

    function readMode(): 'karte' | 'liste' {
      return readPref<unknown>('mode', null) === 'liste' ? 'liste' : 'karte'
    }

    function readSort() {
      const stored = readPref<unknown>('sort', null)
      return typeof stored === 'string' && ['naehe', 'passung', 'breite'].includes(stored)
        ? stored
        : 'naehe'
    }

    // The travel lens: measure distances from the search point (default) or from home.
    function readLens() {
      const stored = readPref<unknown>('lens', null)
      return typeof stored === 'string' && ['suchpunkt', 'wohnort'].includes(stored)
        ? stored
        : 'suchpunkt'
    }

    function readBreite() {
      return readPref<unknown>('breite', false) === true
    }

    function readVisible() {
      const base: Record<FilterKey, boolean> = {
        interesse: true,
        angebot: true,
        gesuch: true,
        andereMit: true,
        andereOhne: true,
      }
      const stored = readPref<unknown>('filters', null)
      if (!stored || typeof stored !== 'object') {
        return base
      }
      const kept = stored as Partial<Record<FilterKey, unknown>>
      for (const key of Object.keys(base) as FilterKey[]) {
        if (typeof kept[key] === 'boolean') {
          base[key] = kept[key]
        }
      }
      return base
    }

    // A standing preference, not a switch to flip each visit: set 'liste' once and it
    // stays (the blind member sets it in the position flow; the sighted flip back and
    // forth). It rides in the same pref bag as look/radius/centre — no new mechanism.
    function setMode(next: 'karte' | 'liste') {
      mode.value = next
      writePref('mode', next)
    }

    // Switching the reach swaps the radius with it, so the circle jumps — and the jump is
    // the answer to "which reach am I in", given before anybody has to read a label. Same
    // three steps as applyRadius: redraw, frame, search.
    function setReach(next: Reach) {
      if (!REACHES.includes(next) || next === reach.value) {
        return
      }
      reach.value = next
      writePref('reach', next)
      drawCircle()
      // The rings are drawn imperatively and nothing watches the reach, so the layer has
      // to be told; the computed above has already emptied what it draws from.
      drawPresence()
      zoomToCircle({ fly: true })
      forgetViewOfOldCircle()
      runSearch()
    }

    // The radius and the reach are the member's own settings, also on a visit that shows somebody --
    // but the view that frames the new circle is the visit's, around the person, and is not written
    // down. The view written down would then be the one of the OLD circle: the next ordinary visit
    // would open on it with a circle that no longer fits. Forgotten instead, that visit frames the
    // member's own circle afresh (restoreView).
    function forgetViewOfOldCircle() {
      if (visitSearch) {
        writePref('view', null)
      }
    }

    function setSort(next: string) {
      if (!['naehe', 'passung', 'breite'].includes(next)) {
        return
      }
      sortMode.value = next
      writePref('sort', next)
    }

    function setLens(next: string) {
      if (!['suchpunkt', 'wohnort'].includes(next)) {
        return
      }
      lensMode.value = next
      writePref('lens', next)
    }

    // A look click leaves list mode: the three colours are the map's, and choosing one
    // is asking for the map back.
    function chooseLook(next: Look) {
      setLook(next)
      setMode('karte')
    }

    // Whoever came to see a contact on the map goes back into the conversation with them: the
    // address the contacts page opens the window for (P4c), with the pair this page was asked with.
    function goBack() {
      const person = askedPerson.value
      if (person) {
        router.push({
          path: '/contacts',
          query: { with: person.gradidoID, community: person.communityUuid },
        })
        return
      }
      router.push('/matching/entries')
    }

    /**
     * A search the page asks of its own accord: its first one, when the member's home is known, and
     * the one the member's entries ask for when they arrive. Where somebody is still being asked
     * about, it waits for that answer -- the search will stand on them, or be asked as the member
     * left it (showAsked). Asked at once, it would search the member's own circle a moment before
     * the visit's, and the list would read out one place and then another.
     *
     * Not for a search the member asks for (a moved centre, a radius, a reach, a question): theirs
     * is asked at once, whatever is on its way.
     */
    function searchUnasked() {
      if (asking) {
        searchHeld = true
        return
      }
      runSearch()
    }

    /** The one place a search is actually asked for. */
    function runSearch() {
      if (!searchCenter.value) {
        return
      }
      // Whatever waited (searchUnasked) is asked with this one.
      searchHeld = false
      load({
        center: searchCenter.value,
        radius: radius.value,
        query: searchQuery.value,
        mineUuids: myEntries.value.map((entry) => entry.uuid),
        remoteOnly: reach.value === 'fern',
      })
    }

    function moveSearchTo(next: Place, { fly = false }: { fly?: boolean } = {}) {
      // Refused where the centre is born, not where it is stored. A centre that is not two
      // numbers is not a place: guarding only the write would leave the live centre poisoned
      // while storage kept the old one, so drawCircle and drawCentre would run on `undefined`
      // (MapLibre: "Invalid LngLat object"), the label would be looked up for nothing,
      // and the two would disagree until the next reload. Both search fields hand their pick
      // straight from an address service, unchecked -- this is where it is checked.
      if (!isPlace(next)) {
        return
      }
      // The member's own search from here on, written down with the view of it -- also where the
      // page had put the search on somebody it was asked to show, or is about to (showAsked).
      visitSearch = false
      visitFramePending = false
      if (asking) {
        movedWhileAsking = true
      }
      inClusterZoom = false
      closeCluster()
      searchCenter.value = { lat: next.lat, lng: next.lng }
      // JSON drops `undefined`, so an unguarded centre would land in the store as `{}` and
      // read back like a place somebody chose -- the fingerprint this fault left behind. Both
      // writers of the centre are guarded above, so nothing has to be healed later.
      writePref('center', searchCenter.value)
      drawCircle()
      drawCentre()
      // Move the view to the new centre too: nothing else does it now that the map's own
      // field is ours as well, and a search from the list has no map to move at all —
      // without this the map would still sit on the old place when you switch back to it.
      // What the view frames is the circle, whatever its radius; the old control's fixed
      // zoom 18 landed on a rooftop and left the circle off the screen. The home button
      // asks to fly there.
      zoomToCircle({ fly })
      runSearch()
      resolveCenterLabel(next)
    }

    /** Keep the centre's own name for the list's line - '' where it has none. */
    function setCenterLabel(label: string) {
      centerLabel.value = label || ''
      writePref('centerLabel', centerLabel.value)
    }

    let labelRequest = 0

    /**
     * Name the centre for the list's confirmation line (K-002). Three cases:
     * - a typed search carries its name;
     * - the member's home needs none: the list calls it their home (centerLabelShown), so
     *   nothing is asked - the home button lands here. A crosshair does only within HOME_KM of
     *   the house, and at the zoom that frames the circle that is about one pixel, so a crosshair
     *   set on the house by eye is usually looked up like any other point;
     * - any other point set on the map is named from the map's own tile file
     *   (utils/reverseGeocode), and nobody else is asked.
     * The member's own search point, written down with its name. The centre of a visit that shows
     * somebody is named by nameVisitCentre, and not written down.
     */
    async function resolveCenterLabel(next: Place) {
      // Every new centre makes an older lookup stale, the two cases that ask nothing included.
      // Counted before them: a lookup still out for the point before would otherwise answer
      // after them and name a place the search has already left.
      const mine = ++labelRequest
      if (next.label) {
        setCenterLabel(next.label)
        return
      }
      if (isHomePoint(next)) {
        setCenterLabel('')
        return
      }
      // "The chosen point" while the lookup is out: the previous centre's name must not stand for
      // this one meanwhile, nor stay stored with it when the page is left before the answer.
      setCenterLabel('')
      const label = await reverseName(next.lat, next.lng, locale.value)
      if (mine === labelRequest) {
        setCenterLabel(label)
      }
    }

    /**
     * Name the centre of a visit's search (searchAroundShown): the place the shown person's
     * published point lies in, as for any point set on the map. A blind member asks the list where
     * their contact is, and a line that answers "around Margret" does not say (Bernd, 10.10.2026).
     *
     * Read from the map's own tile file, the one this very area is drawn from, and nobody else is
     * asked. Until then no name was looked up for anybody else's position -- a rule from the days
     * when the lookup asked a service outside (K-002), kept after its reason had gone.
     *
     * For the visit only and not written down, like the centre it names. Until the place is read the
     * line names nothing (centerLabelShown); where no place is near, or the file cannot be read, it
     * names the person.
     */
    async function nameVisitCentre(position: Point, name: string) {
      // Counted like every new centre (resolveCenterLabel): a lookup still out for the centre before
      // must not name this one, nor this one the centre that comes after it.
      const mine = ++labelRequest
      centerLabel.value = ''
      const place = await reverseName(position.lat, position.lng, locale.value)
      if (mine === labelRequest) {
        centerLabel.value = place || name
      }
    }

    /** The crosshair: make the map's centre the search's centre, and look there. */
    function searchHere() {
      if (!map) {
        return
      }
      moveSearchTo(map.getCenter())
    }

    // What BFormInput hands out, as far as the page reads it (measured: it exposes blur, element,
    // focus).
    const radiusInput = ref<{ element?: HTMLInputElement | null } | null>(null)

    /**
     * Open with the number selected, so the first keystroke replaces it instead of
     * appending to it - today it has to be deleted by hand.
     *
     * On `shown` rather than with the `autofocus` prop: `shown` fires on every opening and
     * after the transition, which is the first moment the field can take focus, and
     * `select()` focuses as well as selects - one mechanism instead of two that have to
     * agree. `element` is what BFormInput hands out (measured: it exposes blur, element,
     * focus); the optional chain is for the test, where the component is not resolved.
     */
    function selectRadius() {
      radiusInput.value?.element?.select()
    }

    /** Which circle the dialog is setting, and what the other one keeps. */
    const radiusHint = computed(() =>
      reach.value === 'fern'
        ? t('matching.map.radiusHintFern', { km: radiusRegional.value })
        : t('matching.map.radiusHintRegional', { km: radiusFern.value }),
    )

    function openRadius() {
      radiusDraft.value = radius.value
      radiusModal.value = true
    }

    const radiusValid = computed(() => {
      const draft = radiusDraft.value
      return (
        typeof draft === 'number' && Number.isFinite(draft) && draft >= 1 && draft <= MAX_RADIUS
      )
    })

    /** Enter does what the save button does, including closing up behind itself. */
    function submitRadius() {
      if (!radiusValid.value) {
        return
      }
      radiusModal.value = false
      applyRadius()
    }

    function applyRadius() {
      if (!radiusValid.value) {
        return
      }
      const next = Math.round(radiusDraft.value as number)
      // Into the key of the reach that is standing. Setting the wide circle must leave the
      // regional one where it was, and the other way round.
      if (reach.value === 'fern') {
        radiusFern.value = next
        writePref('radiusFern', next)
      } else {
        radiusRegional.value = next
        writePref('radius', next)
      }
      drawCircle()
      // Frame the new circle: a radius you cannot see is a number without an answer.
      zoomToCircle()
      forgetViewOfOldCircle()
      runSearch()
    }

    function rgb(channels: number[]) {
      return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`
    }

    function swatchStyle(channel: FilterKey): CSSProperties {
      // The grey rings on the map are filled when a person has entries and hollow when
      // not, so the legend echoes that: a filled disc for "others with entries", a bare
      // ring for "without".
      if (channel === 'andereMit') {
        return { background: 'rgb(150, 154, 162)', border: '2px solid rgb(116, 121, 131)' }
      }
      if (channel === 'andereOhne') {
        return { border: '2px solid rgb(116, 121, 131)' }
      }
      // The legend swatch wears the entry colour (the input's danger/success/info),
      // not the glow's additive primary — so the three stay apart for red-green
      // colour vision. The glowing markers keep CANON; only these labels change.
      return { background: LABEL_COLORS[channel] }
    }

    // The glow is a wide, soft light, but its box would take a click across its whole
    // span — so a bright neighbour, stacked on top, could steal a tap meant for the
    // crowd beneath it. The box is therefore made click-through (the pointer-events rule
    // at the end of the style block), and only a centred core takes the tap: at least
    // HIT_MIN across (displayCore, the floor a finger needs, F-10), and never smaller than
    // the disc of the same step. The disc looks carry the same core, so all three looks
    // share one tap footprint.
    function glowHtml(colour: number[], size: number, share: number, hit: number) {
      const core = (share * 0.9).toFixed(2)
      const tint = `${colour[0]}, ${colour[1]}, ${colour[2]}`
      return `<div class="gk-glow" style="width:${size}px;height:${size}px;background:
        radial-gradient(circle closest-side, rgba(255,255,255,${core}) 0%, rgba(255,255,255,0) 20%),
        radial-gradient(circle closest-side, rgba(${tint},1) 0%, rgba(${tint},.5) 32%, rgba(${tint},0) 68%)"></div><div class="gk-hit" style="width:${hit}px;height:${hit}px"></div>`
    }

    // The disc shows the step and takes no tap; the invisible core over it does, as on the
    // glow above.
    function discHtml(colour: number[], size: number, hit: number) {
      return `<div class="gk-disc" style="width:${size}px;height:${size}px;background:${rgb(colour)}"></div><div class="gk-hit" style="width:${hit}px;height:${hit}px"></div>`
    }

    function drawMatches() {
      if (!map) {
        return
      }
      if (matchLayer) {
        matchLayer.remove()
      }
      matchLayer = map.group()

      const glowing = look.value === 'dunkel'
      for (const { match, stages, peak } of visibleMatches.value) {
        const colour = markerColor(stages, DEFAULTS)
        const hit = hitSizeOf(DISC_SIZE[peak])
        // On the dark map the box is the glow and the tap area sits in its middle; on the
        // two light ones the box is the tap area and the disc sits in its middle.
        const size = glowing ? GLOW_SIZE[peak] : hit
        const html = glowing
          ? glowHtml(colour, size, DEFAULTS.stageBright[peak - 1], hit)
          : discHtml(colour, DISC_SIZE[peak], hit)

        // A coloured marker is a match: a tap opens their profile, or resolves a crowd
        // first (handleMatchClick). The grey rings open the same window (drawPresence).
        matchLayer.marker({
          lat: match.position.lat,
          lng: match.position.lng,
          className: 'gk-marker gk-clickable',
          html,
          size: [size, size],
          anchor: [size / 2, size / 2],
          interactive: true,
          focusable: false,
          onClick: () => handleMatchClick(match),
        })
      }
    }

    // Counts the profiles asked for, so that a slow answer for somebody the member has
    // already left cannot land in the window of the next person (or of nobody).
    let profileRequest = 0

    /**
     * Open the window on a person - a match, a grey ring or a silent line of the list: one
     * window for all of them (GMS-111).
     *
     * It opens at once with what the map knows - a match with the entries that answer me,
     * each entry of theirs once however many of mine it answers (forWindow), a ring with a
     * name and a community - and then fills in everything the person published from the
     * profile route, the matched entries keeping their strength (withProfile). If the route
     * does not answer, the window stays as it opened and a toast says the rest could not
     * be loaded.
     */
    function openProfile(person: Person) {
      activeMatch.value = forWindow(person)
      profileOpen.value = true
      writePref('profile', person.uuid)
      fillProfile(person)
    }

    async function fillProfile(person: Person) {
      const request = ++profileRequest
      // A ring from a GMS that does not name its rings yet: there is nobody to ask about.
      if (!person.uuid || !person.community?.uuid) {
        return
      }
      try {
        const published = await loadProfile(person.uuid, person.community.uuid)
        if (request !== profileRequest || !profileOpen.value) {
          return
        }
        activeMatch.value = withProfile(person, published)
      } catch {
        if (request !== profileRequest) {
          return
        }
        toastError(t('matching.profile.unavailable'))
      }
    }

    /** The window's v-model. A close by the member forgets the person for good. */
    function onProfileModel(open: boolean) {
      profileOpen.value = open
      if (!open) {
        // An answer still on its way is for a window that is gone.
        profileRequest++
        activeMatch.value = null
        writePref('profile', null)
      }
    }

    /**
     * Restore the open profile after the map is rebuilt.
     *
     * The window can only be left open in two ways — tapping a send button (off to
     * the send form) or an auto-logout — because any touch of the map dismisses the
     * modal first (its backdrop), which forgets the note. So the whole job is: on a
     * fresh mount, if the remembered person is in the first search, reopen them.
     * There is deliberately nothing here that reopens a profile unbidden: to search
     * elsewhere you must dismiss the window, and that has already cleared the note.
     */
    function syncProfile() {
      const savedUuid = readPref<string | null>('profile', null)
      if (!savedUuid) {
        return
      }
      // A match or a ring: the window was left open on one of them (GMS-111), and both are
      // opened again the same way, the profile route asked once more.
      const found =
        matches.value.find((entry) => entry.uuid === savedUuid) ??
        presence.value.find((person) => person.uuid === savedUuid)
      if (found) {
        openProfile(found)
      }
    }

    function drawPresence() {
      if (!map) {
        return
      }

      // Thousands of rings would choke the DOM, so the engine draws these on a canvas. The
      // handful of matches above stay markers — they are few and they carry real CSS.
      //
      // A ring opens the same window as a match (GMS-111), with the markers' tap area
      // (RING_TOLERANCE). Two rings under one finger: whichever the engine finds opens - no
      // crowd zoom for rings, on purpose; they are many and they are silent.
      const dark = look.value === 'dunkel'
      const stroke = dark ? 'rgb(116, 121, 131)' : 'rgb(95, 99, 107)'
      const fill = dark ? 'rgb(80, 84, 94)' : 'rgb(150, 154, 162)'
      map.setPresence(
        visiblePresence.value.map((person) => ({
          lat: person.position.lat,
          lng: person.position.lng,
          filled: person.hasEntries,
          // Only somebody the GMS names can be asked about; an older GMS names nobody, and
          // a ring with nothing to open takes no tap either.
          onClick: person.uuid && person.community?.uuid ? () => openProfile(person) : null,
        })),
        {
          radius: RING_RADIUS,
          weight: RING_WEIGHT,
          stroke,
          fill,
          tolerance: RING_TOLERANCE,
        },
      )
    }

    function drawCircle() {
      if (!map || !searchCenter.value) {
        return
      }

      const metres = radius.value * 1000
      // A circle wide enough to swallow a pole has no outside left to dim, and its
      // ring wraps the globe instead of closing — a mask there would draw nonsense.
      // At that size the count in the heading is the whole answer anyway; the circle
      // was never the point of a search across half the world.
      const toPole = (90 - Math.abs(searchCenter.value.lat)) * 111320
      if (metres >= toPole) {
        map.setCircle(null)
        return
      }

      map.setCircle(searchCenter.value, metres, MASK[look.value])
    }

    function zoomToCircle({ fly = false }: { fly?: boolean } = {}) {
      if (!map || !searchCenter.value) {
        return
      }
      const metres = radius.value * 1000
      if (!fly) {
        map.fitRadius(searchCenter.value, metres)
        return
      }
      // The way home flies in a smooth arc; every other reframe is an instant fit. Over a
      // long distance the map's own timing turns theatrical, so cap it there — coming home
      // stays brisk however far you had wandered, while a short hop keeps its easy pace.
      const km = distanceKm(map.getCenter(), searchCenter.value)
      map.fitRadius(searchCenter.value, metres, {
        fly: true,
        duration: km > 300 ? 1.5 : undefined,
      })
    }

    // Home again: put the search itself back on your own place — the same as clicking
    // the crosshair there. moveSearchTo centres the map on home and sets the search
    // centre to it, so the crosshair comes to rest on the disc and the matches gather
    // round home, exactly as on first open.
    function recenterHome() {
      if (!map || !ownPosition.value) {
        return
      }
      moveSearchTo({ lat: ownPosition.value.lat, lng: ownPosition.value.lng }, { fly: true })
    }

    function drawOwn() {
      if (!map || !ownPosition.value) {
        return
      }
      if (ownLayer) {
        ownLayer.remove()
      }
      // Your home: the heart-house in gold. The crown moved on — this marks a place you
      // live, not a badge — and it needs no label; the house speaks for itself. The same
      // marker stands on the settings map, so "home" reads the same in both places.
      const html = `<div class="gk-own">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <g fill="#c69130"><path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207L1.354 8.853a.5.5 0 1 1-.708-.707z"/><path d="m14 9.293l-6-6l-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018c-5.825-3.764-1.664-6.691 0-5.018"/></g>
          </svg>
        </div>`
      ownLayer = map.marker({
        lat: ownPosition.value.lat,
        lng: ownPosition.value.lng,
        className: 'gk-marker',
        html,
        size: [34, 34],
        anchor: [17, 17.5],
        interactive: false,
        // It opens nothing, so it is no button and no tab stop: a keyboard would halt on it and a
        // screen reader would say "button" with no name. The way home is the button in the corner.
        focusable: false,
        zIndex: 500,
      })
    }

    function drawCentre() {
      if (centreLayer) {
        centreLayer.remove()
        centreLayer = null
      }
      if (!map || !searchCenter.value) {
        return
      }
      // A quiet disc under the house: it marks where the search is centred, so that when
      // the house wanders off — a search point away from home — the centre stays shown.
      centreLayer = map.marker({
        lat: searchCenter.value.lat,
        lng: searchCenter.value.lng,
        className: 'gk-marker',
        html: '<div class="gk-centre"></div>',
        size: [40, 40],
        anchor: [20, 20],
        interactive: false,
        // No button and no tab stop either, as the house is none.
        focusable: false,
        zIndex: 400,
      })
    }

    // The crosshair sets the centre; it says nothing about where the centre already is. So
    // when the map's middle sits on the search centre, the crosshair fades away — only the
    // disc is left — and it returns as the middle drifts off.
    function updateCentreCover() {
      if (!map || !searchCenter.value) {
        crosshairOpacity.value = 1
        return
      }
      // Zoomed into a cluster the middle sits on the crowd, not the search centre —
      // hide the crosshair so a tap cannot set the search there.
      if (inClusterZoom) {
        crosshairOpacity.value = 0
        return
      }
      const fade = (gap: number) =>
        Math.max(0, Math.min(1, (gap - COVER_TOL) / (COVER_FADE - COVER_TOL)))
      // The same over somebody the map was asked to show: resting on them, a tap on the middle is
      // a tap on their ring, and must not move the search there instead.
      crosshairOpacity.value = Math.min(
        fade(gapToMiddle(map, searchCenter.value)),
        shown.value ? fade(gapToMiddle(map, shown.value.position)) : 1,
      )
    }

    /** How far a place is from the middle of the view, in screen pixels. */
    function gapToMiddle(live: MapHandle, place: Point) {
      const here = live.project(place)
      const { width, height } = live.getSize()
      return Math.hypot(here.x - width / 2, here.y - height / 2)
    }

    // Coming to rest just off the centre eases the last pixels onto it, so it lands exact
    // at any zoom. The flag keeps the snap's own moveend from snapping again.
    function snapToCentre() {
      if (snapping || !map || !searchCenter.value) {
        return
      }
      if (gapToMiddle(map, searchCenter.value) < SNAP_TOL) {
        snapping = true
        map.panTo(searchCenter.value, { animate: true, duration: 0.25 })
      }
    }

    // A click on a coloured marker asks first: how many matches share this spot? One
    // opens straight to a profile; a crowd zooms in to spread them — or, when no zoom
    // can (identical coordinates), falls through to the cluster list.
    function handleMatchClick(match: MapMatch) {
      if (!map) {
        return
      }
      const live = map
      // The person the page shows is who the member came for, and the map frames the whole circle
      // around them: neighbours a few pixels away must not turn a tap on them into a zoom. Only
      // somebody on the very same point -- a shared address -- makes it a question (the list of that
      // spot, since no zoom separates them).
      const cameFor = Boolean(shown.value) && samePerson(shown.value, match)
      const here = live.project(match.position)
      const crowd = visibleMatches.value.filter(({ match: other }) => {
        if (cameFor) {
          return (
            other.position.lat === match.position.lat && other.position.lng === match.position.lng
          )
        }
        const point = live.project(other.position)
        return Math.hypot(here.x - point.x, here.y - point.y) <= CROWD_PX
      })
      if (crowd.length <= 1) {
        openProfile(match)
        return
      }
      if (canSeparate(live, crowd)) {
        zoomToCluster(live, crowd)
      } else {
        openClusterList(crowd)
      }
    }

    // A zoom separates them only if they sit on different coordinates and there is zoom
    // left to give; identical points (a shared address) never separate.
    function canSeparate(live: MapHandle, crowd: VisibleMatch[]) {
      if (live.getZoom() >= live.getMaxZoom()) {
        return false
      }
      const first = crowd[0].match.position
      return crowd.some(
        ({ match: other }) => other.position.lat !== first.lat || other.position.lng !== first.lng,
      )
    }

    // Centre on the crowd and step in, no prompt — a harmless, reversible look; the
    // search stays put and the crosshair hides while we are in here.
    function zoomToCluster(live: MapHandle, crowd: VisibleMatch[]) {
      const lat =
        crowd.reduce((sum, { match: other }) => sum + other.position.lat, 0) / crowd.length
      const lng =
        crowd.reduce((sum, { match: other }) => sum + other.position.lng, 0) / crowd.length
      inClusterZoom = true
      clusterZoomBase = live.getZoom()
      live.setView({ lat, lng }, Math.min(clusterZoomBase + 2, live.getMaxZoom()), {
        animate: true,
      })
    }

    // The list of a spot no zoom can open: the crowd, sorted by fit (distance says
    // nothing when everyone is on one point).
    function openClusterList(crowd: VisibleMatch[]) {
      activeCluster.value = [...crowd].sort(
        (a, b) => topScore(b.match, visible) - topScore(a.match, visible),
      )
      clusterOpen.value = true
      writePref(
        'cluster',
        activeCluster.value.map((item) => item.match.uuid),
      )
    }

    function closeCluster() {
      clusterOpen.value = false
      activeCluster.value = []
      writePref('cluster', null)
    }

    // Restore the cluster overlay after a rebuild, the way syncProfile restores the
    // window: its members were saved by uuid, so rebuild them from the fresh matches.
    // This keeps the list under a profile that also came back — the stack survives a
    // trip to the send form.
    function syncCluster() {
      const savedUuids = readPref<string[] | null>('cluster', null)
      if (!savedUuids || !savedUuids.length) {
        return
      }
      const restored = savedUuids
        .map((uuid) => visibleMatches.value.find((item) => item.match.uuid === uuid))
        .filter((item) => item !== undefined)
      if (restored.length) {
        activeCluster.value = restored
        clusterOpen.value = true
      }
    }

    function saveView() {
      // Not the view of a search this page put on somebody it was asked to show: the next visit
      // opens where the member last looked for themselves (see `visitSearch`).
      if (!map || visitSearch) {
        return
      }
      const centre = map.getCenter()
      writePref('view', { lat: centre.lat, lng: centre.lng, zoom: map.getZoom() })
    }

    /**
     * Where the map opens.
     *
     * Remembered, if we have been here before — that is what makes the round trip to
     * the send form survive, and what brings you back to Berlin after an auto-logout
     * you never asked for. Otherwise the circle decides: no fixed zoom can, because
     * at 12 a 25 km circle is 2000 px across and you would sit inside it without ever
     * seeing its edge.
     */
    function restoreView() {
      if (!map) {
        return
      }
      // A visit that shows somebody opens on the circle of the search around them, not where the
      // map stood last time. Framed once (frameVisit); after that the view is left alone here,
      // wherever the member has taken it.
      if (visitSearch) {
        frameVisit()
        return
      }
      const saved = readPref<View | null>('view', null)
      if (
        saved &&
        Number.isFinite(saved.lat) &&
        Number.isFinite(saved.lng) &&
        Number.isFinite(saved.zoom)
      ) {
        map.setView({ lat: saved.lat, lng: saved.lng }, saved.zoom)
        return
      }
      zoomToCircle()
    }

    /**
     * A way home under the search lens: a gold heart-house button that frames your own place
     * again, wherever you have panned. The page builds it, the engine hangs it in the corner
     * and gives it the button chrome the zoom buttons wear (dark on the dark map).
     */
    function homeButton() {
      const bar = document.createElement('div')
      bar.className = 'gk-home'
      const link = document.createElement('a')
      link.href = '#'
      link.setAttribute('role', 'button')
      link.title = t('matching.map.home')
      link.setAttribute('aria-label', t('matching.map.home'))
      link.innerHTML =
        '<svg viewBox="0 0 16 16" aria-hidden="true"><g fill="#c69130"><path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207L1.354 8.853a.5.5 0 1 1-.708-.707z"/><path d="m14 9.293l-6-6l-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018c-5.825-3.764-1.664-6.691 0-5.018"/></g></svg>'
      link.addEventListener('click', (event) => {
        // The href is there so the button can be reached by keyboard; following it would
        // put a bare # in the address bar and nothing else.
        event.preventDefault()
        recenterHome()
      })
      bar.appendChild(link)
      return bar
    }

    /**
     * Build the map once its engine has arrived. The engine is loaded rather than imported
     * (utils/mapEngine says why), so the map comes a moment after the quarter second.
     */
    function initMap() {
      if (!mapContainer.value || map) {
        return
      }
      loadMapEngine().then(
        (engine) => buildMap(engine.createMap),
        () => {
          // The engine did not arrive - a dropped connection, or a deploy since the page was loaded
          // renamed its file. There is no map then; the list shows the same matches.
        },
      )
    }

    function buildMap(createMap: Engine['createMap']) {
      // The page may have been left while the engine was on its way.
      if (!mapContainer.value) {
        return
      }
      const options = {
        center: { lat: 0, lng: 0 },
        zoom: BOOTSTRAP_ZOOM,
        maxZoom: 19,
        look: look.value,
        locale: locale.value,
      }
      const built = createMap(mapContainer.value, options)
      // MapLibre needs WebGL 2 and leaves the container as it found it where the device has none
      // (K-013). The page stays as it is: the shell, the crosshair and the whole list beside it keep
      // working, every draw below asks for `map` first, and a line under the map says why.
      if (!built.success) {
        noWebgl.value = true
        return
      }
      // `success` does not narrow the engine's result: it is written in JavaScript.
      const live = built.value as MapHandle
      map = live

      // The corner reads zoom buttons, then the search lens, then the way home - the order it
      // has always read in. Both of the page's own elements are handed over the same way; the
      // engine keeps taps and wheel turns inside them.
      live.addZoomControl('topleft')
      live.addControl(searchHost.value, 'topleft')
      live.addControl(homeButton(), 'topleft', { bar: true })

      // Remembering where you looked is what lets you leave and come back to it. And the
      // crosshair answers the middle: it fades as the middle nears the centre, and a rest
      // close by eases exactly onto it.
      live.on('move', updateCentreCover)
      live.on('moveend', () => {
        saveView()
        // Zooming back out to where the cluster dive began ends the dive.
        if (inClusterZoom && live.getZoom() <= clusterZoomBase) {
          inClusterZoom = false
        }
        updateCentreCover()
        if (snapping) {
          snapping = false
          return
        }
        if (!inClusterZoom) {
          snapToCentre()
        }
      })

      drawOwn()
      drawCircle()
      // Before the view: where the map opens depends on whether there is somebody to show.
      drawShown()
      restoreView()
      redraw()
      updateCentreCover()
    }

    function redraw() {
      drawCircle()
      drawCentre()
      drawPresence()
      drawMatches()
    }

    function handleResize() {
      if (map) {
        map.resize()
      }
    }

    onMounted(() => {
      // Findability off means there is nothing of mine to place, and it also switches
      // the location query below off — so that query's own "no pin yet" redirect can
      // never fire. Without this the address, a bookmark or the back button would open
      // a map centred on nothing, with no home, no circle and no matches. The position
      // tab is where both answers are given, so both roads lead there.
      if (!enabled.value) {
        router.replace('/matching/position')
        return
      }
      // The map needs its container to have a size before it measures itself.
      initTimer = setTimeout(initMap, 250)
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      // Tidiness, not a fix: initMap already returns when mapContainer.value is empty,
      // and Vue empties it on unmount, so a timer left running finds nothing to do.
      // This just spares the wakeup and lets the closure go a quarter second earlier.
      clearTimeout(initTimer ?? undefined)
      // Nobody is left to show the words to, and an answer still on its way finds no page.
      pageAlive = false
      clearTimeout(wordsTimer ?? undefined)
      wordsTimer = null
      clearTimeout(wordsSearchTimer ?? undefined)
      wordsSearchTimer = null
      // An answer about somebody to show that is still on its way is for a page that is gone.
      shownRequest++
      if (map) {
        map.remove()
      }
      map = null
      window.removeEventListener('resize', handleResize)
    })

    watch([matches, presence], redraw, { deep: true })
    // Restoring what was open last time belongs to arriving, not to every later
    // search: these read a saved uuid and reopen it wherever it turns up, so a match
    // that happens to appear in a new result set would swing the profile open unbidden -
    // which is exactly what syncProfile's own note says must not happen. One shot, on
    // the first results that actually carry something.
    let restoreDone = false
    // Called by a search the page asks later of its own accord (the words of an entry arrived):
    // from then on nothing is restored -- a window popping up minutes into a visit is what the note
    // above rules out.
    function arrivalOver() {
      restoreDone = true
    }
    // Matches or rings: the window may have been left open on either, and a search can
    // bring rings and no match at all.
    watch([matches, presence], () => {
      if (restoreDone || (!matches.value.length && !presence.value.length)) {
        return
      }
      restoreDone = true
      // A visit that came to show somebody opens no window of its own accord: the member asked for
      // the map with the person marked, and a window remembered from another visit would stand
      // over exactly that.
      if (askedPerson.value) {
        return
      }
      syncProfile()
      syncCluster()
    })
    watch(breite, drawMatches)
    watch(breite, (value) => writePref('breite', value))
    watch(visible, redraw, { deep: true })
    watch(visible, () => writePref('filters', { ...visible }), { deep: true })
    watch(look, () => {
      // A look is a style of its own: MapLibre paints its own tiles (utils/mapStyle).
      if (map) {
        map.setLook(look.value)
      }
      redraw()
    })
    // Coming back to the map: it kept its size under the cover, but a resize tick
    // re-lays its panes cleanly once the list lifts off.
    watch(mode, (value) => {
      if (value === 'karte' && map) {
        nextTick(() => map && map.resize())
      }
    })

    expose({ radiusDraft, radiusInput })

    const checkbox = (channel: FilterKey) => (
      <label key={channel} class={['map-check', classes['map-check']]}>
        <input v-model={visible[channel]} type='checkbox' />
        <span class={['box', classes.box]} />
        <span class={['swatch', classes.swatch]} style={swatchStyle(channel)} />
        {` ${t(`matching.map.channels.${channel}`)}`}
      </label>
    )

    return () => (
      /* No mt--3 here, unlike the other pages: that negative margin exists to pull
         content up under the content header, and this route hides it — so it would
         only glue the page to the top edge. */
      <div class={['matching-map-page', classes['matching-map-page']]}>
        {/* No heading row. It named the page a second time (the menu already says
            Matching) and cost the desktop the height the map wants, while the phone
            never had it. The way back opens the search line on both, so the two now
            differ only in width. */}
        <div class={['map-frame', classes['map-frame'], 'mx-lg-5']}>
          {/* One place for one question — "what am I looking for right now?" — and it
              sits here, above the frame, in BOTH modes. Were it inside the map in one
              mode and inside the list in the other, it would move under the member
              every time they switch. The WHERE stays a map tool (the lens and the home
              button on the canvas); this is the WHAT, and it says so in words.

              The way out opens the same line, in every view - the three looks and the
              list. On the map it had to push the map's own controls down; here it costs
              the map nothing, and it stands on the page, so it takes the page's colour
              rather than the map's (Bernd, 11.09.2026). */}
          <div class={['query-row', classes['query-row']]}>
            <button
              type='button'
              class={['map-back', classes['map-back']]}
              aria-label={t('matching.map.back')}
              onClick={goBack}
            >
              <BiArrowLeft />
            </button>
            <MatchQuery
              class={['query-field', classes['query-field']]}
              entries={myEntries.value}
              selection={selection.value}
              suggest={suggest}
              onUpdate:selection={onSelection}
            />
          </div>

          <div
            class={[
              'map-shell',
              classes['map-shell'],
              'gradido-border-radius',
              'app-box-shadow',
              stateClass(`look-${look.value}`),
              mode.value === 'liste' ? stateClass('is-list') : '',
              clusterOpen.value ? stateClass('is-cluster') : '',
              shownIsDrawn.value ? 'shown-is-drawn' : '',
            ]}
          >
            {/* In list mode the map is only decoration behind the list, but it stays in
                the DOM (so the map keeps its size). inert drops the whole map — its
                focusable container, its controls, its markers — out of the screen reader
                and the keyboard, so a blind member meets the list, not the map's leftovers. */}
            <div
              ref={mapContainer}
              class={['map-canvas', classes['map-canvas']]}
              inert={mode.value === 'liste'}
            />

            {/* The address search. It is the page's own element, and initMap hangs it on the
                map as a control, between the zoom buttons and the way home — so it keeps the
                corner it has always had, and the rules that hide the map's controls under the
                list and the cluster hide it too. Until the map takes it, it is still standing
                in the page flow here and the stylesheet keeps it out of sight. */}
            <div ref={searchHost} class={['gk-search', classes['gk-search']]}>
              <GeoSearchField
                id='matching-map-search'
                collapsible
                provider={geoProvider}
                label={t('matching.map.search')}
                onPick={moveSearchTo}
              />
            </div>

            {/* The same search, read as a line instead of lit as a field. It covers
                the map rather than unmounting it, so the map keeps its size and the
                way back is instant. */}
            {mode.value === 'liste' ? (
              <MatchList
                class={['list-cover', classes['list-cover']]}
                matches={listMatches.value}
                silent={listPresence.value}
                contact={listContact.value}
                home={ownPosition.value}
                center={lensOrigin.value}
                searchCenter={searchCenter.value}
                centerLabel={centerLabelShown.value}
                myPrecision={originPrecision.value}
                reach={reach.value}
                radiusKm={radius.value}
                sortMode={sortMode.value}
                lensMode={lensMode.value}
                showLens={showLens.value}
                onOpen={openProfile}
                onOpenContact={openShown}
                onSort={setSort}
                onLens={setLens}
                onRecenter={moveSearchTo}
              />
            ) : null}

            {/* The people of one spot no zoom could open — a slim, half-see-through
                overlay over the map, wiped away with its close cross. A row opens the
                profile, stacked above it. */}
            {clusterOpen.value ? (
              <MatchCluster
                people={activeCluster.value}
                onOpen={openProfile}
                onClose={closeCluster}
              />
            ) : null}

            {/* The crosshair marks the map's centre, and the centre is what the next
                search will use. Hollow and half-transparent on purpose: on the first
                open it sits exactly on your own house, and it has to let it through
                rather than shove it aside — the house marks a real place. */}
            <button
              v-show={mode.value === 'karte'}
              type='button'
              class={['map-crosshair', classes['map-crosshair']]}
              style={crosshairStyle.value}
              aria-label={t('matching.map.searchHere')}
              title={t('matching.map.searchHere')}
              onClick={searchHere}
            >
              <svg viewBox='0 0 24 24' width='40' height='40' aria-hidden='true'>
                <path
                  fill='none'
                  stroke='currentColor'
                  stroke-width='1'
                  d='M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z'
                />
              </svg>
            </button>

            {/* Two axes, one control. Dark / normal / light is colour; list is a
                different kind — representation — so it sits past a divider, its own
                element (a screen reader hears the looks as one group, the list apart).
                In the list those looks mean nothing (it follows the wallet theme), so
                there the switch is only the way back — a single "Karte" on the right. */}
            <div class={['look-switch', classes['look-switch']]}>
              {mode.value === 'karte' ? (
                <>
                  <div
                    class={['look-group', classes['look-group']]}
                    role='group'
                    aria-label={t('matching.map.look.label')}
                  >
                    {LOOKS.map((option) => (
                      <button
                        key={option}
                        type='button'
                        class={[
                          'look-btn',
                          classes['look-btn'],
                          look.value === option ? stateClass('is-on') : '',
                        ]}
                        aria-pressed={look.value === option}
                        onClick={() => chooseLook(option)}
                      >
                        {t(`matching.map.look.${option}`)}
                      </button>
                    ))}
                  </div>
                  <span class={['look-divide', classes['look-divide']]} aria-hidden='true' />
                  <button
                    type='button'
                    class={['look-btn', classes['look-btn']]}
                    onClick={() => setMode('liste')}
                  >
                    {t('matching.map.look.liste')}
                  </button>
                </>
              ) : (
                <button
                  type='button'
                  class={['look-btn', classes['look-btn']]}
                  onClick={() => setMode('karte')}
                >
                  {t('matching.map.look.karte')}
                </button>
              )}
            </div>
          </div>

          {/* Where this device cannot draw the map (no WebGL 2, K-013). Under the map, not over
              it: it explains the empty map, and the list is the way out. */}
          {noWebgl.value ? (
            <p class='map-note small text-muted mt-2 mb-0'>{t('matching.map.noWebgl')}</p>
          ) : null}

          <div
            class={[
              'map-controls',
              classes['map-controls'],
              'bg-white app-box-shadow gradido-border-radius p-3 mt-3',
            ]}
          >
            <BRow>
              <BCol cols='12' md='7'>
                {/* The radius asks, the count answers — so they stand together. */}
                <div
                  class={[
                    'controls-heading',
                    classes['controls-heading'],
                    'radius-row',
                    classes['radius-row'],
                  ]}
                >
                  {/* How far the question travels. It stands in front of the radius
                      because it decides what the radius means: each reach owns its own
                      circle, so switching here moves the number beside it. */}
                  <div
                    class={['reach-switch', classes['reach-switch']]}
                    role='group'
                    aria-label={t('matching.map.reach.label')}
                  >
                    {REACHES.map((option) => (
                      <button
                        key={option}
                        type='button'
                        class={[
                          'reach-btn',
                          classes['reach-btn'],
                          reach.value === option ? stateClass('is-on') : '',
                        ]}
                        aria-pressed={reach.value === option}
                        onClick={() => setReach(option)}
                      >
                        {t(`matching.map.reach.${option}`)}
                      </button>
                    ))}
                  </div>
                  {/* Label, number and unit are one quantity, so they break as one. */}
                  <span class={['radius-group', classes['radius-group']]}>
                    <span>{t('matching.map.radius')}</span>
                    <button
                      type='button'
                      class={['radius-field', classes['radius-field']]}
                      onClick={openRadius}
                    >
                      {radius.value}
                    </button>
                    <span>{t('matching.map.km')}</span>
                  </span>
                  <span class={['radius-dot', classes['radius-dot']]} aria-hidden='true' />
                  <span>{t('matching.map.found', { n: foundCount.value })}</span>
                </div>
                <div class='d-flex flex-wrap gap-3'>
                  {/* All five boxes, always. They used to step back while a typed question
                      was being asked, on the grounds that such a question has only one
                      possible channel and a box ticked off weeks ago would empty it for no
                      visible reason. True as far as it goes - but a search narrowed to ONE
                      of my own entries is in exactly the same position and never got that
                      protection, so the rule was inconsistent with itself. A control that
                      comes and goes teaches nothing; one that is always there and always
                      means what it says can be learned once. */}
                  {FILTERS.map(checkbox)}
                  {/* The two grey buckets are the presence rings, and the wide search
                      draws none: a ring is the neighbour you could walk up to. They step
                      back rather than sit there dead - and rather than being unticked,
                      which would make the way back a chore nobody performs. */}
                  {reach.value === 'regional' ? OTHERS.map(checkbox) : null}
                </div>
                {/* Explanation, not instruction — the first thing to give up for room. */}
                {reach.value === 'fern' ? (
                  <div class='small text-muted mt-1 d-none d-lg-block'>
                    {t('matching.map.reach.fernHint')}
                  </div>
                ) : null}
              </BCol>
              {/* The amplifier is the map's reveal tool; in the list it becomes the
                  "who fits the most" sort, so it steps aside there. */}
              {mode.value === 'karte' ? (
                <BCol cols='12' md='5' class='mt-3 mt-md-0'>
                  <div class={['controls-heading', classes['controls-heading']]}>
                    {t('matching.map.amplifier')}
                  </div>
                  <label class={['map-check', classes['map-check']]}>
                    <input v-model={breite.value} type='checkbox' />
                    <span class={['box', classes.box]} />
                    {` ${t('matching.map.breite')}`}
                  </label>
                  {/* Explanation, not instruction — the first thing to give up for room. */}
                  <div class='small text-muted mt-1 ms-4 ps-1 d-none d-lg-block'>
                    {t('matching.map.breiteHint')}
                  </div>
                </BCol>
              ) : null}
            </BRow>
          </div>
        </div>

        {/* The offer to keep a typed search.
            It stands whether or not anything was found — and the empty case is the
            stronger one: nobody offers this today, so being findable for it is worth
            more, not less. Entering is a prepayment, which is why so few members do it;
            here the prepayment comes after the use.

            It rides the bottom of the SCREEN, not the bottom of the map. That is the
            one place that works on both devices, and the reason is the difference
            between them: on a phone the map is the scarce thing and the controls below
            it have room to spare, so the band may cover those and must not touch the
            map; on a desktop the map holds its height and it is the controls that are
            already past the lower edge. Pinned to the map it would take the phone's map;
            pinned to the screen it lands on the spare room of both.

            It slides up rather than appearing: something that arrives unbidden is
            noticed by its movement, not by its presence.

            It sits outside the map frame in the markup as well, so no ancestor can turn
            itself into a containing block and clip a fixed child. */}
        {showKeepOffer.value ? (
          <div class={['keep-offer', classes['keep-offer']]} role='status' aria-live='polite'>
            <BiBell class={['keep-icon', classes['keep-icon']]} />
            {/* The question carries the words the member typed, so it can be any length;
                it is the one part that gives way, and it gives way by ellipsis rather than
                by wrapping - a second line is the thing this band is not allowed to have. */}
            <span class={['keep-ask', classes['keep-ask']]}>
              {t('matching.query.keepAsk', { text: searchQuery.value?.text })}
            </span>
            <BButton
              variant={'gradido' as ButtonVariant}
              size='sm'
              class={['keep-btn', classes['keep-btn']]}
              onClick={keepAsEntry}
            >
              {t('matching.query.keep')}
            </BButton>
            <button
              type='button'
              class={['keep-no', classes['keep-no']]}
              onClick={() => answerKeepOffer()}
            >
              {t('matching.query.keepNo')}
            </button>
            {/* Ticked, it is not an answer of its own: it says what the NEXT answer means.
                A box that dismissed for good the moment it was ticked would be a button
                wearing a checkbox, and an accidental one would be hard to undo. */}
            <label class={['keep-never', classes['keep-never']]}>
              <input v-model={keepNever.value} type='checkbox' />
              <span>{t('matching.query.keepNever')}</span>
            </label>
          </div>
        ) : null}

        {/* Closing this window is the brake: nothing is searched until you say so.
            That is what buys the map its freedom to be panned and zoomed for free. */}
        <BModal
          modelValue={radiusModal.value}
          title={
            reach.value === 'fern'
              ? t('matching.map.radiusTitleFern')
              : t('matching.map.radiusTitle')
          }
          okTitle={t('form.save')}
          okVariant={'gradido' as ButtonVariant}
          cancelTitle={t('form.cancel')}
          cancelVariant='secondary'
          okDisabled={!radiusValid.value}
          centered
          onUpdate:modelValue={(open: boolean) => {
            radiusModal.value = open
          }}
          onOk={applyRadius}
          onShown={selectRadius}
        >
          <label class='form-label' for='map-radius-input'>
            {t('matching.map.radiusLabel')}
          </label>
          <BFormInput
            id='map-radius-input'
            ref={radiusInput}
            modelValue={radiusDraft.value}
            // The library types the modifiers as all three at once.
            modelModifiers={{ number: true } as Record<'trim' | 'lazy' | 'number', true>}
            type='number'
            min='1'
            max={MAX_RADIUS}
            onUpdate:modelValue={(next) => {
              radiusDraft.value = next
            }}
            // A listener the field passes through to its <input>; not among its own props.
            {...{ onKeyup: withKeys(submitRadius, ['enter']) }}
          />
          {/* Which of the two circles this is, and where the other one stays. The dialog
              looks the same in both reaches, and a number typed into the wrong one is not
              noticed here - only later, when the map shows something nobody asked for. */}
          <div class='small text-muted mt-2'>{radiusHint.value}</div>
        </BModal>

        {/* The profile of whoever was clicked. One window: a person with no matches
            opens the same one, only with nothing standing open. It gets the member's own home and
            their standing reach as well: the first word it offers says how far apart the two live,
            measured from home whatever the map is searching, and only within that reach (E-068). */}
        <MatchProfile
          modelValue={profileOpen.value}
          match={windowMatch.value}
          ownPosition={ownPosition.value}
          ownReachKm={radiusRegional.value}
          onUpdate:modelValue={onProfileModel}
        />
      </div>
    )
  },
})
