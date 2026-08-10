<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- No mt--3 here, unlike the other pages: that negative margin exists to pull
       content up under the content header, and this route hides it — so it would
       only glue the page to the top edge. -->
  <div class="matching-map-page">
    <!-- No heading row. It named the page a second time (the menu already says
         Matching) and cost the desktop the height the map wants, while the phone
         never had it. The way back rides the map on both, so the two now differ
         only in width. -->
    <div class="map-frame mx-lg-5">
      <!-- One place for one question — "what am I looking for right now?" — and it
           sits here, above the frame, in BOTH modes. Were it inside the map in one
           mode and inside the list in the other, it would move under the member
           every time they switch. The WHERE stays a map tool (the lens and the home
           button on the canvas); this is the WHAT, and it says so in words. -->
      <MatchQuery :entries="myEntries" :selection="selection" @update:selection="onSelection" />

      <div
        class="map-shell gradido-border-radius app-box-shadow"
        :class="[`look-${look}`, { 'is-list': mode === 'liste', 'is-cluster': clusterOpen }]"
      >
        <!-- In list mode the map is only decoration behind the list, but it stays in
             the DOM (so Leaflet keeps its size). inert drops the whole map — its
             focusable container, its controls, its markers — out of the screen reader
             and the keyboard, so a blind member meets the list, not the map's leftovers. -->
        <div ref="mapContainer" class="map-canvas" :inert="mode === 'liste'" />

        <!-- The same search, read as a line instead of lit as a field. It covers
             the map rather than unmounting it, so Leaflet keeps its size and the
             way back is instant. -->
        <MatchList
          v-if="mode === 'liste'"
          class="list-cover"
          :matches="sortedMatches"
          :silent="sortedPresence"
          :center="lensOrigin"
          :center-label="centerLabel"
          :my-precision="MY_PRECISION"
          :sort-mode="sortMode"
          :lens-mode="lensMode"
          :show-lens="showLens"
          @open="openProfile"
          @sort="setSort"
          @lens="setLens"
          @recenter="moveSearchTo"
        />

        <!-- The people of one spot no zoom could open — a slim, half-see-through
             overlay over the map, wiped away with its close cross. A row opens the
             profile, stacked above it. -->
        <MatchCluster
          v-if="clusterOpen"
          :people="activeCluster"
          @open="openProfile"
          @close="closeCluster"
        />

        <!-- With the heading row gone this is the only way out on either device, so
             it sits on the map, where the eye already is. It stays in list mode too
             (a phone has no other way back), pinned over the scrolling list like the
             Karte switch. -->
        <button
          type="button"
          class="map-back"
          :aria-label="$t('matching.map.back')"
          @click="goBack"
        >
          <i-bi-arrow-left />
        </button>

        <!-- The crosshair marks the map's centre, and the centre is what the next
             search will use. Hollow and half-transparent on purpose: on the first
             open it sits exactly on your own house, and it has to let it through
             rather than shove it aside — the house marks a real place. -->
        <button
          v-show="mode === 'karte'"
          type="button"
          class="map-crosshair"
          :style="crosshairStyle"
          :aria-label="$t('matching.map.searchHere')"
          :title="$t('matching.map.searchHere')"
          @click="searchHere"
        >
          <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              d="M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z"
            />
          </svg>
        </button>

        <!-- Two axes, one control. Dark / normal / light is colour; list is a
             different kind — representation — so it sits past a divider, its own
             element (a screen reader hears the looks as one group, the list apart).
             In the list those looks mean nothing (it follows the wallet theme), so
             there the switch is only the way back — a single "Karte" on the right. -->
        <div class="look-switch">
          <template v-if="mode === 'karte'">
            <div class="look-group" role="group" :aria-label="$t('matching.map.look.label')">
              <button
                v-for="option in LOOKS"
                :key="option"
                type="button"
                class="look-btn"
                :class="{ 'is-on': look === option }"
                :aria-pressed="look === option"
                @click="chooseLook(option)"
              >
                {{ $t(`matching.map.look.${option}`) }}
              </button>
            </div>
            <span class="look-divide" aria-hidden="true" />
            <button type="button" class="look-btn" @click="setMode('liste')">
              {{ $t('matching.map.look.liste') }}
            </button>
          </template>
          <button v-else type="button" class="look-btn" @click="setMode('karte')">
            {{ $t('matching.map.look.karte') }}
          </button>
        </div>
      </div>

      <div class="map-controls bg-white app-box-shadow gradido-border-radius p-3 mt-3">
        <BRow>
          <BCol cols="12" md="7">
            <!-- The radius asks, the count answers — so they stand together. -->
            <div class="controls-heading radius-row">
              <span>{{ $t('matching.map.radius') }}</span>
              <button type="button" class="radius-field" @click="openRadius">{{ radius }}</button>
              <span>{{ $t('matching.map.km') }}</span>
              <span class="radius-dot" aria-hidden="true" />
              <span>{{ $t('matching.map.found', { n: foundCount }) }}</span>
            </div>
            <div class="d-flex flex-wrap gap-3">
              <!-- All five boxes, always. They used to step back while a typed question
                   was being asked, on the grounds that such a question has only one
                   possible channel and a box ticked off weeks ago would empty it for no
                   visible reason. True as far as it goes - but a search narrowed to ONE
                   of my own entries is in exactly the same position and never got that
                   protection, so the rule was inconsistent with itself. A control that
                   comes and goes teaches nothing; one that is always there and always
                   means what it says can be learned once. -->
              <label v-for="channel in FILTERS" :key="channel" class="map-check">
                <input v-model="visible[channel]" type="checkbox" />
                <span class="box" />
                <span class="swatch" :style="swatchStyle(channel)" />
                {{ $t(`matching.map.channels.${channel}`) }}
              </label>
              <label v-for="bucket in OTHERS" :key="bucket" class="map-check">
                <input v-model="visible[bucket]" type="checkbox" />
                <span class="box" />
                <span class="swatch" :style="swatchStyle(bucket)" />
                {{ $t(`matching.map.channels.${bucket}`) }}
              </label>
            </div>
          </BCol>
          <!-- The amplifier is the map's reveal tool; in the list it becomes the
               "who fits the most" sort, so it steps aside there. -->
          <BCol v-if="mode === 'karte'" cols="12" md="5" class="mt-3 mt-md-0">
            <div class="controls-heading">{{ $t('matching.map.amplifier') }}</div>
            <label class="map-check">
              <input v-model="breite" type="checkbox" />
              <span class="box" />
              {{ $t('matching.map.breite') }}
            </label>
            <!-- Explanation, not instruction — the first thing to give up for room. -->
            <div class="small text-muted mt-1 ms-4 ps-1 d-none d-lg-block">
              {{ $t('matching.map.breiteHint') }}
            </div>
          </BCol>
        </BRow>
      </div>
    </div>

    <!-- The offer to keep a typed search.
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
         itself into a containing block and clip a fixed child. -->
    <div v-if="searchQuery && !keepDismissed" class="keep-offer" role="status" aria-live="polite">
      <div class="keep-line">
        <i-bi-bell class="keep-icon" />
        <span class="keep-ask">
          {{ $t('matching.query.keepAsk', { text: searchQuery.text }) }}
        </span>
      </div>
      <div class="keep-actions">
        <BButton variant="gradido" size="sm" class="keep-btn" @click="keepAsEntry">
          {{ $t('matching.query.keep') }}
        </BButton>
        <button type="button" class="keep-no" @click="answerKeepOffer()">
          {{ $t('matching.query.keepNo') }}
        </button>
      </div>
    </div>

    <!-- Closing this window is the brake: nothing is searched until you say so.
         That is what buys the map its freedom to be panned and zoomed for free. -->
    <BModal
      v-model="radiusModal"
      :title="$t('matching.map.radiusTitle')"
      :ok-title="$t('form.save')"
      ok-variant="gradido"
      :cancel-title="$t('form.cancel')"
      cancel-variant="secondary"
      :ok-disabled="!radiusValid"
      centered
      @ok="applyRadius"
    >
      <label class="form-label" for="map-radius-input">{{ $t('matching.map.radiusLabel') }}</label>
      <BFormInput
        id="map-radius-input"
        v-model.number="radiusDraft"
        type="number"
        min="1"
        :max="MAX_RADIUS"
        @keyup.enter="submitRadius"
      />
    </BModal>

    <!-- The profile of whoever was clicked. One window: a person with no matches
         opens the same one, only with nothing standing open. -->
    <MatchProfile
      :model-value="profileOpen"
      :match="activeMatch"
      @update:model-value="onProfileModel"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-geosearch/dist/geosearch.css'
