<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="matching-page mt--3">
    <!-- Jump-off to the find map. Shown on every tab. Access needs an active map
         presence (position set AND visible); otherwise the click guides to Position. -->
    <div class="matching-header d-flex justify-content-end mx-lg-5 mb-3">
      <!-- Disabled until the location query has answered: until then hasPosition is
           still false for everyone, and the panel behind this button would tell a
           member who does have a pin that they have none. -->
      <button type="button" class="find-btn" :disabled="!userLocationLoaded" @click="openFind">
        <i-bi-list-ul v-if="findList" class="find-btn-icon" />
        <i-bi-map v-else class="find-btn-icon" />
        <span class="find-btn-text">
          <span class="find-btn-title">
            <template v-if="findList">{{ $t('matching.find.titleList') }}</template>
            <template v-else>{{ $t('matching.find.title') }}</template>
          </span>
          <span class="find-btn-sub">{{ $t('matching.find.subtitle') }}</span>
        </span>
      </button>
    </div>

    <!-- Tab bar (entries / about / position) — same pattern as NavContributions.
         The label sits in its own nowrap span so a two-word label (any language)
         wraps below the icon as a unit instead of breaking between the words. -->
    <div class="matching-nav rounded-26 shadow d-flex justify-content-between mx-lg-5 mb-4">
      <BButton
        variant="link"
        class="matching-nav-btn"
        :class="{ 'is-active': tab === 'entries' }"
        @click="goTab('entries')"
      >
        <i-bi-card-list class="me-1" />
        <span class="matching-nav-label">{{ $t('matching.tabs.entries') }}</span>
      </BButton>
      <BButton
        variant="link"
        class="matching-nav-btn"
        :class="{ 'is-active': tab === 'about' }"
        @click="goTab('about')"
      >
        <i-bi-person class="me-1" />
        <span class="matching-nav-label">{{ $t('matching.tabs.about') }}</span>
      </BButton>
      <BButton
        variant="link"
        class="matching-nav-btn"
        :class="{ 'is-active': tab === 'position' }"
        @click="goTab('position')"
      >
        <i-bi-house-heart class="me-1" />
        <span class="matching-nav-label">{{ $t('matching.tabs.position') }}</span>
      </BButton>
    </div>

    <!-- Entries -->
    <div v-if="tab === 'entries'">
      <!-- One line for the empty page and the full one: the count says "0" where there is
           nothing, and "new entry" stands where it will stand after the first entry, so
           nobody has to look for it a second time. The count waits for the answer (an
           empty page must not say "0" to a member who has six); the button does not, and
           the line keeps its height either way, so nothing below it moves. -->
      <!-- Three numbers, each with a word that goes with ITS number: one entry is "1 Eintrag"
           (the line said "1 Einträge"), and in five of the ten languages the word for the
           live ones is declined as well ("3 entradas · 1 activa"). One message can follow one
           number only, so each part is its own, and `count` is the line they stand in. -->
      <div class="d-flex align-items-center justify-content-between mb-3 mx-lg-2 page-text">
        <span class="small text-muted" data-test="matching-entries-count">
          <template v-if="entriesLoaded">
            {{
              $t('matching.entries.count', {
                total: $t('matching.entries.countTotal', entries.length),
                live: $t('matching.entries.countLive', liveCount),
                paused: $t('matching.entries.countPaused', pausedCount),
              })
            }}
          </template>
        </span>
        <BButton
          variant="outline-secondary"
          class="btn-add"
          data-test="matching-entries-new"
          @click="openNew()"
        >
          <i-bi-plus-lg />
          {{ $t('matching.entries.new') }}
        </BButton>
      </div>

      <template v-if="entries.length">
        <div
          v-for="e in entries"
          :key="e.uuid"
          class="bg-white app-box-shadow gradido-border-radius p-3 mb-4"
          :class="{ 'opacity-05': !e.active }"
        >
          <BRow>
            <BCol cols="3" md="2">
              <div
                class="entry-avatar rounded-like-card d-flex align-items-center justify-content-center"
                :class="`type-${e.type}`"
              >
                <i-bi-heart-fill v-if="e.type === 'interesse'" />
                <i-bi-box-seam v-else-if="e.type === 'angebot'" />
                <i-bi-search v-else />
              </div>
            </BCol>
            <BCol class="min-w-0">
              <div class="small text-muted">{{ e.date }}</div>
              <div class="entry-type">{{ $t(`matching.type.${e.type}.word`) }}</div>
              <div class="entry-title word-break">{{ e.summary }}</div>
              <div class="mt-2">
                <span v-if="e.remote" class="badge-soft me-2">
                  <i-bi-globe2 />
                  {{ $t('matching.entries.remote') }}
                </span>
                <span v-if="!e.active" class="badge-soft">
                  <i-bi-pause-circle />
                  {{ $t('matching.entries.pausedBadge') }}
                </span>
              </div>
            </BCol>
          </BRow>
          <div v-if="e.open && e.details" class="details-box rounded-20 p-2 mt-3">
            {{ e.details }}
          </div>
          <BRow class="mt-3 pt-2 border-top text-center small text-muted">
            <BCol v-if="e.details" class="pointer" @click="e.open = !e.open">
              <i-bi-chevron-up v-if="e.open" />
              <i-bi-chevron-down v-else />
              <div>{{ $t('matching.entries.details') }}</div>
            </BCol>
            <BCol v-else class="no-details d-flex align-items-center justify-content-center">
              {{ $t('matching.entries.noDetails') }}
            </BCol>
            <BCol class="pointer" @click="toggleActive(e)">
              <i-bi-pause v-if="e.active" />
              <i-bi-play v-else />
              <div>
                {{ e.active ? $t('matching.entries.pause') : $t('matching.entries.activate') }}
              </div>
            </BCol>
            <BCol class="pointer" @click="openEdit(e)">
              <i-bi-pencil />
              <div>{{ $t('matching.entries.edit') }}</div>
            </BCol>
            <BCol class="pointer" @click="del(e)">
              <i-bi-trash />
              <div>{{ $t('matching.entries.delete') }}</div>
            </BCol>
          </BRow>
        </div>
      </template>

      <p
        v-else-if="entriesLoaded"
        class="text-center text-muted py-5 mb-0 page-text"
        data-test="matching-entries-empty"
      >
        <strong>{{ $t('matching.entries.emptyTitle') }}</strong>
        <br />
        {{ $t('matching.entries.emptyText') }}
      </p>
    </div>

    <!-- About -->
    <div v-if="tab === 'about'" class="mx-lg-2">
      <label class="fw-bold mb-2 d-block page-text">{{ $t('matching.about.label') }}</label>
      <textarea
        v-model="aboutMe"
        class="form-control matching-textarea"
        rows="10"
        :placeholder="$t('matching.about.placeholder')"
      ></textarea>
      <div class="d-flex justify-content-between align-items-center mt-2 page-text">
        <span class="small text-muted">
          {{ $t('matching.about.counter', { count: aboutMe.length }) }}
        </span>
        <BButton variant="gradido" @click="saveAbout">{{ $t('matching.save') }}</BButton>
      </div>
    </div>

    <!-- Position -->
    <div v-if="tab === 'position'" class="mx-lg-2">
      <p class="small text-muted ps-lg-2 page-text">{{ $t('matching.position.intro') }}</p>

      <!-- Inline map: address search (lupe) + draggable marker, reused from the
           settings page. Coordinates readout hidden to keep the map compact.
           Dragging only remembers — a map is easy to touch by accident, and a
           stray touch must not move where you live. Saving is the button below. -->
      <div
        class="bg-white app-box-shadow gradido-border-radius p-2 my-3"
        :inert="positionSaving"
        data-test="position-control"
      >
        <UserLocationMap
          v-if="userLocationLoaded"
          :user-marker-coords="userLocation"
          :show-coordinates="false"
          height="320px"
          user-icon="home"
          @update:userPosition="onPickPosition"
        />
      </div>

      <!-- Accuracy — right-aligned below the map (self-explanatory: "exact" /
           "approximate", so no label needed). Deferred like everything here. -->
      <div
        class="d-flex justify-content-end mt-3 page-text"
        :inert="positionSaving"
        data-test="position-control"
      >
        <UserGMSLocationFormat
          defer
          :exact-toast="$t('matching.position.accuracyExact')"
          :approximate-toast="$t('matching.position.accuracyApprox')"
          @gms-publish-location="onPickAccuracy"
        />
      </div>

      <!-- Findable toggle — title on the switch's line, hint below as explanation. Without
           a home it is held, and the hint says what is missing. -->
      <div
        class="border-top mt-4 pt-3 page-text"
        :inert="positionSaving"
        data-test="position-control"
      >
        <div class="d-flex align-items-center justify-content-end gap-3">
          <span class="fw-bold">{{ $t('matching.position.findable') }}</span>
          <UserSettingsSwitch
            defer
            :initial-value="findableAfterSave"
            attr-name="gmsAllowed"
            :label="$t('matching.position.findable')"
            :locked="findableLocked"
            :not-allowed-text="$t('matching.position.needsHome')"
            :enabled-text="$t('matching.position.findableOn')"
            :disabled-text="$t('matching.position.findableOff')"
            @value-changed="onPickFindable"
          />
        </div>
        <div class="small text-muted text-end mt-1">
          {{
            homeMissing ? $t('matching.position.needsHome') : $t('matching.position.findableHint')
          }}
        </div>
      </div>

      <!-- Nothing on this tab reaches the server until this is pressed. -->
      <div class="d-flex justify-content-end align-items-center gap-3 mt-4 page-text">
        <span v-if="positionDirty" class="small text-muted">
          {{ $t('matching.position.unsaved') }}
        </span>
        <BButton
          variant="gradido"
          :disabled="!positionDirty || findableWithoutHome"
          @click="askToSave"
        >
          {{ $t('matching.save') }}
        </BButton>
      </div>
    </div>

    <!-- Popup: new entry -->
    <!-- A form that opens on the choice stands at the top of the window, not in its
         middle: a centred dialog moves when it grows, and this one grows by its fields
         the moment a kind is picked -- under the finger that just picked it. -->
    <BModal v-model="showNew" :centered="!choiceFirst">
      <template #title>
        <span style="font-size: 18px">
          {{ editUuid ? $t('matching.entries.edit') : $t('matching.entries.new') }}
        </span>
      </template>
      <template #default>
        <!-- Nothing is picked for a new entry: with "interest" already lit, the three
             read as a setting that is done, and a first entry became an interest by
             default. The line asks, each button shows the sentence it starts, and the
             fields only come once one is picked. The line keeps its place afterwards
             (invisible), so the buttons stay where they were pressed. -->
        <div
          v-if="choiceFirst"
          class="small fw-bold mb-1"
          :class="{ invisible: newType }"
          aria-hidden="true"
          data-test="matching-entry-choose"
        >
          {{ $t('matching.new.choose') }}
        </div>
        <div class="d-flex gap-2 mb-3" role="group" :aria-label="$t('matching.new.choose')">
          <button
            v-for="ty in types"
            :key="ty.key"
            type="button"
            class="type-choice-btn"
            :class="[`type-${ty.key}`, { 'is-sel': newType === ty.key }]"
            :aria-pressed="newType === ty.key"
            @click="newType = ty.key"
          >
            <i-bi-heart-fill v-if="ty.key === 'interesse'" />
            <i-bi-box-seam v-else-if="ty.key === 'angebot'" />
            <i-bi-search v-else />
            <div class="type-choice-word">{{ $t(`matching.type.${ty.key}.word`) }}</div>
            <div class="type-choice-starts">
              {{
                $t('matching.new.sentenceStart', { start: $t(`matching.type.${ty.key}.prefix`) })
              }}
            </div>
          </button>
        </div>

        <template v-if="newType">
          <label class="small fw-bold d-block mb-1">
            {{ $t('matching.new.completeSentence') }}
          </label>
          <div class="entry-sentence d-flex align-items-center gap-2">
            <span class="entry-prefix">{{ $t(`matching.type.${newType}.prefix`) }}</span>
            <!-- The column behind this is varchar(160) and the resolver passes the
               value straight through, so a longer sentence would either come back
               as a raw driver error or be cut off without anyone saying so. -->
            <input
              v-model="newSummary"
              class="form-control"
              maxlength="160"
              :placeholder="$t(`matching.type.${newType}.placeholder`)"
            />
          </div>

          <div class="mt-3">
            <label class="small fw-bold d-block mb-1">
              {{ $t('matching.new.detailsHeading') }}
            </label>
            <textarea
              v-model="newDetails"
              class="form-control matching-textarea"
              rows="5"
              style="height: auto"
              :placeholder="$t(`matching.type.${newType}.detailsPlaceholder`)"
            ></textarea>
          </div>

          <BFormCheckbox v-model="newRemote" class="mt-3">
            {{ $t('matching.new.remote') }}
          </BFormCheckbox>
          <!-- What it now DOES, said where it is set. Since the map has a reach switch,
             this box is the gate: an entry without it is never found in the wide
             search, however well it fits. It used to be a label on an entry and
             nothing more, so nobody had to be told. -->
          <div class="small text-muted ms-4 ps-1">{{ $t('matching.new.remoteHint') }}</div>
        </template>
      </template>
      <template #footer>
        <BButton variant="secondary" @click="showNew = false">
          {{ $t('matching.new.cancel') }}
        </BButton>
        <BButton
          v-if="newType"
          variant="gradido"
          :disabled="!newSummary.trim() || !newDetails.trim()"
          @click="save"
        >
          {{ $t('matching.save') }}
        </BButton>
      </template>
    </BModal>

    <!-- Access gate. Only shown when there is no map presence yet — with one, the
         find button goes straight to the map instead of asking for a click. -->
    <BModal v-model="showFind" centered>
      <template #title>
        <span style="font-size: 18px">{{ $t('matching.find.gateTitle') }}</span>
      </template>
      <template #default>
        <p class="mb-0">{{ $t('matching.find.gateText') }}</p>
      </template>
      <template #footer>
        <!-- One row where both fit. Where they do not -- a phone, or a language with longer
             words -- the way on stands above "later": see .window-buttons. -->
        <div class="window-buttons">
          <BButton variant="secondary" data-test="find-gate-later" @click="showFind = false">
            {{ $t('matching.find.later') }}
          </BButton>
          <!-- The button of the tile on the overview, and the same yes: the home tab with
               "findable" switched on. On the home tab itself it is still the thing to press --
               the window closes and the switch below it stands on. -->
          <BButton variant="gradido" data-test="find-gate-show-me" @click="showMeFromFind">
            {{ $t('matching.invitation.go') }}
          </BButton>
        </div>
      </template>
    </BModal>

    <!-- Saving your own whereabouts is worth one deliberate breath - and the window says what
         the save does. Coming onto the map and leaving it are not "saving position settings":
         each has its own title, its own sentence and a button that names the step, like the
         button of the invitation (Bernd, 11.10.2026). See saveWords. -->
    <BModal v-model="showSaveConfirm" centered>
      <template #title>
        <span style="font-size: 18px" data-test="position-save-title">{{ saveWords.title }}</span>
      </template>
      <template #default>
        <p class="mb-0" data-test="position-save-text">{{ saveWords.text }}</p>
      </template>
      <template #footer>
        <!-- The button that names the step is as long as the one in the window above, and
             wraps the same way: see .window-buttons. -->
        <div class="window-buttons">
          <BButton
            variant="secondary"
            data-test="position-save-cancel"
            @click="showSaveConfirm = false"
          >
            {{ $t('matching.position.cancel') }}
          </BButton>
          <BButton variant="gradido" data-test="position-save-confirm" @click="confirmSavePosition">
            {{ saveWords.confirm }}
          </BButton>
        </div>
      </template>
    </BModal>

    <!-- Delete confirmation (replaces the browser confirm dialog) -->
    <BModal v-model="showDelete" centered>
      <template #title>
        <span style="font-size: 18px">{{ $t('matching.entries.delete') }}</span>
      </template>
      <template #default>
        <p class="mb-2">{{ $t('matching.entries.deleteConfirm') }}</p>
        <p v-if="delEntry" class="fw-bold word-break mb-0">{{ delEntry.summary }}</p>
      </template>
      <template #footer>
        <BButton variant="secondary" @click="showDelete = false">
          {{ $t('form.cancel') }}
        </BButton>
        <BButton variant="gradido" @click="confirmDelete">
          {{ $t('matching.entries.delete') }}
        </BButton>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { useMutation, useQuery } from '@vue/apollo-composable'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useWalletStore } from '@/store/useWalletStore'
