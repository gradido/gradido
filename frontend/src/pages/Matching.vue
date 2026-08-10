<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="matching-page mt--3">
    <!-- Jump-off to the find map. Shown on every tab. Access needs an active map
         presence (position set AND visible); otherwise the click guides to Position. -->
    <div class="matching-header d-flex justify-content-end mx-lg-5 mb-3">
      <button type="button" class="find-btn" @click="openFind">
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
      <template v-if="entries.length">
        <div class="d-flex align-items-center justify-content-between mb-3 mx-2">
          <span class="small text-muted">
            {{
              $t('matching.entries.count', {
                total: entries.length,
                live: liveCount,
                paused: entries.length - liveCount,
              })
            }}
          </span>
          <button type="button" class="btn-add" @click="openNew()">
            <i-bi-plus-lg />
            {{ $t('matching.entries.new') }}
          </button>
        </div>

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

      <div v-else class="text-center text-muted py-5">
        <i-bi-hearts class="empty-icon" />
        <p class="mt-3 mb-3">
          <strong>{{ $t('matching.entries.emptyTitle') }}</strong>
          <br />
          {{ $t('matching.entries.emptyText') }}
        </p>
        <button type="button" class="btn-add" @click="openNew()">
          <i-bi-plus-lg />
          {{ $t('matching.entries.new') }}
        </button>
      </div>
    </div>

    <!-- About -->
    <div v-if="tab === 'about'" class="mx-2">
      <label class="fw-bold mb-2 d-block">{{ $t('matching.about.label') }}</label>
      <textarea
        v-model="aboutMe"
        class="form-control matching-textarea"
        rows="10"
        :placeholder="$t('matching.about.placeholder')"
      ></textarea>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <span class="small text-muted">
          {{ $t('matching.about.counter', { count: aboutMe.length }) }}
        </span>
        <BButton variant="gradido" @click="saveAbout">{{ $t('matching.save') }}</BButton>
      </div>
    </div>

    <!-- Position -->
    <div v-if="tab === 'position'" class="mx-2">
      <p class="small text-muted ps-2">{{ $t('matching.position.intro') }}</p>

      <!-- Inline map: address search (lupe) + draggable marker, reused from the
           settings page. Coordinates readout hidden to keep the map compact.
           Dragging only remembers — a map is easy to touch by accident, and a
           stray touch must not move where you live. Saving is the button below. -->
      <div class="bg-white app-box-shadow gradido-border-radius p-2 my-3">
        <UserLocationMap
          v-if="userLocationLoaded"
          :user-marker-coords="userLocation"
          :community-marker-coords="communityLocation"
          :show-coordinates="false"
          height="320px"
          user-icon="home"
          @update:userPosition="onPickPosition"
        />
      </div>

      <!-- Accuracy — right-aligned below the map (self-explanatory: "exact" /
           "approximate", so no label needed). Deferred like everything here. -->
      <div class="d-flex justify-content-end mt-3">
        <UserGMSLocationFormat
          defer
          :exact-toast="$t('matching.position.accuracyExact')"
          :approximate-toast="$t('matching.position.accuracyApprox')"
          @gms-publish-location="onPickAccuracy"
        />
      </div>

      <!-- Findable toggle — title on the switch's line, hint below as explanation -->
      <div class="border-top mt-4 pt-3">
        <div class="d-flex align-items-center justify-content-end gap-3">
          <span class="fw-bold">{{ $t('matching.position.findable') }}</span>
          <UserSettingsSwitch
            defer
            :initial-value="store.state.gmsAllowed"
            attr-name="gmsAllowed"
            :enabled-text="$t('matching.position.findableOn')"
            :disabled-text="$t('matching.position.findableOff')"
            @value-changed="onPickFindable"
          />
        </div>
        <div class="small text-muted text-end mt-1">
          {{ $t('matching.position.findableHint') }}
        </div>
      </div>

      <!-- Nothing on this tab reaches the server until this is pressed. -->
      <div class="d-flex justify-content-end align-items-center gap-3 mt-4">
        <span v-if="positionDirty" class="small text-muted">
          {{ $t('matching.position.unsaved') }}
        </span>
        <BButton variant="gradido" :disabled="!positionDirty" @click="showSaveConfirm = true">
          {{ $t('matching.save') }}
        </BButton>
      </div>
    </div>

    <!-- Popup: new entry -->
    <BModal v-model="showNew" centered>
      <template #title>
        <span style="font-size: 18px">
          {{ editUuid ? $t('matching.entries.edit') : $t('matching.entries.new') }}
        </span>
      </template>
      <template #default>
        <div class="d-flex gap-2 mb-3">
          <button
            v-for="ty in types"
            :key="ty.key"
            type="button"
            class="type-choice-btn flex-fill"
            :class="[`type-${ty.key}`, { 'is-sel': newType === ty.key }]"
            @click="newType = ty.key"
          >
            <i-bi-heart-fill v-if="ty.key === 'interesse'" />
            <i-bi-box-seam v-else-if="ty.key === 'angebot'" />
            <i-bi-search v-else />
            <div>{{ $t(`matching.type.${ty.key}.word`) }}</div>
          </button>
        </div>

        <label class="small fw-bold d-block mb-1">
          {{ $t('matching.new.completeSentence') }}
        </label>
        <div class="entry-sentence d-flex align-items-center gap-2">
          <span class="entry-prefix">{{ $t(`matching.type.${newType}.prefix`) }}</span>
          <input
            v-model="newSummary"
            class="form-control"
            :placeholder="$t(`matching.type.${newType}.placeholder`)"
          />
        </div>

        <div class="mt-3">
          <label class="small fw-bold d-block mb-1">{{ $t('matching.new.detailsHeading') }}</label>
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
      </template>
      <template #footer>
        <BButton variant="secondary" @click="showNew = false">
          {{ $t('matching.new.cancel') }}
        </BButton>
        <BButton
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
        <BButton variant="secondary" @click="showFind = false">
          {{ $t('matching.find.later') }}
        </BButton>
        <BButton v-if="tab === 'position'" variant="gradido" @click="showFind = false">
          {{ $t('matching.find.understood') }}
        </BButton>
        <BButton v-else variant="gradido" @click="goPositionFromFind">
          {{ $t('matching.find.toPosition') }}
        </BButton>
      </template>
    </BModal>

    <!-- Saving your own whereabouts is worth one deliberate breath. -->
    <BModal v-model="showSaveConfirm" centered>
      <template #title>
        <span style="font-size: 18px">{{ $t('matching.position.saveTitle') }}</span>
      </template>
      <template #default>
        <p class="mb-0">{{ $t('matching.position.saveText') }}</p>
      </template>
      <template #footer>
        <BButton variant="secondary" @click="showSaveConfirm = false">
          {{ $t('matching.position.cancel') }}
        </BButton>
        <BButton variant="gradido" @click="confirmSavePosition">
          {{ $t('matching.save') }}
        </BButton>
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
import { useStore } from 'vuex'
import { useAppToast } from '@/composables/useToast'
import { useEntryDraft } from '@/composables/useEntryDraft'
import {
  createMatchingEntry,
  deleteMatchingEntry,
  setMatchingEntryActive,
  updateMatchingEntry,
  updateUserInfos,
} from '@/graphql/mutations'
import { listMatchingEntries, userLocationQuery, verifyLogin } from '@/graphql/queries'
import { displayType, entryType } from '@/components/Matching/displayCore'
import UserGMSLocationFormat from '@/components/UserSettings/UserGMSLocationFormat'
import UserLocationMap from '@/components/UserSettings/UserLocationMap'
import UserSettingsSwitch from '@/components/UserSettings/UserSettingsSwitch'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useStore()
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
const enabled = computed(() => !!store.state.gradidoID)