import { listMatchingEntries, userLocationQuery } from '@/graphql/queries'
import { useMatches, distanceKm } from '@/composables/useMatches'
import { useEntryDraft } from '@/composables/useEntryDraft'
import MatchQuery from '@/components/Matching/MatchQuery'
import { useAppToast } from '@/composables/useToast'
import {
  LABEL_COLORS,
  DEFAULTS,
  markerColor,
  peakStage,
  sanitizeSelection,
  scoresOf,
  stagesOf,
  listPeak,
  topScore,
} from '@/components/Matching/displayCore'
import MatchProfile from '@/components/Matching/MatchProfile.vue'
import MatchList from '@/components/Matching/MatchList.vue'
import MatchCluster from '@/components/Matching/MatchCluster.vue'

const LOOKS = ['dunkel', 'normal', 'hell']
const FILTERS = ['interesse', 'angebot', 'gesuch']
// The two grey buckets of "everyone else", split so the list can silence the ones
// with nothing to read on their own. On the map both draw as rings and the fill
// tells them apart (GMS-74); here two checkboxes do. Both start on — while the
// network is small the silent are most of it, and a name nearby is a lead.
const OTHERS = ['andereMit', 'andereOhne']
// Stub: the searcher's own precision. Live it comes from their position setting.
// With it 'genau', the exact people read exactly and the approximate ones blur —
// the coarser of the two ends always wins (describeDistance).
const MY_PRECISION = 'genau'

// Everything the map remembers lives under `pref.`, written straight to
// localStorage rather than into the persisted-state blob. That is what makes it
// survive a logout: logout removes only this app's own blob ('gradido-frontend',
// see store/store.js), so a key outside it is left alone. All of it belongs
// there: the auto-logout is rarely a decision the member made, and there is no
// sense in punishing them for it by forgetting where they were searching.
const PREF = 'pref.gms.map.'
const DEFAULT_RADIUS = 25
const MAX_RADIUS = 20000
// Leaflet wants a zoom to construct with. The real one arrives a tick later,
// from the remembered view or from the circle.
const BOOTSTRAP_ZOOM = 8

// Marker sizes in screen pixels per step. They stay constant while zooming, the
// way a pin does — a glow that grew with the zoom would read as a bigger match.
const GLOW_SIZE = { 1: 48, 2: 64, 3: 82, 4: 104 }
const DISC_SIZE = { 1: 20, 2: 28, 3: 38, 4: 48 }

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
// Matches whose screen points fall within CLUSTER_PX of the clicked one share the
// spot — the click resolves the crowd instead of blindly opening the top marker.
const CLUSTER_PX = 26

const { t, locale } = useI18n()
const router = useRouter()
const entryDraft = useEntryDraft()
const store = useStore()
const { toastError } = useAppToast()

const mapContainer = ref(null)
const look = ref(readLook())
const mode = ref(readMode())
const sortMode = ref(readSort())
const lensMode = ref(readLens())
const breite = ref(readBreite())
const visible = reactive(readVisible())

const radius = ref(readRadius())
const searchCenter = ref(readCenter())
// The place name of the current centre, for the list's confirmation line. Kept in
// `pref` so it survives a mode switch, another page, and the logout — the label was
// the only part that used to be lost; the centre itself was always saved.
const centerLabel = ref(readPref('centerLabel', ''))
const radiusModal = ref(false)
const radiusDraft = ref(DEFAULT_RADIUS)

const { matches, presence, load } = useMatches()

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
const myEntries = ref([])
// cache-and-network, not cache-first: the entries tab writes this same list, and a
// member who adds an entry and comes straight here would otherwise not find it in
// the menu - the one thing they just made.
const { onResult: onEntries } = useQuery(listMatchingEntries, null, {
  fetchPolicy: 'cache-and-network',
})
const entryKey = (entries) =>
  entries
    .map((entry) => entry.uuid)
    .sort()
    .join()