import { useAppToast } from '@/composables/useToast'
import { useEntryDraft } from '@/composables/useEntryDraft'
import { eventLinkUnderway } from '@/composables/useEventMatchingArrival'
import { rememberOwnMatchingEntries } from '@/composables/useOwnMatchingEntries'
import {
  acceptEventMatchingEntry,
  createMatchingEntry,
  deleteMatchingEntry,
  setMatchingEntryActive,
  updateMatchingEntry,
  updateUserInfos,
} from '@/graphql/mutations'
import { listMatchingEntries, userLocationQuery, verifyLogin } from '@/graphql/queries'
import { displayType, entryType } from '@/components/Matching/displayCore'
import {
  configuredCommunityPoint,
  hasPosition as isPositionSet,
  mayFind,
} from '@/utils/matchingPosition'
import { mapPrefPrefix } from '@/utils/matchingPrefs'
import { asksForNewEntry } from '@/utils/newMatchingEntry'
import { SHOW_ME_ON_THE_MAP, saidShowMe } from '@/utils/showMeOnTheMap'
import UserGMSLocationFormat from '@/components/UserSettings/UserGMSLocationFormat'
import UserLocationMap from '@/components/UserSettings/UserLocationMap'
import UserSettingsSwitch from '@/components/UserSettings/UserSettingsSwitch'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useWalletStore()
const { toastSuccess, toastError } = useAppToast()

