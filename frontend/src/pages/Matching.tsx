// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BCol, BFormCheckbox, BModal, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onMounted, ref, type VNode, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { displayType, entryType } from '@/components/Matching/displayCore'
import { UserGMSLocationFormat } from '@/components/UserSettings/UserGMSLocationFormat'
import { UserLocationMap } from '@/components/UserSettings/UserLocationMap'
import { UserSettingsSwitch } from '@/components/UserSettings/UserSettingsSwitch'
import { type EntryDraft, useEntryDraft } from '@/composables/useEntryDraft'
import { eventLinkUnderway } from '@/composables/useEventMatchingArrival'
import { rememberOwnMatchingEntries } from '@/composables/useOwnMatchingEntries'
import { useAppToast } from '@/composables/useToast'
import {
  acceptEventMatchingEntry,
  createMatchingEntry,
  deleteMatchingEntry,
  setMatchingEntryActive,
  updateMatchingEntry,
  updateUserInfos,
} from '@/graphql/mutations'
import { listMatchingEntries, userLocationQuery, verifyLogin } from '@/graphql/queries'
import { useWalletStore } from '@/store/useWalletStore'
import {
  configuredCommunityPoint,
  hasPosition as isPositionSet,
  mayFind,
} from '@/utils/matchingPosition'
import { mapPrefPrefix } from '@/utils/matchingPrefs'
import { asksForNewEntry } from '@/utils/newMatchingEntry'
import { SHOW_ME_ON_THE_MAP, saidShowMe } from '@/utils/showMeOnTheMap'
import IBiBoxSeam from '~icons/bi/box-seam'
import IBiCardList from '~icons/bi/card-list'
import IBiChevronDown from '~icons/bi/chevron-down'
import IBiChevronUp from '~icons/bi/chevron-up'
import IBiGlobe2 from '~icons/bi/globe2'
import IBiHeartFill from '~icons/bi/heart-fill'
import IBiHouseHeart from '~icons/bi/house-heart'
import IBiListUl from '~icons/bi/list-ul'
import IBiMap from '~icons/bi/map'
import IBiPause from '~icons/bi/pause'
import IBiPauseCircle from '~icons/bi/pause-circle'
import IBiPencil from '~icons/bi/pencil'
import IBiPerson from '~icons/bi/person'
import IBiPlay from '~icons/bi/play'
import IBiPlusLg from '~icons/bi/plus-lg'
import IBiSearch from '~icons/bi/search'
import IBiTrash from '~icons/bi/trash'
import classes from './Matching.module.scss'

type Point = { lat: number; lng: number }
type Location = { latitude: number; longitude: number }

/** An entry as this page shows it; `open` is client-only. */
type Entry = {
  uuid: string
  type: string
  summary: string
  details: string
  active: boolean
  remote: boolean
  open: boolean
  date: string
}

/** What a server's refusal carries, as far as this page reads it. */
type Refusal = {
  networkError?: { statusCode?: number } | null
  graphQLErrors?: { message?: string }[]
  message?: string
}

const TYPES = [{ key: 'interesse' }, { key: 'angebot' }, { key: 'gesuch' }]

const typeIcon = (key: string) =>
  key === 'interesse' ? <IBiHeartFill /> : key === 'angebot' ? <IBiBoxSeam /> : <IBiSearch />