onEntries((result) => {
  const keyBefore = entryKey(myEntries.value)
  myEntries.value = (result.data?.listMatchingEntries ?? []).filter((entry) => entry.active)
  // A remembered choice can outlive what it points at: the entry may have been
  // deleted or paused since. Left standing it would show as "all my entries" in the
  // bar while the search narrowed to something that no longer exists — a page that
  // says one thing and does another. The state that always works is the fallback.
  if (
    selection.value.kind === 'entry' &&
    !myEntries.value.some((e) => e.uuid === selection.value.uuid)
  ) {
    onSelection({ kind: 'all' })
    // onSelection searches on its own; asking twice would be the same question.
    return
  }
  // This list and the location race each other on a cold load. When the location
  // wins, the first search goes out carrying none of my uuids — so nothing comes
  // back tagged as answering one of my entries, and looking through a single entry
  // then keeps nothing at all: a blank map with a search bar that says otherwise.
  // Ask again once the list has actually changed. Before a centre exists runSearch
  // returns without asking, so the other race order costs nothing.
  if (entryKey(myEntries.value) !== keyBefore) runSearch()
})

/**
 * Take a typed search over to the entry form, filled in.
 *
 * Handed over in memory rather than as a route parameter: the words are the
 * member's own, and an address bar keeps them long after the moment.
 *
 * The particulars travel with it. They were typed to sharpen this very search, and
 * they are what a stored match is judged on too — asking for them a second time,
 * one screen later, would be asking the member to repeat themselves. The form still
 * opens and still has to be sent: an invitation, not an entry made behind their back.
 */