// The active tab is driven by the route param (/matching/:tab) so the
// right-hand explanation column (MatchingTemplate) can switch in sync
// via $route.params.tab.
const tab = computed(() => route.params.tab || 'entries')
const goTab = (name) => {
  if (tab.value !== name) router.push(`/matching/${name}`)
}

const types = [{ key: 'interesse' }, { key: 'angebot' }, { key: 'gesuch' }]

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(locale.value, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

// Only fire the authenticated queries once we actually have a session.
const enabled = computed(() => !!store.gradidoID)

// --- Entries: load from the backend, map onto the UI shape (open is client-only) ---
const entries = ref([])
const entriesLoaded = ref(false)
const {
  refetch: refetchEntries,
  onResult: onEntries,
  onError: onEntriesError,
} = useQuery(listMatchingEntries, null, { fetchPolicy: 'cache-and-network', enabled })
onEntries(({ data }) => {
  if (!data?.listMatchingEntries) return
  // open is client-only: it holds which entry the member is reading right now.
  // Saving, pausing or deleting any entry refetches the whole list, so rebuilding
  // it blind would close an entry nobody touched, under their finger. Carry the
  // state over per entry instead; undefined means the entry is new to us, which
  // is the only case that starts closed.
  const openBefore = new Map(entries.value.map((e) => [e.uuid, e.open]))
  entries.value = data.listMatchingEntries.map((e) => ({
    uuid: e.uuid,
    type: displayType(e.matchingType),
    summary: e.summary,
    details: e.details || '',
    active: e.active,
    remote: e.remote,
    open: openBefore.get(e.uuid) ?? false,
    date: formatDate(e.createdAt),
  }))
  entriesLoaded.value = true
  // The overview decides from this what its matching tile is (useOwnMatchingEntries). Told
  // with every list, because this page is where entries are made and deleted: the member
  // who goes back to the overview from here finds the tile right at once, without a wait.
  rememberOwnMatchingEntries(store.gradidoID, entries.value.length)
})
onEntriesError((error) => {
  toastError(error.message)
})

/**
 * One entry more, or one fewer, said to the device the moment the server has confirmed it --
 * not only with the list that is fetched afterwards. Saving takes the server a round trip to
 * the GMS, and a member who leaves this page before the list is back (the browser's back
 * button works over the open form) would find the overview inviting them to a "first" entry
 * they have just made; with a deletion the tile would stay away. The list, when it comes,
 * says the real number.
 *
 * `member` is who pressed the button, held before the request: a sign-out empties the store
 * while the answer is on its way. And only where the list is known -- one more than unknown
 * is unknown.
 */
const tellEntriesChanged = (member, by) => {
  if (!entriesLoaded.value) return
  rememberOwnMatchingEntries(member, entries.value.length + by)
}

const liveCount = computed(() => entries.value.filter((e) => e.active).length)
// Each of the three numbers in the line above the list is handed to its own message, the
// paused ones too: no language declines that word today, and one that does one day has
// only a second form to write.
const pausedCount = computed(() => entries.value.length - liveCount.value)

const { mutate: createEntry } = useMutation(createMatchingEntry)
const { mutate: updateEntry } = useMutation(updateMatchingEntry)
const { mutate: setEntryActive } = useMutation(setMatchingEntryActive)
const { mutate: removeEntry } = useMutation(deleteMatchingEntry)
const { mutate: acceptEntry } = useMutation(acceptEventMatchingEntry)

// --- New / edit entry modal ---
const entryDraft = useEntryDraft()
const showNew = ref(false)
const editUuid = ref(null)
// null until the member picks one. A search kept from the map and an entry being edited
// bring theirs along.
const newType = ref(null)
// Whether this opening began with the choice. Set when the form opens and left alone
// until the next one, so picking a kind does not change where the window stands.
const choiceFirst = ref(false)
const newSummary = ref('')
const newDetails = ref('')
const newRemote = ref(false)

function openNew({ summary = '', details = '', matchingType = null, remote = false } = {}) {
  editUuid.value = null
  newType.value = matchingType
  choiceFirst.value = !matchingType
  newSummary.value = summary
  // Carried over from a typed search when there was one. The member wrote these to
  // sharpen that search; a stored entry is judged on the same words, so asking again
  // would be asking them to repeat themselves.
  newDetails.value = details
  // Off unless whoever opens the form says otherwise: the map and the overview's tile say
  // nothing. (An event link opens no form, see `acceptEventEntry`.)
  newRemote.value = remote
  showNew.value = true
}

/**
 * The entry an event link offers (`/event?interest=…`), handed over by the link's guard or the
 * sign-in (utils/eventMatchingLink, `unlessThere`): made at once, without a form -- the tap on
 * the link is the yes (KA-014). The server compares it with the member's own entries
 * (`acceptEventMatchingEntry`): where the member has that sentence already, live or paused,
 * nothing is made, and this page says nothing either. Whoever taps the link in every mail of a
 * congress is not told each time what they know.
 *
 * Made, the entry is said in a toast with its sentence, as the list shows it, and the list is
 * fetched again -- the entry stands in it, to be paused or deleted like any other. And the
 * invitation onto the map follows, for a member who does not stand on it yet (KA-015,
 * components/EventMatchingHomeInvitation): the page says here that the link made the entry, and
 * until the answer is in, the windows after that invitation wait (useEventMatchingArrival).
 *
 * Refused, nothing is said where the member has a reason told elsewhere: no connection, or an
 * account whose address waits for its confirmation (401 -- the reminder says what to do). Only
 * a refusal nobody expects gets the usual red toast.
 *
 * ⛔ The answer comes a moment after the page, and the member may have signed out by then: the
 * toast and the count on the device belong to who opened the link, and only to them.
 */
// No connection: the request never reached a server, so there is no status. A server that
// answered with an error status (a 502 while it restarts, a 500) is not "no connection".
const quietRefusal = (error) =>
  Boolean(error?.networkError && !error.networkError.statusCode) ||
  (error?.graphQLErrors ?? []).some((e) => e?.message === '401 Unauthorized')
async function acceptEventEntry(offered) {
  const member = store.gradidoID
  const answered = eventLinkUnderway(member)
  let accepted
  try {
    const result = await acceptEntry({
      eventMatchingEntry: {
        summary: offered.summary,
        details: offered.details || null,
        remote: offered.remote,
      },
    })
    accepted = result?.data?.acceptEventMatchingEntry
  } catch (error) {
    answered(null)
    if (quietRefusal(error) || store.gradidoID !== member) return
    toastError(error.message)
    // The server stores the entry before it hands it to the GMS, and a refusal can come from
    // that second step: the list says what is there (coderabbit, #4149).
    try {
      await refetchEntries()
    } catch {
      // The red toast has said it already.
    }
    return
  }
  if (!accepted?.created || store.gradidoID !== member) {
    answered(null)
    return
  }
  answered(accepted.entry.summary)
  toastSuccess(
    t('eventMatching.landing.added', {
      sentence: `${t('matching.type.interesse.prefix')} ${accepted.entry.summary}`,
    }),
  )
  // Told only where the list does not hold it yet: a list that came after the entry was made
  // counts it already.
  if (!entries.value.some((e) => e.uuid === accepted.entry.uuid)) tellEntriesChanged(member, 1)
  try {
    await refetchEntries()
  } catch (error) {
    if (store.gradidoID === member) toastError(error.message)
  }
}

/**
 * The map may have handed over a typed search to keep.
 *
 * Read once and cleared by take(), so coming back to this tab later does not open
 * the form again over an offer the member already walked away from. The details
 * stay empty on purpose: the sentence is theirs to finish, and the details are what
 * the match is actually judged on.
 */
onMounted(() => {
  const draft = entryDraft.take()
  if (draft?.unlessThere) {
    acceptEventEntry(draft)
  } else if (draft) {
    openNew(draft)
  }
  // Or the overview's matching tile sent the member to write an entry (utils/newMatchingEntry).
  // The wish is read once and taken out of the address at once, as the contacts page takes
  // out the conversation it is asked for: a reload, or the way back to this tab, must not
  // open the form again over what the member closed. A kept search comes first -- it brings
  // words along, and there is one form.
  //
  // Unlike that conversation the form does not line up with the windows of the first logins
  // (useFirstLoginWindow). From the tile nobody gets here with one of them due: it would be
  // lying over the overview. Only this address opened afresh -- in a new tab, or after a
  // sign-in the tap ran into -- by a member whose address is still unconfirmed meets the
  // reminder and the form together.
  if (!asksForNewEntry(route)) return
  const { new: _new, ...rest } = route.query
  router.replace({ query: rest })
  if (!draft) openNew()
})
function openEdit(e) {
  editUuid.value = e.uuid
  newType.value = e.type
  choiceFirst.value = false
  newSummary.value = e.summary
  newDetails.value = e.details || ''
  newRemote.value = e.remote
  showNew.value = true
}
async function save() {
  const input = {
    matchingType: entryType(newType.value),
    summary: newSummary.value.trim(),
    details: newDetails.value.trim() || null,
    remote: newRemote.value,
  }
  const member = store.gradidoID
  try {
    if (editUuid.value) {
      await updateEntry({ uuid: editUuid.value, input })
    } else {
      await createEntry({ input })
      tellEntriesChanged(member, 1)
    }
    showNew.value = false
    await refetchEntries()
  } catch (error) {
    toastError(error.message)
  }
}
async function toggleActive(e) {
  try {
    await setEntryActive({ uuid: e.uuid, active: !e.active })
    await refetchEntries()
  } catch (error) {
    toastError(error.message)
  }
}
// --- Delete confirmation modal (replaces the browser confirm dialog) ---
const showDelete = ref(false)
const delEntry = ref(null)
function del(e) {
  delEntry.value = e
  showDelete.value = true
}
async function confirmDelete() {
  const e = delEntry.value
  if (!e) return
  showDelete.value = false
  const member = store.gradidoID
  try {
    await removeEntry({ uuid: e.uuid })
    tellEntriesChanged(member, -1)
    await refetchEntries()
  } catch (error) {
    toastError(error.message)
  }
}

// --- About me: read via verifyLogin, persist via updateUserInfos ---
const aboutMe = ref('')
const { onResult: onUser } = useQuery(verifyLogin, null, {
  fetchPolicy: 'cache-and-network',
  enabled,
})
// This ref is two things at once: what the server holds, and what the member is
// typing right now. cache-and-network answers twice — the cache at once, the
// network a moment later — and any further verifyLogin refetch answers again.
// Taking every answer would wipe out whatever was written in between. So the
// server is only believed while the box still holds exactly what it last said;
// after the first keystroke the text belongs to the member. Filling once instead
// would be the other error: a cache answering with a stale value would then
// stand, and the fresh one behind it could never correct it.
let aboutMeFromServer = null
onUser(({ data }) => {
  if (!data?.verifyLogin) return
  const fromServer = data.verifyLogin.aboutMe || ''
  if (aboutMeFromServer === null || aboutMe.value === aboutMeFromServer) {
    aboutMe.value = fromServer
  }
  aboutMeFromServer = fromServer
})
const { mutate: saveUserInfos } = useMutation(updateUserInfos)
async function saveAbout() {
  try {
    await saveUserInfos({ aboutMe: aboutMe.value })
    // What was sent is now what the server holds, so a later answer saying the
    // same thing must not read as a change the member has not seen.
    aboutMeFromServer = aboutMe.value
    toastSuccess(t('matching.about.saved'))
  } catch (error) {
    toastError(error.message)
  }
}

// --- Position tab: inline map + accuracy + findable, reusing the settings components ---
const { mutate: saveLocation } = useMutation(updateUserInfos)
const userLocation = ref({ lat: 0, lng: 0 })
const communityLocation = ref({ lat: 0, lng: 0 })
const userLocationLoaded = ref(false)
const hasPosition = ref(false)

const { onResult: onUserLocation, onError: onUserLocationError } = useQuery(
  userLocationQuery,
  {},
  { fetchPolicy: 'network-only', enabled },
)
onUserLocation(({ data }) => {
  const loc = data?.userLocation
  if (!loc) return
  // The community's point is nullable too: an instance whose admin never set one must
  // still be able to show this map, because this is the page where a member sets their
  // own position. Fall back to what the build was configured with. It is not drawn on
  // the map (Bernd, 11.09.2026: it only confused); it is where the map opens for a
  // member who has no home on it yet.
  communityLocation.value = isPositionSet(loc.communityLocation)
    ? { lat: loc.communityLocation.latitude, lng: loc.communityLocation.longitude }
    : configuredCommunityPoint()
  // Two numbers or nothing. `Boolean(loc.userLocation)` stood here until 09.09.2026, and
  // an account that had never set a position was answered with an empty object -- truthy,
  // so this page told the find button the way was clear and the map opened on nothing.
  hasPosition.value = isPositionSet(loc.userLocation)
  userLocation.value = hasPosition.value
    ? { lat: loc.userLocation.latitude, lng: loc.userLocation.longitude }
    : { ...communityLocation.value }
  // The router guard in front of the map reads the store, and this is the freshest answer
  // there is -- so it is written back, or the two could disagree. They would: a position
  // set on another device leaves this store copy behind, the button would light up on
  // what the server just said and the guard would send the member straight back on what
  // the store still believes. A button that does nothing, silently.
  //
  // Only when it actually differs. Every change makes store.js serialize the
  // WHOLE store and write it to localStorage, and the store carries the member's avatar as
  // base64 -- so an unconditional set would put a ~12 KB synchronous write behind every
  // answer of a network-only query, to store two floats that did not change.
  const known = store.userLocation
  const fresh = hasPosition.value ? { ...loc.userLocation } : null
  if (
    isPositionSet(known) !== isPositionSet(fresh) ||
    known?.latitude !== fresh?.latitude ||
    known?.longitude !== fresh?.longitude
  ) {
    store.setUserLocation(fresh)
  }
  userLocationLoaded.value = true
})
onUserLocationError((error) => toastError(error.message))

// --- Position tab: nothing here saves itself ---
//
// A map is easy to touch by accident — on a phone you land on this tab and brush
// the display, and where you live has moved. So the three settings of this tab
// (pin, accuracy, findable) only ever get remembered, and reach the server
// together when the save button is pressed. The settings page has always worked
// this way for its map; this tab used to be the exception.

// What was picked but not yet saved. null = untouched since the last save.
const draftPosition = ref(null)
const draftAccuracy = ref(null)
const draftFindable = ref(null)

const positionDirty = computed(
  () =>
    draftPosition.value !== null || draftAccuracy.value !== null || draftFindable.value !== null,
)

// Findable needs a home: one the member saved, or one just picked on the map. The GMS
// cannot place a member without one - the backend refuses to build them over there
// ("Missing Location") and refuses the setting itself (GMS_LOCATION_REQUIRED) - so the
// switch is held until there is a home, and save never carries findable on its own.
const hasHome = computed(() => hasPosition.value || draftPosition.value !== null)
// Not said before the location query has answered: until then nobody knows, and "set your
// home first" would reach members who have one.
const homeMissing = computed(() => userLocationLoaded.value && !hasHome.value)
const findableAfterSave = computed(() => draftFindable.value ?? Boolean(store.gmsAllowed))
// Only the way on is held. A member who is findable without a home - saved before the
// server refused it - can still switch it off.
const findableLocked = computed(() => homeMissing.value && !findableAfterSave.value)
// What save would leave behind. Also true while the location is unknown, so a switch
// turned on in that moment waits for the answer rather than going out alone.
const findableWithoutHome = computed(() => findableAfterSave.value && !hasHome.value)

function onPickPosition(coords) {
  const cur = userLocation.value
  if (cur && Math.abs(coords.lat - cur.lat) < 1e-7 && Math.abs(coords.lng - cur.lng) < 1e-7) {
    // Standing on the saved place is a clean state, not a change being held. That
    // covers the map's echo on mount, where the draft was empty anyway, and the
    // case this guard used to get wrong: moving the pin away and coming back, most
    // easily by searching your own address again, which returns the very same
    // coordinates. Leaving the draft standing there would show the pin here and
    // save the other place. The accuracy and findable pickers below already answer
    // a return this way.
    draftPosition.value = null
    return
  }
  draftPosition.value = { lat: coords.lat, lng: coords.lng }
}
function onPickAccuracy(value) {
  draftAccuracy.value = value === store.gmsPublishLocation ? null : value
}
function onPickFindable(value) {
  draftFindable.value = value === Boolean(store.gmsAllowed) ? null : value
}

function clearDrafts() {
  draftPosition.value = null
  draftAccuracy.value = null
  draftFindable.value = null
}

// A member who pressed "show me on the map" - on the overview's tile or in the window
// behind the find button - arrives having said yes, and the switch says so: it stands on,
// as a draft like any other on this tab. Nothing is saved by arriving. Without a home the
// save button stays off and the line under the switch says what is missing; with one, the
// member still presses save and confirms.
//
// Through onPickFindable, like a tap on the switch itself, so a member who is findable
// already arrives on a clean tab instead of an armed one.
const showMe = computed(() => saidShowMe(route))
watch(
  showMe,
  (yes) => {
    if (yes) onPickFindable(true)
  },
  { immediate: true },
)

const showSaveConfirm = ref(false)

// What the save about to be confirmed does to the member's place on the map: 'join' puts
// them on it, 'leave' takes them off, null leaves it where it is. The draft says it - it
// only stands where the switch differs from what is saved.
//
// ⚠️ Fixed when the window opens, not read while it stands. The answer to the save clears
// the drafts, and it arrives while the window is still fading out: read live, the window
// would change its title back to "save position" on its way off the screen.
const saveTurn = ref(null)
function askToSave() {
  saveTurn.value =
    draftFindable.value === true ? 'join' : draftFindable.value === false ? 'leave' : null
  showSaveConfirm.value = true
}

// The window's words. A member who takes themselves off the map is not "saving position
// settings", and neither is one who comes onto it; the window used to say so to both, and
// the message afterwards said "location saved" to somebody who had just left (Bernd,
// 11.10.2026). The button for coming on is the invitation's own.
const saveWords = computed(() => {
  if (saveTurn.value === 'leave') {
    return {
      title: t('matching.position.leaveTitle'),
      text: t('matching.position.leaveText'),
      confirm: t('matching.position.leaveGo'),
    }
  }
  if (saveTurn.value === 'join') {
    return {
      title: t('matching.position.joinTitle'),
      text: t('matching.position.joinText'),
      confirm: t('matching.invitation.go'),
    }
  }
  return {
    title: t('matching.position.saveTitle'),
    text: t('matching.position.saveText'),
    confirm: t('matching.save'),
  }
})

// Held while a save is under way. What save sends is what the three controls showed when it
// was pressed, and its answer replaces the drafts - so a pick made in between was measured
// against the old state and then thrown away with them. A member who switched "findable"
// back off in that moment was saved as findable all the same and, having arrived with the
// yes, carried onto the map (coderabbit on #4124). Nothing can be picked until the answer
// is in.
//
// `inert` on the map, the accuracy and the switch, the way the map page holds its map: no
// dimming for the fraction of a second this usually takes. Not on the save button - the
// confirm window hands the focus back to it.
const positionSaving = ref(false)

async function confirmSavePosition() {
  showSaveConfirm.value = false
  // Confirmed a second time before the first answer: it is on its way already.
  if (positionSaving.value) return
  // One mutation for whatever changed: three separate saves could half-succeed
  // and leave the user guessing which half.
  const variables = {}
  if (draftPosition.value) {
    variables.gmsLocation = {
      latitude: draftPosition.value.lat,
      longitude: draftPosition.value.lng,
    }
  }
  if (draftAccuracy.value !== null) variables.gmsPublishLocation = draftAccuracy.value
  if (draftFindable.value !== null) variables.gmsAllowed = draftFindable.value
  if (!Object.keys(variables).length) return

  positionSaving.value = true
  try {
    await saveLocation(variables)
    if (variables.gmsLocation) {
      userLocation.value = { ...draftPosition.value }
      store.setUserLocation(variables.gmsLocation)
      hasPosition.value = true
    }
    if (variables.gmsPublishLocation) store.setGmsPublishLocation(variables.gmsPublishLocation)
    if (variables.gmsAllowed !== undefined) store.setGmsAllowed(variables.gmsAllowed)
    clearDrafts()
    // What happened, in the sentence the switch itself would have said had it saved on the
    // spot - by what was SENT, since the drafts are gone by now.
    toastSuccess(
      variables.gmsAllowed === true
        ? t('matching.position.findableOn')
        : variables.gmsAllowed === false
          ? t('matching.position.findableOff')
          : t('settings.GMS.location.updateSuccess'),
    )
    // Whoever came here to be shown on the map is on it now, and the map is what they
    // came for. Read after the answer, not before the request: a member who has moved on
    // to another tab in the meantime is no longer asking for it, and one who switched
    // "findable" back off before saving has only saved a home.
    if (showMe.value && mayFind(store)) router.push('/matching/karte')
  } catch (error) {
    // This page does not send findable without a home: the switch holds and save stays off.
    // The rule is the server's all the same, and should the two ever read a home
    // differently, the member gets the sentence rather than the bare code.
    toastError(
      error.message?.includes('GMS_LOCATION_REQUIRED')
        ? t('matching.position.needsHome')
        : error.message,
    )
  } finally {
    positionSaving.value = false
  }
}

// Leaving the tab drops the drafts. There is deliberately no "are you sure":
// the map is torn down with the tab and comes back showing the saved pin, so a
// surviving draft would be a ghost — the button lit for a change nothing shows.
// And the loss it would warn about is the harmless one: what is saved stays put.
// A guard that fires next to the point is worse than none — it teaches people to
// click dialogs away, and the save confirmation is the one that must land.
watch(tab, (next) => {
  if (next === 'position') return
  clearDrafts()
  // And the question about saving them, should it be standing (the browser's back button
  // gets here with the window open): its button names a step, and with the drafts gone it
  // would do nothing.
  showSaveConfirm.value = false
})

// --- Find-map access dialog ---
const showFind = ref(false)
// The button follows the saved view: come back to the list and it invites you back
// to the list, not the map. Read once — the mode is set over on the map page, and
// this page mounts fresh when you return, so a plain read is enough.
// Keyed by the member, like everything the map remembers since 10.09.2026 -- reading the
// flat key here would show this member the look the PREVIOUS one left on the device, and
// it is the second reader of that key, which is exactly how such a change goes half done.
function readMapMode() {
  const prefix = mapPrefPrefix(store.gradidoID)
  if (!prefix) return 'karte'
  try {
    const raw = window.localStorage?.getItem(`${prefix}mode`)
    return raw ? JSON.parse(raw) : 'karte'
  } catch {
    return 'karte'
  }
}
const findList = readMapMode() === 'liste'
// The same rule the router guard applies, from the same module and the same source: the
// store, which the handler above keeps in step with the server. Restating it here as
// `gmsAllowed && hasPosition` was how the button and the gate came to disagree.
const findHasAccess = computed(() => mayFind(store))
function openFind() {
  // The button is disabled until then; this is the second lock, for anything that
  // reaches the handler another way. We cannot say "you have no position" while we
  // do not know.
  if (!userLocationLoaded.value) return
  if (findHasAccess.value) {
    router.push('/matching/karte')
    return
  }
  showFind.value = true
}
function showMeFromFind() {
  showFind.value = false
  // Here with the yes in the address already, the address has nowhere to go, so the arrival
  // above does not run a second time - and the member may have switched it back off since.
  // The button says it shows them on the map; it does what the arrival would have done.
  if (showMe.value) onPickFindable(true)
  else router.push(SHOW_ME_ON_THE_MAP)
}
</script>

<style scoped>
/* Only Matching-specific additions here — everything else comes from the design
   system (buttons: variant="gradido"/"secondary"; cards: app-box-shadow +
   gradido-border-radius; inputs: .form-control/.form-select; spacing/colors:
   Bootstrap utilities). */
.matching-page {
  /* The text colour of the page's mode (_design-tokens.scss): #383838 in light, as it was,
     and the light one in dark. It stood here as the light value alone, so every text that
     stands on the page without a colour of its own was dark on the dark ground -- each
     one patched where it showed (gradido-template-dark.scss), and the next one not. */
  color: var(--text);
}

/* The two buttons of a window whose second one names a step: behind the find button, and
   where coming onto the map or leaving it is confirmed. "Show me on the map" is longer than
   the "to my home" it replaced, and on a phone the two no longer fit on one row (measured at
   390px: buttons of 92 and 317px in a window of 374). A footer that wraps the ordinary way then puts "later" on a row
   of its own ABOVE the way on. wrap-reverse stacks the rows from the bottom instead, so the
   second button -- the way on -- stands on top, and where both fit nothing changes.

   An element of this page and not a class on the footer: the window teleports, and the
   footer is the library's own element, which a scoped rule does not reach. */
.window-buttons {
  display: flex;
  flex: 1 1 0%;
  flex-wrap: wrap-reverse;
  justify-content: flex-end;
  gap: 0.5rem;
  min-width: 0;
}

/* The house button stands 50px in from each side. Beside "cancel" in a window 500px wide
   that is 17px more than a row holds for the longest pair, German "Abbrechen" and "Mich von
   der Karte nehmen" (126 + 8 + 335 in 452, measured) - so in the language most members read,
   the two stood in two rows on a desk as well. With 2rem at each side they share the row
   from 500px of screen upwards in all ten languages; a phone stacks them. */
.window-buttons :deep(.btn-gradido) {
  padding-right: 2rem !important;
  padding-left: 2rem !important;
}

/* On a row of its own the long label still breaks in two on a narrow phone. Below 400px the
   button gets the 1rem the tile on the overview gives the same button
   (MatchingTile.vue). */
@media (width < 400px) {
  .window-buttons :deep(.btn-gradido) {
    padding-right: 1rem !important;
    padding-left: 1rem !important;
  }
}

/* Find-map jump-off button (header, top-right of the content column) */
.find-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #178d81;
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 11px 20px;
  cursor: pointer;
}