export const Matching = defineComponent({
  name: 'Matching',
  setup() {
    const { t, locale } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const store = useWalletStore()
    const { toastSuccess, toastError } = useAppToast()

    // The active tab is driven by the route param (/matching/:tab) so the
    // right-hand explanation column (MatchingTemplate) can switch in sync
    // via $route.params.tab.
    const tab = computed(() => (route.params.tab as string) || 'entries')
    const goTab = (name: string) => {
      if (tab.value !== name) {
        router.push(`/matching/${name}`)
      }
    }

    const formatDate = (iso: string | null) =>
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
    const entries = ref<Entry[]>([])
    const entriesLoaded = ref(false)
    const {
      refetch: refetchEntries,
      onResult: onEntries,
      onError: onEntriesError,
    } = useQuery(listMatchingEntries, null, { fetchPolicy: 'cache-and-network', enabled })
    onEntries(({ data }) => {
      if (!data?.listMatchingEntries) {
        return
      }
      // open is client-only: it holds which entry the member is reading right now.
      // Saving, pausing or deleting any entry refetches the whole list, so rebuilding
      // it blind would close an entry nobody touched, under their finger. Carry the
      // state over per entry instead; undefined means the entry is new to us, which
      // is the only case that starts closed.
      const openBefore = new Map(entries.value.map((e) => [e.uuid, e.open]))
      entries.value = data.listMatchingEntries.map(
        (e: {
          uuid: string
          matchingType: string
          summary: string
          details: string | null
          active: boolean
          remote: boolean
          createdAt: string | null
        }) => ({
          uuid: e.uuid,
          type: displayType(e.matchingType),
          summary: e.summary,
          details: e.details || '',
          active: e.active,
          remote: e.remote,
          open: openBefore.get(e.uuid) ?? false,
          date: formatDate(e.createdAt),
        }),
      )
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
    const tellEntriesChanged = (member: string | null, by: number) => {
      if (!entriesLoaded.value) {
        return
      }
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
    const editUuid = ref<string | null>(null)
    // null until the member picks one. A search kept from the map and an entry being edited
    // bring theirs along.
    const newType = ref<string | null>(null)
    // Whether this opening began with the choice. Set when the form opens and left alone
    // until the next one, so picking a kind does not change where the window stands.
    const choiceFirst = ref(false)
    const newSummary = ref('')
    const newDetails = ref('')
    const newRemote = ref(false)

    function openNew({
      summary = '',
      details = '',
      matchingType = null,
      remote = false,
    }: {
      summary?: string
      details?: string
      matchingType?: string | null
      remote?: boolean
    } = {}) {
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
     * The entry an event link offers (`/project?interest=…`), handed over by the link's guard or
     * the sign-in (utils/eventMatchingLink, `unlessThere`): made at once, without a form -- the
     * tap on the link is the yes (KA-014). The server compares it with the member's own entries
     * (`acceptEventMatchingEntry`): where the member has that sentence already, live or paused,
     * nothing is made, and this page says nothing either. Whoever taps the link in every mail of
     * a congress is not told each time what they know.
     *
     * Made, the entry is said in a toast with its sentence, as the list shows it, and the list is
     * fetched again -- the entry stands in it, to be paused or deleted like any other. And the
     * invitation onto the map follows, for a member who does not stand on it yet (KA-015,
     * components/EventMatchingHomeInvitation): the page says here that the link made the entry,
     * and until the answer is in, the windows after that invitation wait
     * (useEventMatchingArrival).
     *
     * Refused, nothing is said where the member has a reason told elsewhere: no connection, or an
     * account whose address waits for its confirmation (401 -- the reminder says what to do).
     * Only a refusal nobody expects gets the usual red toast.
     *
     * ⛔ The answer comes a moment after the page, and the member may have signed out by then:
     * the toast and the count on the device belong to who opened the link, and only to them.
     */
    // No connection: the request never reached a server, so there is no status. A server that
    // answered with an error status (a 502 while it restarts, a 500) is not "no connection".
    const quietRefusal = (error: Refusal | null | undefined) =>
      Boolean(error?.networkError && !error.networkError.statusCode) ||
      (error?.graphQLErrors ?? []).some((e) => e?.message === '401 Unauthorized')
    async function acceptEventEntry(offered: EntryDraft) {
      const member = store.gradidoID as string | null
      const answered = eventLinkUnderway(member)
      let accepted: { created: boolean; entry: { uuid: string; summary: string } } | undefined
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
        if (quietRefusal(error as Refusal) || store.gradidoID !== member) {
          return
        }
        toastError((error as Error).message)
        // The server stores the entry before it hands it to the GMS, and a refusal can come
        // from that second step: the list says what is there (coderabbit, #4149).
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
      // Told only where the list does not hold it yet: a list that came after the entry was
      // made counts it already.
      const made = accepted.entry.uuid
      if (!entries.value.some((e) => e.uuid === made)) {
        tellEntriesChanged(member, 1)
      }
      try {
        await refetchEntries()
      } catch (error) {
        if (store.gradidoID === member) {
          toastError((error as Error).message)
        }
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
      // Or the overview's matching tile sent the member to write an entry
      // (utils/newMatchingEntry). The wish is read once and taken out of the address at once,
      // as the contacts page takes out the conversation it is asked for: a reload, or the way
      // back to this tab, must not open the form again over what the member closed. A kept
      // search comes first -- it brings words along, and there is one form.
      //
      // Unlike that conversation the form does not line up with the windows of the first
      // logins (useFirstLoginWindow). From the tile nobody gets here with one of them due: it
      // would be lying over the overview. Only this address opened afresh -- in a new tab, or
      // after a sign-in the tap ran into -- by a member whose address is still unconfirmed
      // meets the reminder and the form together.
      if (!asksForNewEntry(route)) {
        return
      }
      const { new: _new, ...rest } = route.query
      router.replace({ query: rest })
      if (!draft) {
        openNew()
      }
    })
    function openEdit(e: Entry) {
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
      const member = store.gradidoID as string | null
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
        toastError((error as Error).message)
      }
    }
    async function toggleActive(e: Entry) {
      try {
        await setEntryActive({ uuid: e.uuid, active: !e.active })
        await refetchEntries()
      } catch (error) {
        toastError((error as Error).message)
      }
    }
    // --- Delete confirmation modal (replaces the browser confirm dialog) ---
    const showDelete = ref(false)
    const delEntry = ref<Entry | null>(null)
    function del(e: Entry) {
      delEntry.value = e
      showDelete.value = true
    }
    async function confirmDelete() {
      const e = delEntry.value
      if (!e) {
        return
      }
      showDelete.value = false
      const member = store.gradidoID as string | null
      try {
        await removeEntry({ uuid: e.uuid })
        tellEntriesChanged(member, -1)
        await refetchEntries()
      } catch (error) {
        toastError((error as Error).message)
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
    let aboutMeFromServer: string | null = null
    onUser(({ data }) => {
      if (!data?.verifyLogin) {
        return
      }
      const fromServer: string = data.verifyLogin.aboutMe || ''
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
        toastError((error as Error).message)
      }
    }

    // --- Position tab: inline map + accuracy + findable, reusing the settings components ---
    const { mutate: saveLocation } = useMutation(updateUserInfos)
    const userLocation = ref<Point>({ lat: 0, lng: 0 })
    const communityLocation = ref<Point>({ lat: 0, lng: 0 })
    const userLocationLoaded = ref(false)
    const hasPosition = ref(false)

    const { onResult: onUserLocation, onError: onUserLocationError } = useQuery(
      userLocationQuery,
      {},
      { fetchPolicy: 'network-only', enabled },
    )
    onUserLocation(({ data }) => {
      const loc: { communityLocation: Location | null; userLocation: Location | null } | null =
        data?.userLocation
      if (!loc) {
        return
      }
      // The community's point is nullable too: an instance whose admin never set one must
      // still be able to show this map, because this is the page where a member sets their
      // own position. Fall back to what the build was configured with. It is not drawn on
      // the map (Bernd, 11.09.2026: it only confused); it is where the map opens for a
      // member who has no home on it yet.
      communityLocation.value =
        isPositionSet(loc.communityLocation) && loc.communityLocation
          ? { lat: loc.communityLocation.latitude, lng: loc.communityLocation.longitude }
          : configuredCommunityPoint()
      // Two numbers or nothing. `Boolean(loc.userLocation)` stood here until 09.09.2026, and
      // an account that had never set a position was answered with an empty object -- truthy,
      // so this page told the find button the way was clear and the map opened on nothing.
      hasPosition.value = isPositionSet(loc.userLocation)
      userLocation.value =
        hasPosition.value && loc.userLocation
          ? { lat: loc.userLocation.latitude, lng: loc.userLocation.longitude }
          : { ...communityLocation.value }
      // The router guard in front of the map reads the store, and this is the freshest answer
      // there is -- so it is written back, or the two could disagree. They would: a position
      // set on another device leaves this store copy behind, the button would light up on
      // what the server just said and the guard would send the member straight back on what
      // the store still believes. A button that does nothing, silently.
      //
      // Only when it actually differs. Every change makes store.js serialize the
      // WHOLE store and write it to localStorage, and the store carries the member's avatar
      // as base64 -- so an unconditional set would put a ~12 KB synchronous write behind
      // every answer of a network-only query, to store two floats that did not change.
      const known = store.userLocation as Location | null
      const fresh = hasPosition.value && loc.userLocation ? { ...loc.userLocation } : null
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
    const draftPosition = ref<Point | null>(null)
    const draftAccuracy = ref<string | null>(null)
    const draftFindable = ref<boolean | null>(null)

    const positionDirty = computed(
      () =>
        draftPosition.value !== null ||
        draftAccuracy.value !== null ||
        draftFindable.value !== null,
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

    function onPickPosition(coords: Point) {
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
    function onPickAccuracy(value: string) {
      draftAccuracy.value = value === (store.gmsPublishLocation as string | null) ? null : value
    }
    function onPickFindable(value: boolean) {
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
        if (yes) {
          onPickFindable(true)
        }
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
    const saveTurn = ref<'join' | 'leave' | null>(null)
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

    // Held while a save is under way. What save sends is what the three controls showed when
    // it was pressed, and its answer replaces the drafts - so a pick made in between was
    // measured against the old state and then thrown away with them. A member who switched
    // "findable" back off in that moment was saved as findable all the same and, having
    // arrived with the yes, carried onto the map (coderabbit on #4124). Nothing can be picked
    // until the answer is in.
    //
    // `inert` on the map, the accuracy and the switch, the way the map page holds its map: no
    // dimming for the fraction of a second this usually takes. Not on the save button - the
    // confirm window hands the focus back to it.
    const positionSaving = ref(false)

    async function confirmSavePosition() {
      showSaveConfirm.value = false
      // Confirmed a second time before the first answer: it is on its way already.
      if (positionSaving.value) {
        return
      }
      // One mutation for whatever changed: three separate saves could half-succeed
      // and leave the user guessing which half.
      const variables: {
        gmsLocation?: Location
        gmsPublishLocation?: string
        gmsAllowed?: boolean
      } = {}
      if (draftPosition.value) {
        variables.gmsLocation = {
          latitude: draftPosition.value.lat,
          longitude: draftPosition.value.lng,
        }
      }
      if (draftAccuracy.value !== null) {
        variables.gmsPublishLocation = draftAccuracy.value
      }
      if (draftFindable.value !== null) {
        variables.gmsAllowed = draftFindable.value
      }
      if (!Object.keys(variables).length) {
        return
      }

      positionSaving.value = true
      try {
        await saveLocation(variables)
        if (variables.gmsLocation) {
          userLocation.value = { ...(draftPosition.value as Point) }
          store.setUserLocation(variables.gmsLocation)
          hasPosition.value = true
        }
        if (variables.gmsPublishLocation) {
          store.setGmsPublishLocation(variables.gmsPublishLocation)
        }
        if (variables.gmsAllowed !== undefined) {
          store.setGmsAllowed(variables.gmsAllowed)
        }
        clearDrafts()
        // What happened, in the sentence the switch itself would have said had it saved on
        // the spot - by what was SENT, since the drafts are gone by now.
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
        if (showMe.value && mayFind(store)) {
          router.push('/matching/karte')
        }
      } catch (error) {
        // This page does not send findable without a home: the switch holds and save stays
        // off. The rule is the server's all the same, and should the two ever read a home
        // differently, the member gets the sentence rather than the bare code.
        const message = (error as Error).message
        toastError(
          message?.includes('GMS_LOCATION_REQUIRED') ? t('matching.position.needsHome') : message,
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
      if (next === 'position') {
        return
      }
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
      if (!prefix) {
        return 'karte'
      }
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
      if (!userLocationLoaded.value) {
        return
      }
      if (findHasAccess.value) {
        router.push('/matching/karte')
        return
      }
      showFind.value = true
    }
    function showMeFromFind() {
      showFind.value = false
      // Here with the yes in the address already, the address has nowhere to go, so the
      // arrival above does not run a second time - and the member may have switched it back
      // off since. The button says it shows them on the map; it does what the arrival would
      // have done.
      if (showMe.value) {
        onPickFindable(true)
      } else {
        router.push(SHOW_ME_ON_THE_MAP)
      }
    }

    const modalTitle = (text: string, dataTest?: string) => (
      <span style={{ fontSize: '18px' }} data-test={dataTest}>
        {text}
      </span>
    )

    const entryCard = (e: Entry) => (
      <div
        key={e.uuid}
        class={[
          'bg-white app-box-shadow gradido-border-radius p-3 mb-4',
          { 'opacity-05': !e.active },
        ]}
      >
        <BRow>
          <BCol cols='3' md='2'>
            <div
              class={[
                'entry-avatar rounded-like-card d-flex align-items-center justify-content-center',
                classes['entry-avatar'],
                `type-${e.type}`,
                classes[`type-${e.type}`],
              ]}
            >
              {typeIcon(e.type)}
            </div>
          </BCol>
          <BCol class={['min-w-0', classes['min-w-0']]}>
            <div class='small text-muted'>{e.date}</div>
            <div class={['entry-type', classes['entry-type']]}>
              {t(`matching.type.${e.type}.word`)}
            </div>
            <div class={['entry-title word-break', classes['entry-title']]}>{e.summary}</div>
            <div class='mt-2'>
              {e.remote ? (
                <span class={['badge-soft me-2', classes['badge-soft']]}>
                  <IBiGlobe2 /> {t('matching.entries.remote')}
                </span>
              ) : null}
              {!e.active ? (
                <span class={['badge-soft', classes['badge-soft']]}>
                  <IBiPauseCircle /> {t('matching.entries.pausedBadge')}
                </span>
              ) : null}
            </div>
          </BCol>
        </BRow>
        {e.open && e.details ? (
          <div class={['details-box rounded-20 p-2 mt-3', classes['details-box']]}>{e.details}</div>
        ) : null}
        <BRow class='mt-3 pt-2 border-top text-center small text-muted'>
          {e.details ? (
            <BCol
              class='pointer'
              onClick={() => {
                e.open = !e.open
              }}
            >
              {e.open ? <IBiChevronUp /> : <IBiChevronDown />}
              <div>{t('matching.entries.details')}</div>
            </BCol>
          ) : (
            <BCol
              class={[
                'no-details d-flex align-items-center justify-content-center',
                classes['no-details'],
              ]}
            >
              {t('matching.entries.noDetails')}
            </BCol>
          )}
          <BCol class='pointer' onClick={() => toggleActive(e)}>
            {e.active ? <IBiPause /> : <IBiPlay />}
            <div>{e.active ? t('matching.entries.pause') : t('matching.entries.activate')}</div>
          </BCol>
          <BCol class='pointer' onClick={() => openEdit(e)}>
            <IBiPencil />
            <div>{t('matching.entries.edit')}</div>
          </BCol>
          <BCol class='pointer' onClick={() => del(e)}>
            <IBiTrash />
            <div>{t('matching.entries.delete')}</div>
          </BCol>
        </BRow>
      </div>
    )

    const tabButton = (name: string, icon: () => VNode, label: string) => (
      <BButton
        variant='link'
        class={[
          'matching-nav-btn',
          classes['matching-nav-btn'],
          { 'is-active': tab.value === name },
        ]}
        onClick={() => goTab(name)}
      >
        {icon()}
        <span class={['matching-nav-label', classes['matching-nav-label']]}>{label}</span>
      </BButton>
    )

    return () => (
      <div class={['matching-page', classes['matching-page'], 'mt--3']}>
        {/* Jump-off to the find map. Shown on every tab. Access needs an active map
            presence (position set AND visible); otherwise the click guides to Position. */}
        <div class='matching-header d-flex justify-content-end mx-lg-5 mb-3'>
          {/* Disabled until the location query has answered: until then hasPosition is
              still false for everyone, and the panel behind this button would tell a
              member who does have a pin that they have none. */}
          <button
            type='button'
            class={['find-btn', classes['find-btn']]}
            disabled={!userLocationLoaded.value}
            onClick={openFind}
          >
            {findList ? (
              <IBiListUl class={['find-btn-icon', classes['find-btn-icon']]} />
            ) : (
              <IBiMap class={['find-btn-icon', classes['find-btn-icon']]} />
            )}
            <span class={['find-btn-text', classes['find-btn-text']]}>
              <span class={['find-btn-title', classes['find-btn-title']]}>
                {findList ? t('matching.find.titleList') : t('matching.find.title')}
              </span>
              <span class={['find-btn-sub', classes['find-btn-sub']]}>
                {t('matching.find.subtitle')}
              </span>
            </span>
          </button>
        </div>

        {/* Tab bar (entries / about / position) — same pattern as NavContributions.
            The label sits in its own nowrap span so a two-word label (any language)
            wraps below the icon as a unit instead of breaking between the words. */}
        <div
          class={[
            'matching-nav rounded-26 shadow d-flex justify-content-between mx-lg-5 mb-4',
            classes['matching-nav'],
          ]}
        >
          {tabButton(
            'entries',
            () => (
              <IBiCardList class='me-1' />
            ),
            t('matching.tabs.entries'),
          )}
          {tabButton(
            'about',
            () => (
              <IBiPerson class='me-1' />
            ),
            t('matching.tabs.about'),
          )}
          {tabButton(
            'position',
            () => (
              <IBiHouseHeart class='me-1' />
            ),
            t('matching.tabs.position'),
          )}
        </div>

        {/* Entries */}
        {tab.value === 'entries' ? (
          <div>
            {/* One line for the empty page and the full one: the count says "0" where there is
                nothing, and "new entry" stands where it will stand after the first entry, so
                nobody has to look for it a second time. The count waits for the answer (an
                empty page must not say "0" to a member who has six); the button does not, and
                the line keeps its height either way, so nothing below it moves. */}
            {/* Three numbers, each with a word that goes with ITS number: one entry is
                "1 Eintrag" (the line said "1 Einträge"), and in five of the ten languages the
                word for the live ones is declined as well ("3 entradas · 1 activa"). One
                message can follow one number only, so each part is its own, and `count` is
                the line they stand in. */}
            <div class='d-flex align-items-center justify-content-between mb-3 mx-lg-2 page-text'>
              <span class='small text-muted' data-test='matching-entries-count'>
                {entriesLoaded.value
                  ? t('matching.entries.count', {
                      total: t('matching.entries.countTotal', entries.value.length),
                      live: t('matching.entries.countLive', liveCount.value),
                      paused: t('matching.entries.countPaused', pausedCount.value),
                    })
                  : null}
              </span>
              <BButton
                variant='outline-secondary'
                class={['btn-add', classes['btn-add']]}
                data-test='matching-entries-new'
                onClick={() => openNew()}
              >
                <IBiPlusLg /> {t('matching.entries.new')}
              </BButton>
            </div>

            {entries.value.length ? (
              entries.value.map(entryCard)
            ) : entriesLoaded.value ? (
              <p
                class='text-center text-muted py-5 mb-0 page-text'
                data-test='matching-entries-empty'
              >
                <strong>{t('matching.entries.emptyTitle')}</strong>
                <br /> {t('matching.entries.emptyText')}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* About */}
        {tab.value === 'about' ? (
          <div class='mx-lg-2'>
            <label class='fw-bold mb-2 d-block page-text'>{t('matching.about.label')}</label>
            <textarea
              v-model={aboutMe.value}
              class={['form-control matching-textarea', classes['matching-textarea']]}
              rows='10'
              placeholder={t('matching.about.placeholder')}
            />
            <div class='d-flex justify-content-between align-items-center mt-2 page-text'>
              <span class='small text-muted'>
                {t('matching.about.counter', { count: aboutMe.value.length })}
              </span>
              <BButton variant={'gradido' as ButtonVariant} onClick={saveAbout}>
                {t('matching.save')}
              </BButton>
            </div>
          </div>
        ) : null}

        {/* Position */}
        {tab.value === 'position' ? (
          <div class='mx-lg-2'>
            <p class='small text-muted ps-lg-2 page-text'>{t('matching.position.intro')}</p>

            {/* Inline map: address search (lupe) + draggable house.
                Dragging only remembers — a map is easy to touch by accident, and a
                stray touch must not move where you live. Saving is the button below. */}
            <div
              class='bg-white app-box-shadow gradido-border-radius p-2 my-3'
              inert={positionSaving.value}
              data-test='position-control'
            >
              {userLocationLoaded.value ? (
                <UserLocationMap
                  userMarkerCoords={userLocation.value}
                  height='320px'
                  onUpdate:userPosition={onPickPosition}
                />
              ) : null}
            </div>

            {/* Accuracy — right-aligned below the map (self-explanatory: "exact" /
                "approximate", so no label needed). Deferred like everything here. */}
            <div
              class='d-flex justify-content-end mt-3 page-text'
              inert={positionSaving.value}
              data-test='position-control'
            >
              <UserGMSLocationFormat
                defer
                exactToast={t('matching.position.accuracyExact')}
                approximateToast={t('matching.position.accuracyApprox')}
                onGmsPublishLocation={onPickAccuracy}
              />
            </div>

            {/* Findable toggle — title on the switch's line, hint below as explanation.
                Without a home it is held, and the hint says what is missing. */}
            <div
              class='border-top mt-4 pt-3 page-text'
              inert={positionSaving.value}
              data-test='position-control'
            >
              <div class='d-flex align-items-center justify-content-end gap-3'>
                <span class='fw-bold'>{t('matching.position.findable')}</span>
                <UserSettingsSwitch
                  defer
                  initialValue={findableAfterSave.value}
                  attrName='gmsAllowed'
                  label={t('matching.position.findable')}
                  locked={findableLocked.value}
                  notAllowedText={t('matching.position.needsHome')}
                  enabledText={t('matching.position.findableOn')}
                  disabledText={t('matching.position.findableOff')}
                  onValue-changed={onPickFindable}
                />
              </div>
              <div class='small text-muted text-end mt-1'>
                {homeMissing.value
                  ? t('matching.position.needsHome')
                  : t('matching.position.findableHint')}
              </div>
            </div>

            {/* Nothing on this tab reaches the server until this is pressed. */}
            <div class='d-flex justify-content-end align-items-center gap-3 mt-4 page-text'>
              {positionDirty.value ? (
                <span class='small text-muted'>{t('matching.position.unsaved')}</span>
              ) : null}
              <BButton
                variant={'gradido' as ButtonVariant}
                disabled={!positionDirty.value || findableWithoutHome.value}
                onClick={askToSave}
              >
                {t('matching.save')}
              </BButton>
            </div>
          </div>
        ) : null}

        {/* Popup: new entry */}
        {/* A form that opens on the choice stands at the top of the window, not in its
            middle: a centred dialog moves when it grows, and this one grows by its fields
            the moment a kind is picked -- under the finger that just picked it. */}
        <BModal
          modelValue={showNew.value}
          centered={!choiceFirst.value}
          onUpdate:modelValue={(open: boolean) => {
            showNew.value = open
          }}
          v-slots={{
            title: () =>
              modalTitle(editUuid.value ? t('matching.entries.edit') : t('matching.entries.new')),
            footer: () => (
              <>
                <BButton
                  variant='secondary'
                  onClick={() => {
                    showNew.value = false
                  }}
                >
                  {t('matching.new.cancel')}
                </BButton>
                {newType.value ? (
                  <BButton
                    variant={'gradido' as ButtonVariant}
                    disabled={!newSummary.value.trim() || !newDetails.value.trim()}
                    onClick={save}
                  >
                    {t('matching.save')}
                  </BButton>
                ) : null}
              </>
            ),
          }}
        >
          {/* Nothing is picked for a new entry: with "interest" already lit, the three
              read as a setting that is done, and a first entry became an interest by
              default. The line asks, each button shows the sentence it starts, and the
              fields only come once one is picked. The line keeps its place afterwards
              (invisible), so the buttons stay where they were pressed. */}
          {choiceFirst.value ? (
            <div
              class={['small fw-bold mb-1', { invisible: newType.value }]}
              aria-hidden='true'
              data-test='matching-entry-choose'
            >
              {t('matching.new.choose')}
            </div>
          ) : null}
          <div class='d-flex gap-2 mb-3' role='group' aria-label={t('matching.new.choose')}>
            {TYPES.map((ty) => (
              <button
                key={ty.key}
                type='button'
                class={[
                  'type-choice-btn',
                  classes['type-choice-btn'],
                  `type-${ty.key}`,
                  classes[`type-${ty.key}`],
                  { 'is-sel': newType.value === ty.key },
                ]}
                aria-pressed={newType.value === ty.key}
                onClick={() => {
                  newType.value = ty.key
                }}
              >
                {typeIcon(ty.key)}
                <div class={['type-choice-word', classes['type-choice-word']]}>
                  {t(`matching.type.${ty.key}.word`)}
                </div>
                <div class={['type-choice-starts', classes['type-choice-starts']]}>
                  {t('matching.new.sentenceStart', { start: t(`matching.type.${ty.key}.prefix`) })}
                </div>
              </button>
            ))}
          </div>

          {newType.value ? (
            <>
              <label class='small fw-bold d-block mb-1'>{t('matching.new.completeSentence')}</label>
              <div
                class={[
                  'entry-sentence d-flex align-items-center gap-2',
                  classes['entry-sentence'],
                ]}
              >
                <span class={['entry-prefix', classes['entry-prefix']]}>
                  {t(`matching.type.${newType.value}.prefix`)}
                </span>
                {/* The column behind this is varchar(160) and the resolver passes the
                    value straight through, so a longer sentence would either come back
                    as a raw driver error or be cut off without anyone saying so. */}
                <input
                  v-model={newSummary.value}
                  class='form-control'
                  maxlength='160'
                  placeholder={t(`matching.type.${newType.value}.placeholder`)}
                />
              </div>

              <div class='mt-3'>
                <label class='small fw-bold d-block mb-1'>{t('matching.new.detailsHeading')}</label>
                <textarea
                  v-model={newDetails.value}
                  class={['form-control matching-textarea', classes['matching-textarea']]}
                  rows='5'
                  style={{ height: 'auto' }}
                  placeholder={t(`matching.type.${newType.value}.detailsPlaceholder`)}
                />
              </div>

              <BFormCheckbox
                modelValue={newRemote.value}
                class='mt-3'
                onUpdate:modelValue={(value) => {
                  newRemote.value = value as boolean
                }}
              >
                {t('matching.new.remote')}
              </BFormCheckbox>
              {/* What it now DOES, said where it is set. Since the map has a reach switch,
                  this box is the gate: an entry without it is never found in the wide
                  search, however well it fits. It used to be a label on an entry and
                  nothing more, so nobody had to be told. */}
              <div class='small text-muted ms-4 ps-1'>{t('matching.new.remoteHint')}</div>
            </>
          ) : null}
        </BModal>

        {/* Access gate. Only shown when there is no map presence yet — with one, the
            find button goes straight to the map instead of asking for a click. */}
        <BModal
          modelValue={showFind.value}
          centered
          onUpdate:modelValue={(open: boolean) => {
            showFind.value = open
          }}
          v-slots={{
            title: () => modalTitle(t('matching.find.gateTitle')),
            footer: () => (
              // One row where both fit. Where they do not -- a phone, or a language with
              // longer words -- the way on stands above "later": see .window-buttons.
              <div class={['window-buttons', classes['window-buttons']]}>
                <BButton
                  variant='secondary'
                  data-test='find-gate-later'
                  onClick={() => {
                    showFind.value = false
                  }}
                >
                  {t('matching.find.later')}
                </BButton>
                {/* The button of the tile on the overview, and the same yes: the home tab
                    with "findable" switched on. On the home tab itself it is still the thing
                    to press -- the window closes and the switch below it stands on. */}
                <BButton
                  variant={'gradido' as ButtonVariant}
                  data-test='find-gate-show-me'
                  onClick={showMeFromFind}
                >
                  {t('matching.invitation.go')}
                </BButton>
              </div>
            ),
          }}
        >
          <p class='mb-0'>{t('matching.find.gateText')}</p>
        </BModal>

        {/* Saving your own whereabouts is worth one deliberate breath - and the window says
            what the save does. Coming onto the map and leaving it are not "saving position
            settings": each has its own title, its own sentence and a button that names the
            step, like the button of the invitation (Bernd, 11.10.2026). See saveWords. */}
        <BModal
          modelValue={showSaveConfirm.value}
          centered
          onUpdate:modelValue={(open: boolean) => {
            showSaveConfirm.value = open
          }}
          v-slots={{
            title: () => modalTitle(saveWords.value.title, 'position-save-title'),
            footer: () => (
              // The button that names the step is as long as the one in the window above,
              // and wraps the same way: see .window-buttons.
              <div class={['window-buttons', classes['window-buttons']]}>
                <BButton
                  variant='secondary'
                  data-test='position-save-cancel'
                  onClick={() => {
                    showSaveConfirm.value = false
                  }}
                >
                  {t('matching.position.cancel')}
                </BButton>
                <BButton
                  variant={'gradido' as ButtonVariant}
                  data-test='position-save-confirm'
                  onClick={confirmSavePosition}
                >
                  {saveWords.value.confirm}
                </BButton>
              </div>
            ),
          }}
        >
          <p class='mb-0' data-test='position-save-text'>
            {saveWords.value.text}
          </p>
        </BModal>

        {/* Delete confirmation (replaces the browser confirm dialog) */}
        <BModal
          modelValue={showDelete.value}
          centered
          onUpdate:modelValue={(open: boolean) => {
            showDelete.value = open
          }}
          v-slots={{
            title: () => modalTitle(t('matching.entries.delete')),
            footer: () => (
              <>
                <BButton
                  variant='secondary'
                  onClick={() => {
                    showDelete.value = false
                  }}
                >
                  {t('form.cancel')}
                </BButton>
                <BButton variant={'gradido' as ButtonVariant} onClick={confirmDelete}>
                  {t('matching.entries.delete')}
                </BButton>
              </>
            ),
          }}
        >
          <p class='mb-2'>{t('matching.entries.deleteConfirm')}</p>
          {delEntry.value ? <p class='fw-bold word-break mb-0'>{delEntry.value.summary}</p> : null}
        </BModal>
      </div>
    )
  },
})