function keepAsEntry() {
  if (!searchQuery.value) return
  entryDraft.put({
    summary: searchQuery.value.text,
    details: searchQuery.value.details,
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
const keepDismissed = ref(readPref('queryAnswered', false) === true)

function answerKeepOffer(answered = true) {
  keepDismissed.value = answered
  writePref('queryAnswered', answered)
}

function onSelection(next) {
  selection.value = next
  writePref('query', next)
  answerKeepOffer(false)
  closeCluster()
  runSearch()
}

// What the search asks for beyond the place: nothing for "everything" and for a
// single entry of mine (the entry only narrows what is SHOWN, the search is the
// same), and the typed sentence when there is one.
const searchQuery = computed(() =>
  selection.value.kind === 'typed'
    ? {
        text: selection.value.text,
        details: selection.value.details ?? '',
        matchingType: selection.value.matchingType,
      }
    : null,
)

// The profile window. `pref.gms.map.profile` holds the uuid of the open person,
// so it survives the round trip to the send form and the auto-logout — you come
// back to the map AND to whoever you were looking at.
const profileOpen = ref(false)
const activeMatch = ref(null)
const clusterOpen = ref(false)
const activeCluster = ref([])
// True while zoomed into a cluster: the map is centred on the crowd, not on the
// search centre, so the crosshair stays hidden — a tap must not move the search
// there. clusterZoomBase is the zoom we came from; dropping back to it ends it.
let inClusterZoom = false
let clusterZoomBase = 0

let map = null
let matchLayer = null
let presenceLayer = null
let ownLayer = null
let circleLayer = null
let centreLayer = null
let snapping = false
let canvasRenderer = null

const ownPosition = ref(null)
// 0 when the map's middle sits on the search centre — the crosshair fades out then,
// and only the disc marks the spot; 1 when it is far enough that setting a new centre
// there makes sense.
const crosshairOpacity = ref(1)
const crosshairStyle = computed(() => ({
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
  if (selection.value.kind !== 'entry') return matches.value
  const wanted = selection.value.uuid
  const narrowed = []
  for (const match of matches.value) {
    const channels = {}
    for (const [channel, entries] of Object.entries(match.channels ?? {})) {
      const kept = entries.filter((entry) => entry.matchedEntryUuid === wanted)
      if (kept.length) channels[channel] = kept
    }
    if (Object.keys(channels).length)
      narrowed.push({ ...match, channels, scores: scoresOf(channels) })
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
  const shown = []
  for (const match of focusedMatches.value) {
    const stages = stagesOf(match, DEFAULTS, breite.value, visible)
    const peak = peakStage(stages)
    if (peak < 1) continue
    shown.push({ match, stages, peak })
  }
  return shown
})

// The presence rings the filter lets through, split by whether they have entries.
const visiblePresence = computed(() =>
  presence.value.filter((person) => (person.hasEntries ? visible.andereMit : visible.andereOhne)),
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

// The lens only says something once the search has left home; until then both
// origins give the same reading, so the switch stays out of the way (and off a
// phone). A small distance threshold, not an exact match, so float and snap noise
// at home never conjures it.
const showLens = computed(() => {
  if (!ownPosition.value || !searchCenter.value) return false
  return distanceKm(ownPosition.value, searchCenter.value) > 0.1
})

function centreDistance(person) {
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
    if (pb !== pa) return pb - pa
    const ta = topScore(a.match, visible)
    const tb = topScore(b.match, visible)
    if (tb !== ta) return tb - ta
    return centreDistance(a.match) - centreDistance(b.match)
  })
})

const sortedPresence = computed(() =>
  [...visiblePresence.value].sort((a, b) => centreDistance(a) - centreDistance(b)),
)

const enabled = computed(() => Boolean(store.state.gmsAllowed))
const { onResult, onError } = useQuery(
  userLocationQuery,
  {},
  { fetchPolicy: 'network-only', enabled },
)

onResult(({ data }) => {
  const location = data?.userLocation
  if (!location) return
  // No pin, no map: the entry gate on the matching page says the same thing, and
  // a map centred on nothing would be a riddle rather than an answer.
  if (!location.userLocation) {
    router.replace('/matching/position')
    return
  }
  ownPosition.value = {
    lat: location.userLocation.latitude,
    lng: location.userLocation.longitude,
  }
  // First visit ever: the search starts where the member is. That is the normal
  // search — who is near me — and the only moment we get to choose it for them.
  if (!searchCenter.value) {
    searchCenter.value = { ...ownPosition.value }
    writePref('center', searchCenter.value)
    if (!centerLabel.value) resolveCenterLabel({ ...ownPosition.value })
  }
  drawOwn()
  drawCircle()
  restoreView()
  runSearch()
})
onError((error) => toastError(error.message))

function readPref(key, fallback) {
  try {
    const raw = window.localStorage?.getItem(PREF + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    // A stale or hand-edited value must not take the map down with it.
    return fallback
  }
}

function writePref(key, value) {
  try {
    window.localStorage?.setItem(PREF + key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: losing the preference beats losing the map.
  }
}

function readLook() {
  const stored = readPref('look', null)
  return LOOKS.includes(stored) ? stored : 'dunkel'
}

function readSelection() {
  return sanitizeSelection(readPref('query', null))
}

function readRadius() {
  const stored = readPref('radius', null)
  return Number.isFinite(stored) && stored >= 1 && stored <= MAX_RADIUS ? stored : DEFAULT_RADIUS
}

function readCenter() {
  const stored = readPref('center', null)
  return stored && Number.isFinite(stored.lat) && Number.isFinite(stored.lng) ? stored : null
}

function setLook(next) {
  look.value = next
  writePref('look', next)
}

function readMode() {
  return readPref('mode', null) === 'liste' ? 'liste' : 'karte'
}

function readSort() {
  const stored = readPref('sort', null)
  return ['naehe', 'passung', 'breite'].includes(stored) ? stored : 'naehe'
}

// The travel lens: measure distances from the search point (default) or from home.
function readLens() {
  const stored = readPref('lens', null)
  return ['suchpunkt', 'wohnort'].includes(stored) ? stored : 'suchpunkt'
}

function readBreite() {
  return readPref('breite', false) === true
}

function readVisible() {
  const base = { interesse: true, angebot: true, gesuch: true, andereMit: true, andereOhne: true }
  const stored = readPref('filters', null)
  if (!stored || typeof stored !== 'object') return base
  for (const key of Object.keys(base)) {
    if (typeof stored[key] === 'boolean') base[key] = stored[key]
  }
  return base
}

// A standing preference, not a switch to flip each visit: set 'liste' once and it
// stays (the blind member sets it in the position flow; the sighted flip back and
// forth). It rides in the same pref bag as look/radius/centre — no new mechanism.
function setMode(next) {
  mode.value = next
  writePref('mode', next)
}

function setSort(next) {
  if (!['naehe', 'passung', 'breite'].includes(next)) return
  sortMode.value = next
  writePref('sort', next)
}

function setLens(next) {
  if (!['suchpunkt', 'wohnort'].includes(next)) return
  lensMode.value = next
  writePref('lens', next)
}

// A look click leaves list mode: the three colours are the map's, and choosing one
// is asking for the map back.
function chooseLook(next) {
  setLook(next)
  setMode('karte')
}

function goBack() {
  router.push('/matching/entries')
}

/** The one place a search is actually asked for. */
function runSearch() {
  if (!searchCenter.value) return
  load({
    center: searchCenter.value,
    radius: radius.value,
    query: searchQuery.value,
    mineUuids: myEntries.value.map((entry) => entry.uuid),
  })
}

function moveSearchTo(next, { fly = false } = {}) {
  inClusterZoom = false
  closeCluster()
  searchCenter.value = { lat: next.lat, lng: next.lng }
  writePref('center', searchCenter.value)
  drawCircle()
  drawCentre()
  // Move the view to the new centre too. On the map the geosearch control pans
  // itself, but a search from the list has no map to move — without this the map
  // would still sit on the old place when you switch back to it. The home button
  // asks to fly there.
  zoomToCircle({ fly })
  runSearch()
  resolveCenterLabel(next)
}

/**
 * Name the centre for the list's confirmation line. A typed search already carries
 * its name; a point set on the map (and the first home centre) is looked up in
 * reverse. Privacy-safe: the search centre is a point you chose for yourself, never
 * a member's blurred position — this only ever geocodes your own search point.
 */
function setCenterLabel(label) {
  centerLabel.value = label || ''
  writePref('centerLabel', centerLabel.value)
}

async function resolveCenterLabel(next) {
  if (next.label) {
    setCenterLabel(next.label)
    return
  }
  setCenterLabel(await reverseGeocode(next.lat, next.lng))
}

/**
 * Coordinates → a concise place name, finest available first: the street when there
 * is one, the region when there is not (the tool returns whatever the point has).
 * Nominatim — the same OSM service the address search already speaks to.
 */
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}&accept-language=${locale.value}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return ''
    const data = await res.json()
    const a = data?.address || {}
    const fine =
      a.road || a.pedestrian || a.neighbourhood || a.suburb || a.city_district || a.hamlet
    const place = a.suburb || a.city || a.town || a.village || a.municipality || a.county || a.state
    const parts = [...new Set([fine, place].filter(Boolean))]
    return parts.slice(0, 2).join(', ') || data?.name || ''
  } catch {
    return ''
  }
}

/** The crosshair: make the map's centre the search's centre, and look there. */
function searchHere() {
  if (!map) return
  const centre = map.getCenter()
  moveSearchTo({ lat: centre.lat, lng: centre.lng })
}

function openRadius() {
  radiusDraft.value = radius.value
  radiusModal.value = true
}

const radiusValid = computed(
  () =>
    Number.isFinite(radiusDraft.value) && radiusDraft.value >= 1 && radiusDraft.value <= MAX_RADIUS,
)

/** Enter does what the save button does, including closing up behind itself. */
function submitRadius() {
  if (!radiusValid.value) return
  radiusModal.value = false
  applyRadius()
}

function applyRadius() {
  if (!radiusValid.value) return
  radius.value = Math.round(radiusDraft.value)
  writePref('radius', radius.value)
  drawCircle()
  // Frame the new circle: a radius you cannot see is a number without an answer.
  zoomToCircle()
  runSearch()
}

function rgb(channels) {
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`
}

function swatchStyle(channel) {
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
// crowd beneath it (only on the dark map; the disc look's box is too small to
// reach). The box is therefore made click-through (the pointer-events rule at the
// end of the style block), and only this small centred core — the size of the disc
// look's dot — takes the click. Both looks then share one hit footprint.
function glowHtml(colour, size, share, hit) {
  const core = (share * 0.9).toFixed(2)
  const tint = `${colour[0]}, ${colour[1]}, ${colour[2]}`
  return `<div class="gk-glow" style="width:${size}px;height:${size}px;background:
    radial-gradient(circle closest-side, rgba(255,255,255,${core}) 0%, rgba(255,255,255,0) 20%),
    radial-gradient(circle closest-side, rgba(${tint},1) 0%, rgba(${tint},.5) 32%, rgba(${tint},0) 68%)"></div><div class="gk-hit" style="width:${hit}px;height:${hit}px"></div>`
}

function discHtml(colour, size) {
  return `<div class="gk-disc" style="width:${size}px;height:${size}px;background:${rgb(colour)}"></div>`
}

function drawMatches() {
  if (!map) return
  if (matchLayer) matchLayer.remove()
  matchLayer = L.layerGroup().addTo(map)

  const glowing = look.value === 'dunkel'
  for (const { match, stages, peak } of visibleMatches.value) {
    const colour = markerColor(stages, DEFAULTS)
    const size = glowing ? GLOW_SIZE[peak] : DISC_SIZE[peak]
    const html = glowing
      ? glowHtml(colour, size, DEFAULTS.stageBright[peak - 1], DISC_SIZE[peak])
      : discHtml(colour, size)

    // Clickable, unlike the grey rings: a coloured marker is a match, and we have
    // their whole profile to show. The rings stay quiet until the backend can
    // name them (no uuid on the presence route yet — GMS-115, Dario's domain).
    L.marker([match.position.lat, match.position.lng], {
      icon: L.divIcon({
        className: 'gk-marker gk-clickable',
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      }),
      interactive: true,
      keyboard: false,
    })
      .on('click', () => handleMatchClick(match))
      .addTo(matchLayer)
  }
}

function openProfile(match) {
  activeMatch.value = match
  profileOpen.value = true
  writePref('profile', match.uuid)
}

/** The window's v-model. A close by the member forgets the person for good. */
function onProfileModel(open) {
  profileOpen.value = open
  if (!open) {
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
  const savedUuid = readPref('profile', null)
  if (!savedUuid) return
  const found = matches.value.find((entry) => entry.uuid === savedUuid)
  if (found) {
    activeMatch.value = found
    profileOpen.value = true
  }
}

function drawPresence() {
  if (!map) return
  if (presenceLayer) presenceLayer.remove()
  presenceLayer = L.layerGroup()

  // Thousands of rings would choke the DOM, so these go on a canvas. The handful
  // of matches above stay divIcons — they are few and they carry real CSS.
  const dark = look.value === 'dunkel'
  const stroke = dark ? 'rgb(116, 121, 131)' : 'rgb(95, 99, 107)'
  const fill = dark ? 'rgb(80, 84, 94)' : 'rgb(150, 154, 162)'
  for (const person of visiblePresence.value) {
    L.circleMarker([person.position.lat, person.position.lng], {
      renderer: canvasRenderer,
      radius: 5,
      weight: 2,
      color: stroke,
      fillColor: fill,
      fillOpacity: person.hasEntries ? 1 : 0,
      interactive: false,
    }).addTo(presenceLayer)
  }
  presenceLayer.addTo(map)
}

/**
 * A ring of real metres around a point.
 *
 * The backend measures with ST_DistanceSphere, so the circle the member sees has
 * to walk the same sphere. A box of degrees would drift from it — imperceptibly
 * at 25 km, visibly at the radius you use to look across a continent.
 */
function ringPoints(centre, metres, steps = 96) {
  const R = 6371008.8
  const d = metres / R
  const lat1 = (centre.lat * Math.PI) / 180
  const lng1 = (centre.lng * Math.PI) / 180
  const points = []
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing),
    )
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      )
    points.push([(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI])
  }
  return points
}