.find-btn:hover {
  background: #0f6e56;
}

.find-btn-icon {
  font-size: 26px;
}

.find-btn-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  text-align: left;
}

.find-btn-title {
  font-weight: 700;
  font-size: 16px;
}

.find-btn-sub {
  font-size: 12.5px;
  color: rgb(255 255 255 / 85%);
}

/* Tab bar — same look as NavContributions (grey, active = teal) */
.matching-nav {
  background-color: #d1d1d1;
  padding: 4px;
}

.matching-nav-btn {
  flex: 1;
  color: #000 !important;
  font-size: 14px;
  text-decoration: none;
  border-radius: 25px;
}

.matching-nav-btn.is-active {
  background-color: #178d81;
  color: #fff !important;
  font-weight: 700;
}

/* keep a multi-word tab label together; it wraps below the icon as a unit */
.matching-nav-label {
  white-space: nowrap;
}

/* ⛔ On a phone the word goes under the icon in all three tabs, not only where it happens
   not to fit. Left to wrap on its own, each tab decided alone: at 375px "Zuhause" stood
   beside its icon while "Einträge" and "Über mich" stood under theirs, and before the page
   edge moved to 6px (App.vue) the same happened at 430px. Another language only moves the
   width where it happens, so the rule is not a width at which words fit. From sm up each
   tab is 185px or wider, and there the longest labels -- French and Greek, fifteen
   letters -- were measured beside their icons. */