// --- Entries: load from the backend, map onto the UI shape (open is client-only) ---
const entries = ref([])
const {
  refetch: refetchEntries,
  onResult: onEntries,
  onError: onEntriesError,
} = useQuery(listMatchingEntries, null, { fetchPolicy: 'cache-and-network', enabled })
onEntries(({ data }) => {
  if (!data?.listMatchingEntries) return
  entries.value = data.listMatchingEntries.map((e) => ({
    uuid: e.uuid,
    type: displayType(e.matchingType),
    summary: e.summary,
    details: e.details || '',
    active: e.active,
    remote: e.remote,
    open: false,
    date: formatDate(e.createdAt),
  }))
})
onEntriesError((error) => toastError(error.message))

const liveCount = computed(() => entries.value.filter((e) => e.active).length)

const { mutate: createEntry } = useMutation(createMatchingEntry)
const { mutate: updateEntry } = useMutation(updateMatchingEntry)
const { mutate: setEntryActive } = useMutation(setMatchingEntryActive)
const { mutate: removeEntry } = useMutation(deleteMatchingEntry)

// --- New / edit entry modal ---
const entryDraft = useEntryDraft()
const showNew = ref(false)
const editUuid = ref(null)
const newType = ref('interesse')
const newSummary = ref('')
const newDetails = ref('')
const newRemote = ref(false)