function drawCircle() {
  if (!map || !searchCenter.value) return
  if (circleLayer) circleLayer.remove()
  circleLayer = L.layerGroup().addTo(map)

  const metres = radius.value * 1000
  // A circle wide enough to swallow a pole has no outside left to dim, and its
  // ring wraps the globe instead of closing — a mask there would draw nonsense.
  // At that size the count in the heading is the whole answer anyway; the circle
  // was never the point of a search across half the world.
  const toPole = (90 - Math.abs(searchCenter.value.lat)) * 111320
  if (metres >= toPole) return

  const ring = ringPoints(searchCenter.value, metres)
  const mask = MASK[look.value]

  // The world with a hole in it. It has to be a polygon on the map, not a veil
  // over the container: it belongs to the ground and moves with it.
  const world = [
    [-89.9, -359.9],
    [-89.9, 359.9],
    [89.9, 359.9],
    [89.9, -359.9],
  ]
  L.polygon([world, ring], {
    stroke: false,
    fillColor: mask.fill,
    fillOpacity: mask.opacity,
    fillRule: 'evenodd',
    interactive: false,
  }).addTo(circleLayer)

  // A line, not a ring: a ring would read as one of the grey circles.
  L.polygon(ring, {
    fill: false,
    weight: 1,
    color: mask.edge,
    interactive: false,
  }).addTo(circleLayer)
}

function zoomToCircle({ fly = false } = {}) {
  if (!map || !searchCenter.value) return
  const centre = L.latLng(searchCenter.value.lat, searchCenter.value.lng)
  const bounds = centre.toBounds(radius.value * 2000)
  if (!fly) {
    map.fitBounds(bounds)
    return
  }
  // The way home flies in a smooth arc; every other reframe is an instant fit. Over a
  // long distance Leaflet's own timing turns theatrical, so cap it there — coming home
  // stays brisk however far you had wandered, while a short hop keeps its easy pace.
  const from = map.getCenter()
  const km = distanceKm({ lat: from.lat, lng: from.lng }, { lat: centre.lat, lng: centre.lng })
  map.flyToBounds(bounds, km > 300 ? { duration: 1.5 } : {})
}

// Home again: put the search itself back on your own place — the same as clicking
// the crosshair there. moveSearchTo centres the map on home and sets the search
// centre to it, so the crosshair comes to rest on the disc and the matches gather
// round home, exactly as on first open.
function recenterHome() {
  if (!map || !ownPosition.value) return
  moveSearchTo({ lat: ownPosition.value.lat, lng: ownPosition.value.lng }, { fly: true })
}