@media (width <= 575.98px) {
  .matching-nav-label {
    display: block;
  }
}

/* "New entry" — the house's outlined button, so it reads as a button on the empty page
   too. Only the layout of icon and word is set here; colours come with the variant. */
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}

/* Entry-type colours — the three channel colours, kept in sync with LABEL_COLORS
   in components/Matching/displayCore.js (interesse #ff0000 · angebot emerald
   #10b981 · gesuch #4658ff). Red and blue vibrant; the green is emerald so it
   parts from the red for red-green colour vision. Where a white icon or label
   sits ON the green (the avatar, the selected button), the green is one step
   darker (#059669) so the white keeps its contrast — the dots stay #10b981. */
.entry-avatar {
  width: 64px;
  height: 64px;
  color: #fff;
  font-size: 28px;
}

/* The big avatar icon already carries the type, so the type word is a small
   label and the entry itself (the summary) is the heading that stands out. */
.entry-type {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.entry-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.25;
}

/* Inline sentence in the new-entry modal: a neutral prefix ("Ich suche") sits
   directly before the input. The prefix inherits var(--text) so it flips with
   light/dark — the modal teleports onto <body>, which carries the dark tokens. */
.entry-prefix {
  color: var(--text);
  white-space: nowrap;
  font-size: 15px;
}