function openNew({ summary = '', details = '', matchingType = 'interesse' } = {}) {
  editUuid.value = null
  newType.value = matchingType
  newSummary.value = summary
  // Carried over from a typed search when there was one. The member wrote these to
  // sharpen that search; a stored entry is judged on the same words, so asking again
  // would be asking them to repeat themselves.
  newDetails.value = details
  newRemote.value = false
  showNew.value = true
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
  if (draft) openNew(draft)
})
function openEdit(e) {
  editUuid.value = e.uuid
  newType.value = e.type
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
  try {
    if (editUuid.value) {
      await updateEntry({ uuid: editUuid.value, input })
    } else {
      await createEntry({ input })
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
  try {
    await removeEntry({ uuid: e.uuid })
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
onUser(({ data }) => {
  if (data?.verifyLogin) aboutMe.value = data.verifyLogin.aboutMe || ''
})
const { mutate: saveUserInfos } = useMutation(updateUserInfos)
async function saveAbout() {
  try {
    await saveUserInfos({ aboutMe: aboutMe.value })
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
  communityLocation.value = {
    lat: loc.communityLocation.latitude,
    lng: loc.communityLocation.longitude,
  }
  hasPosition.value = Boolean(loc.userLocation)
  userLocation.value = {
    lat: loc.userLocation?.latitude ?? communityLocation.value.lat,
    lng: loc.userLocation?.longitude ?? communityLocation.value.lng,
  }
  userLocationLoaded.value = true
})
onUserLocationError((error) => toastError(error.message))

// The pin auto-saves on move (consistent with the other self-saving controls).
// The map echoes its current position on load/remount, so skip saves that match
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

function onPickPosition(coords) {
  const cur = userLocation.value
  if (cur && Math.abs(coords.lat - cur.lat) < 1e-7 && Math.abs(coords.lng - cur.lng) < 1e-7) {
    return
  }
  draftPosition.value = { lat: coords.lat, lng: coords.lng }
}
function onPickAccuracy(value) {
  draftAccuracy.value = value === store.state.gmsPublishLocation ? null : value
}
function onPickFindable(value) {
  draftFindable.value = value === Boolean(store.state.gmsAllowed) ? null : value
}

function clearDrafts() {
  draftPosition.value = null
  draftAccuracy.value = null
  draftFindable.value = null
}

const showSaveConfirm = ref(false)

async function confirmSavePosition() {
  showSaveConfirm.value = false
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

  try {
    await saveLocation(variables)
    if (variables.gmsLocation) {
      userLocation.value = { ...draftPosition.value }
      store.commit('userLocation', variables.gmsLocation)
      hasPosition.value = true
    }
    if (variables.gmsPublishLocation)
      store.commit('gmsPublishLocation', variables.gmsPublishLocation)
    if (variables.gmsAllowed !== undefined) store.commit('gmsAllowed', variables.gmsAllowed)
    clearDrafts()
    toastSuccess(t('settings.GMS.location.updateSuccess'))
  } catch (error) {
    toastError(error.message)
  }
}

// Leaving the tab drops the drafts. There is deliberately no "are you sure":
// the map is torn down with the tab and comes back showing the saved pin, so a
// surviving draft would be a ghost — the button lit for a change nothing shows.
// And the loss it would warn about is the harmless one: what is saved stays put.
// A guard that fires next to the point is worse than none — it teaches people to
// click dialogs away, and the save confirmation is the one that must land.
watch(tab, (next) => {
  if (next !== 'position') clearDrafts()
})

// --- Find-map access dialog ---
const showFind = ref(false)
// The button follows the saved view: come back to the list and it invites you back
// to the list, not the map. Read once — the mode is set over on the map page, and
// this page mounts fresh when you return, so a plain read is enough.
function readMapMode() {
  try {
    const raw = window.localStorage?.getItem('pref.gms.map.mode')
    return raw ? JSON.parse(raw) : 'karte'
  } catch {
    return 'karte'
  }
}
const findList = readMapMode() === 'liste'
const findHasAccess = computed(() => Boolean(store.state.gmsAllowed) && hasPosition.value)
function openFind() {
  if (findHasAccess.value) {
    router.push('/matching/karte')
    return
  }
  showFind.value = true
}
function goPositionFromFind() {
  showFind.value = false
  goTab('position')
}
</script>

<style scoped>
/* Only Matching-specific additions here — everything else comes from the design
   system (buttons: variant="gradido"/"secondary"; cards: app-box-shadow +
   gradido-border-radius; inputs: .form-control/.form-select; spacing/colors:
   Bootstrap utilities). */
.matching-page {
  color: #383838;
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

/* "New entry" — subtle grey text action (not a CTA) */
.btn-add {
  border: none;
  background: none;
  color: #5f5f5a;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 4px;
  cursor: pointer;
}

.btn-add:hover {
  color: #383838;
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

.empty-icon {
  font-size: 36px;
  color: #c9ccc6;
}

.min-w-0 {
  min-width: 0;
}
</style>