function drawOwn() {
  if (!map || !ownPosition.value) return
  if (ownLayer) ownLayer.remove()
  // Your home: the heart-house in gold. The crown moved on — this marks a place you
  // live, not a badge — and it needs no label; the house speaks for itself. The same
  // marker stands on the settings map, so "home" reads the same in both places.
  const html = `<div class="gk-own">
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <g fill="#c69130"><path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207L1.354 8.853a.5.5 0 1 1-.708-.707z"/><path d="m14 9.293l-6-6l-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018c-5.825-3.764-1.664-6.691 0-5.018"/></g>
      </svg>
    </div>`
  ownLayer = L.marker([ownPosition.value.lat, ownPosition.value.lng], {
    icon: L.divIcon({ className: 'gk-marker', html, iconSize: [34, 34], iconAnchor: [17, 17.5] }),
    interactive: false,
    zIndexOffset: 500,
  }).addTo(map)
}

function drawCentre() {
  if (centreLayer) {
    centreLayer.remove()
    centreLayer = null
  }
  if (!map || !searchCenter.value) return
  // A quiet disc under the house: it marks where the search is centred, so that when
  // the house wanders off — a search point away from home — the centre stays shown.
  centreLayer = L.marker([searchCenter.value.lat, searchCenter.value.lng], {
    icon: L.divIcon({
      className: 'gk-marker',
      html: '<div class="gk-centre"></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    }),
    interactive: false,
    zIndexOffset: 400,
  }).addTo(map)
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
  const here = map.latLngToContainerPoint([searchCenter.value.lat, searchCenter.value.lng])
  const middle = map.getSize().divideBy(2)
  const gap = here.distanceTo(middle)
  crosshairOpacity.value = Math.max(0, Math.min(1, (gap - COVER_TOL) / (COVER_FADE - COVER_TOL)))
}

// Coming to rest just off the centre eases the last pixels onto it, so it lands exact
// at any zoom. The flag keeps the snap's own moveend from snapping again.
function snapToCentre() {
  if (snapping || !map || !searchCenter.value) return
  const here = map.latLngToContainerPoint([searchCenter.value.lat, searchCenter.value.lng])
  const middle = map.getSize().divideBy(2)
  if (here.distanceTo(middle) < SNAP_TOL) {
    snapping = true
    map.panTo([searchCenter.value.lat, searchCenter.value.lng], { animate: true, duration: 0.25 })
  }
}

// A click on a coloured marker asks first: how many matches share this spot? One
// opens straight to a profile; a crowd zooms in to spread them — or, when no zoom
// can (identical coordinates), falls through to the cluster list.
function handleMatchClick(match) {
  if (!map) return
  const here = map.latLngToContainerPoint([match.position.lat, match.position.lng])
  const crowd = visibleMatches.value.filter(({ match: other }) => {
    const point = map.latLngToContainerPoint([other.position.lat, other.position.lng])
    return here.distanceTo(point) <= CLUSTER_PX
  })
  if (crowd.length <= 1) {
    openProfile(match)
    return
  }
  if (canSeparate(crowd)) zoomToCluster(crowd)
  else openClusterList(crowd)
}

// A zoom separates them only if they sit on different coordinates and there is zoom
// left to give; identical points (a shared address) never separate.
function canSeparate(crowd) {
  if (map.getZoom() >= map.getMaxZoom()) return false
  const first = crowd[0].match.position
  return crowd.some(
    ({ match: other }) => other.position.lat !== first.lat || other.position.lng !== first.lng,
  )
}

// Centre on the crowd and step in, no prompt — a harmless, reversible look; the
// search stays put and the crosshair hides while we are in here.
function zoomToCluster(crowd) {
  const lat = crowd.reduce((sum, { match: other }) => sum + other.position.lat, 0) / crowd.length
  const lng = crowd.reduce((sum, { match: other }) => sum + other.position.lng, 0) / crowd.length
  inClusterZoom = true
  clusterZoomBase = map.getZoom()
  map.setView([lat, lng], Math.min(clusterZoomBase + 2, map.getMaxZoom()), { animate: true })
}

// The list of a spot no zoom can open: the crowd, sorted by fit (distance says
// nothing when everyone is on one point).
function openClusterList(crowd) {
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
  const savedUuids = readPref('cluster', null)
  if (!savedUuids || !savedUuids.length) return
  const restored = savedUuids
    .map((uuid) => visibleMatches.value.find((item) => item.match.uuid === uuid))
    .filter(Boolean)
  if (restored.length) {
    activeCluster.value = restored
    clusterOpen.value = true
  }
}

function saveView() {
  if (!map) return
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
  if (!map) return
  const saved = readPref('view', null)
  if (
    saved &&
    Number.isFinite(saved.lat) &&
    Number.isFinite(saved.lng) &&
    Number.isFinite(saved.zoom)
  ) {
    map.setView([saved.lat, saved.lng], saved.zoom)
    return
  }
  zoomToCircle()
}

function initMap() {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value, { center: [0, 0], zoom: BOOTSTRAP_ZOOM, zoomControl: false })
  L.control.zoom({ position: 'topleft' }).addTo(map)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  canvasRenderer = L.canvas({ padding: 0.5 })

  const searchControl = new GeoSearchControl({
    provider: new OpenStreetMapProvider(),
    style: 'button',
    showMarker: false,
    showPopup: false,
    autoClose: true,
    keepResult: false,
    searchLabel: t('matching.map.search'),
  })
  map.addControl(searchControl)

  // A way home under the search lens: a gold heart-house button that frames your own
  // place again, wherever you have panned. It joins the Leaflet controls (white, round)
  // and, sitting in the same corner after the lens, stacks directly below it.
  const HomeControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd() {
      const bar = L.DomUtil.create('div', 'leaflet-bar gk-home')
      const link = L.DomUtil.create('a', '', bar)
      link.href = '#'
      link.setAttribute('role', 'button')
      link.title = t('matching.map.home')
      link.setAttribute('aria-label', t('matching.map.home'))
      link.innerHTML =
        '<svg viewBox="0 0 16 16" aria-hidden="true"><g fill="#c69130"><path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207L1.354 8.853a.5.5 0 1 1-.708-.707z"/><path d="m14 9.293l-6-6l-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018c-5.825-3.764-1.664-6.691 0-5.018"/></g></svg>'
      L.DomEvent.on(link, 'click', L.DomEvent.stop).on(link, 'click', recenterHome)
      return bar
    },
  })
  map.addControl(new HomeControl())

  // Looking up a town takes the search with it. Typing an address is a
  // deliberate act — and it is what stands in for a reset button: type where you
  // live and you are home, circle and all.
  map.on('geosearch/showlocation', (result) => {
    const lat = result?.location?.y
    const lng = result?.location?.x
    const label = result?.location?.label
    if (Number.isFinite(lat) && Number.isFinite(lng)) moveSearchTo({ lat, lng, label })
  })

  // Remembering where you looked is what lets you leave and come back to it. And the
  // crosshair answers the middle: it fades as the middle nears the centre, and a rest
  // close by eases exactly onto it.
  map.on('move', updateCentreCover)
  map.on('moveend', () => {
    saveView()
    // Zooming back out to where the cluster dive began ends the dive.
    if (inClusterZoom && map.getZoom() <= clusterZoomBase) inClusterZoom = false
    updateCentreCover()
    if (snapping) {
      snapping = false
      return
    }
    if (!inClusterZoom) snapToCentre()
  })

  drawOwn()
  drawCircle()
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
  if (map) map.invalidateSize()
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
  // Leaflet needs its container to have a size before it measures itself.
  setTimeout(initMap, 250)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (map) map.remove()
  map = null
  window.removeEventListener('resize', handleResize)
})