.entry-sentence .form-control {
  flex: 1 1 auto;
  min-width: 0;
}

.type-interesse {
  background: #f00;
}

.type-angebot {
  background: #059669;
}

.type-gesuch {
  background: #4658ff;
}

/* Type-choice buttons: unselected = pale tint with black text/icon;
   selected = full color with white text/icon and a ring */
.type-choice-btn {
  /* Each takes what its word needs and an equal share of the rest; the sentence start
     below the word wraps and never widens its button. The longest word decides here, and
     in some languages it is long ("Предложение"): an equal third cannot hold it on a
     phone, measured at 320 to 390 px in all ten. */
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  border-radius: 22px;
  color: #383838 !important;
  font-size: 15px;
  padding: 12px 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.type-choice-btn.type-interesse {
  background: #ffd6d6;
}

.type-choice-btn.type-angebot {
  background: #d1f0e5;
}

.type-choice-btn.type-gesuch {
  background: #dce0ff;
}

.type-choice-btn svg {
  font-size: 22px;
}

/* The sentence this kind starts, under its name. Wraps inside its third. */
.type-choice-starts {
  /* Takes the width the word gave the button, and asks for none of its own. */
  width: 0;
  min-width: 100%;
  font-size: 12px;
  line-height: 1.25;
  font-weight: 400;
  overflow-wrap: anywhere;
}

/* The last resort on a screen too narrow for the three words side by side: the word
   breaks inside its button instead of running into its neighbour. */
.type-choice-word {
  max-width: 100%;
  overflow-wrap: anywhere;
}

@media (width <= 575.98px) {
  .type-choice-btn {
    padding-inline: 4px;
  }
}

@media (width <= 359.98px) {
  .type-choice-btn {
    font-size: 13px;
  }
}

.type-choice-btn.is-sel {
  color: #fff !important;
  box-shadow: 0 0 0 3px rgb(0 0 0 / 18%);
  font-weight: 600;
}

.type-choice-btn.is-sel.type-interesse {
  background: #f00;
}

.type-choice-btn.is-sel.type-angebot {
  background: #059669;
}

.type-choice-btn.is-sel.type-gesuch {
  background: #4658ff;
}

/* small status badges on an entry */
.badge-soft {
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 20px;
  background: #f0f1ee;
  color: #5f5f5a;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.details-box {
  background: #f7f8f6;
  font-size: 14px;
  color: #55554f;
  white-space: pre-wrap;
}

/* placeholder so the action row keeps 4 fixed columns when an entry has no details */
.no-details {
  color: #a8a8a2;
  font-style: italic;
}

/* let textareas grow to their rows — the design system forces .form-control to 50px */
.matching-textarea {
  height: auto;
}

.min-w-0 {
  min-width: 0;
}
</style>