watch([matches, presence], redraw, { deep: true })
watch(matches, syncProfile)
watch(matches, syncCluster)
watch(breite, drawMatches)
watch(breite, (value) => writePref('breite', value))
watch(visible, redraw, { deep: true })
watch(visible, () => writePref('filters', { ...visible }), { deep: true })
watch(look, redraw)
// Coming back to the map: it kept its size under the cover, but a resize tick
// re-lays Leaflet's panes cleanly once the list lifts off.
watch(mode, (value) => {
  if (value === 'karte' && map) nextTick(() => map && map.invalidateSize())
})
</script>

<style lang="scss" scoped>
.map-shell {
  position: relative;
  overflow: hidden;
}

/* In list mode the map stays mounted underneath (kept sized), but Leaflet's own
   controls — the zoom buttons, the search button, the attribution — carry a high
   z-index and would poke through the list cover and sit on its text. The list has
   its own address search up top, so hide the map's controls while it is showing. */
.map-shell.is-list :deep(.leaflet-control-container) {
  display: none;
}

/* The home button rides Leaflet's white, rounded control chrome; only the gold
   house inside needs centring and a marker-ish size. */
:deep(.gk-home a) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.gk-home a svg) {
  width: 18px;
  height: 18px;
}

.map-canvas {
  height: 65vh;
  min-height: 380px;
  width: 100%;
}

/* The list sits over the map (which stays mounted and sized beneath it), under
   the look switch and the way back so both stay reachable to switch away. */
.list-cover {
  position: absolute;
  inset: 0;
  z-index: 400;
}

/* On a phone the page IS the map: it fills the screen, the controls sit right
   under it, and neither needs a scroll. dvh rather than vh, so the browser's own
   collapsing address bar cannot cut the controls off the bottom. */
@media (width <= 991.98px) {
  .matching-map-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    margin-top: 0 !important;
  }

  .map-frame {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .map-shell {
    flex: 1;
    min-height: 0;
    border-radius: 0;
  }

  .map-canvas {
    height: 100%;
    min-height: 0;
  }

  .map-controls {
    border-radius: 0;
    margin-top: 0 !important;
  }
}

/* Leaflet parks its zoom buttons top-left, exactly where the way back sits — on
   both devices now that the heading row is gone. */
.map-shell :deep(.leaflet-top.leaflet-left) {
  margin-top: 44px;
}

/* Leaflet gives its corner panes z-index 1000, which put the attribution over the
   keep offer and made the sentence unreadable. The attribution has to stay legible
   and reachable, but it is the map's small print — it belongs under a band that was
   put there deliberately. */
.map-shell :deep(.leaflet-bottom) {
  z-index: 500;
}

/* The air above belongs to the layout, not here: this page sits in the content
   column, and padding here would leave the menu column glued to the top on its
   own. See bareChrome in DashboardLayout. */

.map-back {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  color: #383838;
  background: rgb(255 255 255 / 90%);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 1px 5px rgb(0 0 0 / 40%);
}

/* Appearance. The filter belongs on the tile layer alone — put it on the map and
   it takes the zoom buttons, the attribution and our markers down with it. */
.map-shell.look-dunkel :deep(.leaflet-container) {
  background: #0b0c0f;
}

.map-shell.look-dunkel :deep(.leaflet-tile-pane) {
  filter: invert(1) hue-rotate(180deg) brightness(0.32) saturate(0) contrast(1.12);
}

.map-shell.look-hell :deep(.leaflet-container) {
  background: #fff;
}

.map-shell.look-hell :deep(.leaflet-tile-pane) {
  filter: saturate(0) brightness(1.16) contrast(0.94);

  /* A white veil cannot be written as a filter chain; half-transparent tiles over
     a white ground are exactly the same thing and need no extra layer. */
  opacity: 0.5;
}

.look-switch {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 500;
  display: flex;
  gap: 2px;
  padding: 3px;
  background: rgb(255 255 255 / 90%);
  border-radius: 26px;
  box-shadow: 0 1px 5px rgb(0 0 0 / 40%);
}

.look-group {
  display: flex;
  gap: 2px;
}

.look-divide {
  align-self: stretch;
  width: 1px;
  margin: 3px 1px;
  background: rgb(0 0 0 / 22%);
}

.look-btn {
  border: 0;
  background: transparent;
  border-radius: 24px;
  padding: 5px 12px;
  font-size: 13px;
  color: #383838;
  line-height: 1.2;

  &.is-on {
    background: #178d81;
    color: #fff;
    font-weight: 700;
  }
}

/* Sits under the look switch and the way back (z-index 500), because those are
   controls and this belongs to the map underneath them. */
.map-crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 450;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 0;
  color: rgb(255 255 255 / 50%);
  transform: translate(-50%, -50%);
  transition: opacity 0.28s ease;
}

.map-shell.look-hell .map-crosshair,
.map-shell.look-normal .map-crosshair {
  color: rgb(0 0 0 / 50%);
}

/* The offer to keep a typed search — a band riding the bottom of the SCREEN.

   Half-see-through on purpose (same recipe as the cluster overlay, a little lighter):
   whatever it covers has to stay sensed underneath, or the band reads as a page of
   its own rather than as something said about what is on screen. The small blur
   keeps the words legible over whatever happens to lie beneath.

   Under the gold trim (z-index 1000, App.vue) which frames the whole app, and under
   the query menu and any modal, which are answers to a deliberate act. Above
   everything on the page, because it belongs to the screen rather than to the map. */
.keep-offer {
  position: fixed;
  z-index: 900;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  /* The gold trim is 13px of fixed decoration along the bottom edge (.goldrand in
     App.vue). The band passes behind it, so its own content needs that much room
     plus air, or the buttons would sit on the trim. */
  padding: 0.85rem 1.25rem calc(13px + 0.7rem);
  border-top: 1px solid color-mix(in srgb, #c69130 45%, transparent);
  background: color-mix(in srgb, var(--surface) 80%, transparent);
  backdrop-filter: blur(3px);
  color: var(--text);
  animation: keep-rise 0.55s cubic-bezier(0.2, 0.7, 0.3, 1) 0.25s both;
}

/* On a desktop it stops where the content column starts. Across the whole width it
   ran under the menu as well and read as an application-wide bar, which it is not —
   it belongs to this page. The sidebar is a 2-of-12 column in DashboardLayout, so
   that is where the band begins. On a phone there is no sidebar and it spans the
   screen, which is right: there the whole width IS the page. */
@media (width >= 992px) {
  .keep-offer {
    left: 16.6667%;
    border-top-left-radius: 0.5rem;
  }
}

/* Question on one line, answers on the next — always, not only when the width
   happens to force it. Side by side on a wide screen the sentence and the buttons
   read as one crowded row; stacked, the question is a question and the buttons are
   its two answers. */
.keep-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Arriving unbidden, it is the movement that is noticed — not the presence. The
   short wait lets the results settle first, so the rise happens against a still
   picture instead of disappearing into the redraw. */
@keyframes keep-rise {
  from {
    transform: translateY(100%);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Whoever asked the system for less movement gets the band without the ride. */
@media (prefers-reduced-motion: reduce) {
  .keep-offer {
    animation: none;
  }
}

.keep-icon {
  flex: none;
  color: #c69130;
  font-size: 1.15rem;
}

/* Capped, so the sentence stays a readable measure on a wide screen instead of
   running the whole width of the display. */
.keep-ask {
  flex: 1;
  min-width: 0;
  max-width: 46rem;
  font-size: 0.9375rem;
}

.keep-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* The house button carries 50px of side padding, which is the width of a landing
   page, not of a band on a phone. */
.keep-btn {
  padding-right: 1.25rem !important;
  padding-left: 1.25rem !important;
  white-space: nowrap;
}

/* A labelled way out, not a cross: the band was never opened, it arrived, and a
   named answer is easier to find than a symbol. It stays quiet next to the gold
   one — this is an offer with two answers, not two buttons of equal weight. */
.keep-no {
  flex: none;
  padding: 0.35rem 0.75rem;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  white-space: nowrap;
}

.keep-no:hover {
  color: var(--text);
  text-decoration: underline;
}

.controls-heading {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 8px;
}

.radius-row {
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}

.radius-field {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 23px;
  padding: 0 6px;
  border: 1.5px solid #178d81;
  border-radius: 5px;
  background: rgb(23 141 129 / 7%);
  color: #178d81;
  font: inherit;
  font-variant-numeric: tabular-nums;
}

/* Decoration, not text — so it lives here rather than in the markup, where it
   would look like something to translate. Same separator the entry count uses. */
.radius-dot::before {
  content: '·';
  font-weight: 400;
  opacity: 0.35;
}

.map-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  margin: 0;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .box {
    width: 16px;
    height: 16px;
    border-radius: 5px;
    border: 1.5px solid #7a7a7a;
    position: relative;
    flex: 0 0 auto;
  }

  input:checked + .box {
    background: #178d81;
    border-color: #178d81;
  }

  input:checked + .box::after {
    content: '';
    position: absolute;
    left: 4.5px;
    top: 1px;
    width: 4px;
    height: 9px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  input:focus-visible + .box {
    outline: 2px solid #178d81;
    outline-offset: 2px;
  }

  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex: 0 0 auto;
  }
}

/* The cluster overlay covers the map while the mode is still "karte", so is-list
   does not apply — hide the map controls while it shows, so nothing sits over the
   overlay or its close cross. Placed last, after the plain control selectors, to
   keep specificity ascending. */
.map-shell.is-cluster .look-switch,
.map-shell.is-cluster .map-back,
.map-shell.is-cluster .map-crosshair {
  display: none;
}

.map-shell.is-cluster :deep(.leaflet-control-container) {
  display: none;
}
</style>

<style lang="scss">
/* The marker innards are rendered by Leaflet outside this component's scope. */
.gk-marker {
  background: transparent;
  border: 0;
}

.gk-glow {
  border-radius: 50%;
  filter: blur(3px);
  mix-blend-mode: screen;
}

/* The click core of a glowing marker: invisible, centred on the point, the size of
   the disc look's dot. It is the only part of a wide glow that takes a tap. */
.gk-hit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
}

.gk-disc {
  border-radius: 50%;
  box-sizing: border-box;
  border: 1.8px solid rgb(12 12 12 / 95%);
  pointer-events: auto;
  cursor: pointer;
}

.gk-centre {
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgb(255 255 255 / 8%);
  border: 1px solid rgb(255 255 255 / 30%);
}

.map-shell.look-hell .gk-centre,
.map-shell.look-normal .gk-centre {
  background: rgb(0 0 0 / 8%);
  border-color: rgb(0 0 0 / 35%);
}

.gk-own {
  width: 34px;

  svg {
    width: 34px;
    height: auto;
    display: block;
    filter: drop-shadow(0 1px 1px rgb(0 0 0 / 50%));
  }
}

/* Leaflet gives an interactive marker icon pointer-events:auto at 0,2,0 specificity;
   beating it needs 0,3,0. The coloured match markers hand their click to the core or
   disc inside (both pointer-events:auto), so the icon box around them — much of it
   invisible glow on the dark map — is click-through and cannot steal a tap. Kept at
   the end of the block so specificity only ever ascends (no-descending-specificity). */
.leaflet-interactive.gk-marker.gk-clickable {
  pointer-events: none;
}
</style>
