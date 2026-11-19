// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BFormTextarea, BModal, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { I18nText } from '@/components/I18nText'
import { ProjectAccountConfirm } from '@/components/UserSettings/ProjectAccountConfirm'
import { useFilters } from '@/composables/useFilters'
import {
  firstLoginWindowOnScreen,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'
import CONFIG from '@/config'
import {
  firstCreationStatus,
  skipFirstCreation,
  submitFirstCreation,
} from '@/graphql/firstCreation.graphql'
import { declareProjectAccount } from '@/graphql/user.graphql'
import { useWalletStore } from '@/store/useWalletStore'
import {
  FIRST_CREATION_CATEGORIES,
  FIRST_CREATION_CHECK_KEYS,
  FIRST_CREATION_EXCLUSIVE_CHECKS,
  FIRST_CREATION_MAX_ENTRIES,
  FIRST_CREATION_MIN_WORDS,
  FIRST_CREATION_STEMS_VISIBLE,
} from '@/utils/firstCreationCatalog'
import classes from './FirstCreation.module.scss'

/** What the member is writing: `{ id, catalogKey, text }`. */
interface Entry {
  id: number
  catalogKey: string
  text: string
}

/** A category of the catalog and its stems (utils/firstCreationCatalog). */
type Category = (typeof FIRST_CREATION_CATEGORIES)[number]

/** What the window reads of `firstCreationStatus` (graphql/firstCreation.graphql). */
interface Status {
  state: string
  eligible?: boolean | null
  message?: string | null
  entries?: { memo: string }[] | null
  skippedBefore?: boolean | null
  referrerAlias?: string | null
}

/** A field as the window holds it: something that can take the cursor. */
interface Focusable {
  focus?: () => void
}

/**
 * The window a member meets once, on one of their first logins: what good have you already
 * done? They complete sentences, the community reads them, and the hundred Gradido that
 * come back are thanks for something that already happened (ES-002, ES-011).
 *
 * Four screens in one component, because they are four moments of ONE act and the member
 * must not lose what they wrote between them: the catalog, the wait, the ticks and the
 * message — or, where a person has to look first, the review notice (ES-018/019).
 *
 * ⛔ `firstCreationStatus` takes NO arguments, so it lives under a single cache key for
 * every member on this browser. `cache-and-network` here, and the cache emptied on logout
 * (store.js) — both, because either one alone has a hole: the emptying misses a member
 * change that does not run the logout action, and the policy alone would still show the
 * previous answer for the length of one round trip.
 *
 * ⛔ And asked only while the window might still open. The login answer carries where the
 * member stands (`firstCreationStatus` in the store): a settled process, or a member who
 * found the regular path on their own, is a state nothing here can change, so the query
 * stays off for them -- that is every member but the newest, on every visit for the rest
 * of their life here. Not started, armed by the function test, or still running: those ask.
 * The store learns the state only from the login answer and from `applyStatus` below -- so
 * an admin who arms the function test meets the window after signing in again, and the test
 * page says so (settings/FunctionTests.tsx).
 */
export const FirstCreation = defineComponent({
  name: 'FirstCreation',
  props: {
    /**
     * The balance the layout holds, off the query the overview really reads
     * (`transactionsUserCountQuery`, transactions.graphql). Not fetched here: a second query
     * for the same number would leave the header standing on the old one.
     */
    balance: { type: Number, default: 0 },
    /**
     * Bumped by the layout every time that query ANSWERS. It is what makes the number on this
     * screen provably the one from after the booking — see `balanceShown`.
     */
    balanceStamp: { type: Number, default: 0 },
  },
  emits: ['update-transactions'],
  setup(props, { emit, expose }) {
    const store = useWalletStore()
    const filters = useFilters()
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()

    /** The states in which the window still has something to ask the server. */
    const ASKING_STATES: (string | null)[] = [null, 'FORCED', 'FORCED_UNBOOKED', 'SUBMITTED']
    const mightOpen = computed(() => ASKING_STATES.includes(store.firstCreationStatus ?? null))

    const { result, refetch } = useQuery(firstCreationStatus, null, {
      fetchPolicy: 'cache-and-network',
      enabled: mightOpen,
    })
    const { mutate: sendEntries } = useMutation(submitFirstCreation)
    const { mutate: sendSkip } = useMutation(skipFirstCreation)
    const { mutate: sendDeclare } = useMutation(declareProjectAccount)

    /**
     * "Willkommen, Ira!" — the member's own first name, out of the store the login already
     * filled (`login` and `verifyLogin` both carry it). No round trip and no backend change.
     *
     * ⚠️ Without a name it is the nameless form, never "Willkommen, !". The message at the end
     * does the same thing one floor down (`greetingAnonymous` in core).
     */
    const welcome = computed(() => {
      const name = (store.firstName ?? '').trim()
      return name ? t('firstCreation.welcome', { name }) : t('firstCreation.welcomeAnonymous')
    })

    /**
     * Deliberately without a language prefix: gradido.net serves the page in the browser's
     * language on its own, and a `/de/` glued on here would hand a Greek reader the German
     * page. Same rule the rest of our gradido.net links follow.
     */
    const COMMON_GOOD_URL = 'https://gradido.net/gemeinwohl-was-ist-das/'

    const categories = FIRST_CREATION_CATEGORIES
    const checkKeys = FIRST_CREATION_CHECK_KEYS
    const communityName = CONFIG.COMMUNITY_NAME
    /** Mirrors the backend's `MEMO_MAX_CHARS`; the column behind it is 512. */
    const MEMO_MAX_CHARS = 512

    /* ── which window is on screen ─────────────────────────────────────────────── */

    const dismissed = ref(false)
    const opened = ref(false)

    /**
     * ⛔ `eligible` opens this window; it does not keep it open. The moment the entries are
     * sent, the row is settled and the server stops calling this member eligible — reading it
     * straight into `v-model` would take the window away at the exact moment it finally has
     * something to say. So the first `true` is remembered and the member closes the window
     * themselves.
     */
    watch(
      () => result.value?.firstCreationStatus?.eligible,
      (eligible) => {
        if (eligible) {
          opened.value = true
        }
      },
      { immediate: true },
    )

    /**
     * Never over the settings: the address and the name are corrected there, and both of the
     * windows that come before this one send members exactly there (EmailConfirmationReminder
     * does the same). Not a dismissal — leaving the settings brings it back.
     */
    const onSettings = computed(() => route.path.startsWith('/settings'))

    const wants = computed(() => opened.value && !dismissed.value && !onSettings.value)
    watch(wants, (value) => setFirstLoginWindowWanted('firstCreation', value), { immediate: true })

    const onScreen = firstLoginWindowOnScreen('firstCreation')
    const visible = computed({
      get: () => onScreen.value,
      set: (open) => {
        /*
         * Only the member closing it counts as an answer. When another first-login window takes
         * the screen this getter goes false by itself and BModal writes that back — read as a
         * dismissal, that would retire this window for the rest of the session over a question
         * the member never saw.
         */
        if (!open && onScreen.value) {
          dismissed.value = true
        }
      },
    })

    /* ── what the member is writing ────────────────────────────────────────────── */

    /** Ticked check sentences, by key. A tick is an entry with no text of its own (ES-008). */
    const checked = ref<string[]>([])
    /** `{ id, catalogKey, text }`, in the order they were opened. The same key may repeat. */
    const entries = reactive<Entry[]>([])
    /** Which categories show all their stems rather than the first few. */
    const expanded = ref<string[]>([])
    let nextEntryId = 0

    const wordCount = (text: string | null | undefined) =>
      (text ?? '').trim().split(/\s+/).filter(Boolean).length

    /**
     * ⭐ The opening of the sentence, as a VALUE for the box — the whole of this delivery.
     *
     * It used to be a placeholder showing an example ("… Kuchen für das Fest gebacken habe"),
     * and that was wrong twice over (Bernd, 06.09.): the example belonged to a different stem,
     * and a placeholder cannot be edited, so whoever wrote into the box was locked into one
     * grammar. "Ich habe meinem kranken Bruder Vitamin-Tabletten gekauft" was unreachable.
     *
     * Now the sentence starts in the box and the member owns every word of it: complete it,
     * rebuild it, or clear it and write something else entirely.
     */
    const prefillFor = (stem: string) =>
      `${t(`firstCreation.catalog.${stem}`)} ${t('firstCreation.connector')} `

    /**
     * The stem as the ROW shows it: without a trailing comma. The German stems end in one
     * ("Ich habe einem kranken Menschen geholfen,") because in the box the connector follows
     * ("…, indem ich"); on the button nothing follows, and the comma hung there alone (Bernd,
     * 24.09.). The box keeps the stem as it is — `prefillFor` above is untouched, and so is
     * `ownWords`, which measures against it.
     */
    const rowLabel = (stem: string) => t(`firstCreation.catalog.${stem}`).replace(/,\s*$/, '')

    /**
     * How much of this entry is the MEMBER'S. While the text still begins with the opening, it
     * is what stands behind it; once they have rewritten the sentence, it is the whole thing.
     *
     * ⛔ Not the plain word count of the box any more, and that is not a detail: the untouched
     * opening is already eight words, so a plain count would call an empty entry finished and
     * put Save within reach of somebody who has written nothing.
     */
    const ownWords = (entry: Entry) => {
      const text = entry.text ?? ''
      // ⛔ Against the opening WITHOUT its trailing space. One backspace at the end of an
      // untouched box is a natural thing to do, and it used to end the match: the opening then
      // counted as the member's own eight words, so Save went live and an entry carrying
      // nothing but the stem could be filed. Measured, not feared (coderabbit, 06.09.).
      const prefill = prefillFor(entry.catalogKey).trimEnd()
      return wordCount(text.startsWith(prefill) ? text.slice(prefill.length) : text)
    }

    /**
     * ⛔ An EMPTY field is not an unfinished entry — it is a button that was pressed and not
     * used. It counts for nothing, it is not sent, and above all it holds nothing back.
     *
     * It used to. Somebody tapped "one more with this beginning", left the box alone, and Save
     * went pale with nothing on screen to say why. Bernd hit exactly that during the first
     * acceptance run and had to hunt for the cause — "das fällt selbst mir als IT-affinen
     * Menschen kaum auf". A blockade nobody can find is worse than no rule at all.
     *
     * A field with ONE or TWO words is the other case and DOES keep holding Save: the member's
     * own words are in there, and dropping them silently would be worse than asking for a few
     * more. What changed is that the field says so, at the cause — see `isTooShort` in the
     * template.
     */
    const isBlank = (entry: Entry) => ownWords(entry) === 0
    const isTooShort = (entry: Entry) => {
      const words = ownWords(entry)
      return words > 0 && words < FIRST_CREATION_MIN_WORDS
    }

    /** The entries with something in them — the ones that count and the ones that are sent. */
    const written = computed(() => entries.filter((entry) => !isBlank(entry)))

    /** What will be sent, and what the counter shows. */
    const entryCount = computed(() => checked.value.length + written.value.length)

    /**
     * ⛔ The cap counts SLOTS — every open field, empty or not — while the counter above counts
     * only what is written. The two differ on purpose, and getting that wrong let eleven
     * entries through.
     *
     * An empty field is a LATENT entry: it costs nothing today and becomes an entry the moment
     * somebody types into it. Counting the cap on written entries alone let a member keep a
     * blank box, fill the remaining nine slots plus the tick, and then go back and fill the
     * blank — eleven on the way to a backend that refuses more than ten with `TOO_MANY`. The
     * member would have seen "das hat nicht geklappt" and no reason, with every retry failing
     * the same way.
     *
     * So no eleventh slot is ever opened. The member at nine written plus one empty box sees
     * the note and the empty box together, and removing it gives the slot back.
     */
    const atMaxEntries = computed(
      () => checked.value.length + entries.length >= FIRST_CREATION_MAX_ENTRIES,
    )

    const entriesOf = (stem: string) => entries.filter((entry) => entry.catalogKey === stem)

    /**
     * The stems a category shows.
     *
     * ⚠️ Plus every stem that already carries an entry, whether or not it is among the first
     * few. Without that, writing under an unfolded stem and then folding the category back up
     * takes the sentence off the screen while it is still in the list being sent.
     */
    const visibleStems = (category: Category) => {
      if (expanded.value.includes(category.key)) {
        return category.stems
      }
      const open = category.stems.slice(0, FIRST_CREATION_STEMS_VISIBLE)
      return category.stems.filter(
        (stem) => open.includes(stem) || entries.some((entry) => entry.catalogKey === stem),
      )
    }

    const hiddenCount = (category: Category) =>
      category.stems.length - visibleStems(category).length

    const toggleCategory = (key: string) => {
      expanded.value = expanded.value.includes(key)
        ? expanded.value.filter((entry) => entry !== key)
        : [...expanded.value, key]
    }

    /**
     * ⭐ Setting one of two ticks that exclude each other TAKES THE OTHER AWAY, rather than
     * refusing the tap or letting both stand (Bernd, 07.09.). "Ich bin Rentnerin / Rentner" and
     * "Ich bin ein Kind" are two answers to one question, so the second tap is a correction of
     * the first — a tap that visibly did nothing would read as a broken window.
     *
     * ⚠️ The cap is asked AFTER the other one is dropped: the exchange takes no new slot, so a
     * member at the ceiling can still change their mind about which of the two they are.
     */
    const toggleCheck = (key: string) => {
      if (checked.value.includes(key)) {
        checked.value = checked.value.filter((entry) => entry !== key)
        return
      }
      const excluded = FIRST_CREATION_EXCLUSIVE_CHECKS.includes(key)
        ? checked.value.filter((entry) => !FIRST_CREATION_EXCLUSIVE_CHECKS.includes(entry))
        : checked.value
      if (excluded.length < checked.value.length || !atMaxEntries.value) {
        checked.value = [...excluded, key]
      }
    }

    /** The fields, so a freshly opened one can take the cursor without the member hunting. */
    const fields = new Map<number, Focusable>()
    const registerField = (id: number, element: unknown) => {
      if (element) {
        fields.set(id, element as Focusable)
      } else {
        fields.delete(id)
      }
    }

    const addEntry = async (stem: string) => {
      // ⚠️ Reuse comes BEFORE the cap, and the order is the point. An empty box for this stem is
      // already open, so going to it opens no slot and the cap has nothing to say about it —
      // checked first, a tap on the stem at the cap did nothing at all, silently. That is the
      // very thing this window is being repaired for.
      //
      // Reuse rather than a second box: tapping the stem again, or "one more with this
      // beginning", would otherwise stack blank boxes that say nothing and do nothing.
      const blank = entries.find((entry) => entry.catalogKey === stem && isBlank(entry))
      if (blank) {
        await nextTick()
        fields.get(blank.id)?.focus?.()
        return
      }
      if (atMaxEntries.value) {
        return
      }
      const entry = { id: nextEntryId++, catalogKey: stem, text: prefillFor(stem) }
      entries.push(entry)
      await nextTick()
      fields.get(entry.id)?.focus?.()
    }

    const removeEntry = (id: number) => {
      const index = entries.findIndex((entry) => entry.id === id)
      if (index >= 0) {
        entries.splice(index, 1)
      }
      fields.delete(id)
    }

    /**
     * Two ticks that exclude each other, which `toggleCheck` above makes unreachable by taking
     * one away as the other goes on.
     *
     * ⛔ Kept anyway, and it is the second of the three layers Bernd asked for: the toggle is
     * one line, and the day somebody restores `checked` from somewhere — a draft, a second tab,
     * a refactor that keeps the array and loses the exchange — Save must not send a bundle that
     * the server will hand straight to a moderator. Same reason the entry cap is checked twice.
     */
    const checksConflict = computed(
      () => checked.value.filter((key) => FIRST_CREATION_EXCLUSIVE_CHECKS.includes(key)).length > 1,
    )

    const canSave = computed(
      () =>
        entryCount.value > 0 &&
        // Unreachable while `atMaxEntries` counts slots — and kept anyway, because the backend
        // is the one that decides (`TOO_MANY` in Submitter.role.ts) and a refusal there reaches
        // the member as a bare "that did not work".
        entryCount.value <= FIRST_CREATION_MAX_ENTRIES &&
        !checksConflict.value &&
        !entries.some(isTooShort),
    )

    /**
     * What goes over the wire: the key and the member's own words, never the sentence. The
     * stem is put in front of it on the server, out of the same locale file that writes it into
     * the ledger (backend FirstCreation.logic.ts) — so no client can invent a beginning.
     */
    const payload = computed(() => [
      ...checked.value.map((catalogKey) => ({ catalogKey, text: null })),
      ...written.value.map((entry) => ({ catalogKey: entry.catalogKey, text: entry.text.trim() })),
    ])

    /* ── sending, and the four screens ─────────────────────────────────────────── */

    const SETTLED_STATES = ['DONE', 'DONE_UNBOOKED', 'IN_REVIEW']

    /** True while the request is out AND until we know where it left us. */
    const sending = ref(false)
    const failed = ref(false)
    /**
     * What the layout's balance stamp stood at when the entries went off. Declared HERE, above
     * the only thing that writes it, rather than beside the computed that reads it at the foot
     * of this file — the same care AliasFirstChoice takes with `probed`.
     */
    const stampAtSubmit = ref<number | null>(null)
    /** The settled answer, which the live query stops describing once the row is done. */
    const settled = ref<Status | null>(null)

    const status = computed<Status | null>(
      () => settled.value ?? result.value?.firstCreationStatus ?? null,
    )

    /** ES-012: the project-account question is on screen. */
    const askingProject = ref(false)
    /**
     * One flag for both answers to it. "Later" and "project account" each send a mutation, and a
     * second tap while the first is out would send it again — a skip twice is two skip events,
     * and the count of skippers is a measurement. So both buttons hang on this one flag.
     */
    const answering = ref(false)
    const projectFailed = ref('')
    /** The two-step confirmation is on screen (only ever from the question). */
    const confirmingProject = ref(false)

    const screen = computed(() => {
      if (askingProject.value) {
        return confirmingProject.value ? 'projectConfirm' : 'projectAsk'
      }
      if (sending.value || status.value?.state === 'SUBMITTED') {
        return 'waiting'
      }
      const state = status.value?.state
      if (state === 'DONE' || state === 'DONE_UNBOOKED') {
        return 'result'
      }
      return state === 'IN_REVIEW' ? 'review' : 'form'
    })

    const doneEntries = computed(() => status.value?.entries ?? [])
    const message = computed(() => status.value?.message ?? '')
    const unbooked = computed(() => status.value?.state === 'DONE_UNBOOKED')
    /**
     * Who brought this member here, for "now thank somebody" below. Part of the settled answer
     * rather than a query of its own: the server names them once the bundle is thanked, which
     * is the one moment the button is on screen.
     */
    const referrerAlias = computed(() => status.value?.referrerAlias ?? null)

    /**
     * The small print under the message. W4: the COMMUNITY signs here, not the person set as
     * signer — the message already says "the community thanks you", and the name belongs where
     * names belong anyway, on the contribution thread and in the mail (ES-005).
     *
     * Joined here rather than in the template so the separator is not a bare piece of text on
     * screen with no locale behind it.
     */
    const signature = computed(
      () =>
        `${t('firstCreation.confirmedFor', { community: communityName })} · ${t('firstCreation.alsoFound')}`,
    )

    /**
     * What stands under the waiting text.
     *
     * The server's own sentences once it has them — a row it is still working on already
     * carries the memos it filed. Before that, the member's drafts, assembled here the same way
     * the server assembles them: stem, connector, their own words. ⚠️ Not the raw keys: this is
     * the screen the member looks at for half a minute.
     */
    const pendingLines = computed(() => {
      if (doneEntries.value.length > 0) {
        return doneEntries.value.map((entry) => entry.memo)
      }
      return [
        ...checked.value.map((key) => t(`firstCreation.checks.${key}`)),
        // The sentence as they wrote it — the same text the server files, because the box now
        // holds the whole of it.
        ...written.value.map((entry) => entry.text.trim()),
      ]
    })

    const applyStatus = (next: Status | null) => {
      settled.value = next && SETTLED_STATES.includes(next.state) ? next : null
      if (settled.value) {
        /*
         * The store learns where the member stands, the way `declareProject` tells it about the
         * account kind: from here on nothing in this session asks the server about the window
         * again (`mightOpen`), and the answer on screen is the settled one.
         */
        store.setFirstCreationStatus(settled.value.state)
      }
      if (next?.state === 'DONE') {
        /* The header carries the same number; one refetch serves both (see `balanceStamp`). */
        emit('update-transactions')
      }
    }

    /**
     * Asks the server where this stands.
     *
     * ⛔ This is the whole error handling of `submit`, on purpose. A refused request and a
     * request that never came back look the same from here — and only ONE of them means the
     * entries were not filed. Rather than guess from the shape of the failure, the window asks
     * the side that knows: the process row is claimed before anything is written and settles
     * itself whatever breaks (backend FirstCreation.context.ts), so its state is the answer.
     *
     * ⚠️ It matters more than it looks. nginx has no `proxy_read_timeout` on `/graphql`, so its
     * default of 60 s applies, and the model deadline behind this mutation is exactly 60 s —
     * a slow run is CUT while the backend is still working. Read as an error, that would show a
     * member a failure over a creation that went through.
     */
    const ask = async () => {
      try {
        const answer = await refetch()
        const next = answer?.data?.firstCreationStatus ?? null
        applyStatus(next)
        failed.value = !next || (!SETTLED_STATES.includes(next.state) && next.state !== 'SUBMITTED')
      } catch {
        failed.value = true
      }
    }

    const submit = async () => {
      if (!canSave.value || sending.value) {
        return
      }
      failed.value = false
      stampAtSubmit.value = props.balanceStamp
      sending.value = true
      try {
        const answer = await sendEntries({ entries: payload.value })
        applyStatus(answer?.data?.submitFirstCreation ?? null)
      } catch {
        await ask()
      } finally {
        sending.value = false
      }
    }

    /**
     * ES-011: nothing entered is an answer too, and the question comes back next login. The
     * mutation writes no row — it is an event, so the count of people who skipped stays honest.
     */
    const nothingComesToMind = async () => {
      // ES-012: the first time, one question before the window goes -- and only the first
      // time. The server remembers the skip, so the second "nothing" closes at once.
      if (!status.value?.skippedBefore) {
        askingProject.value = true
        return
      }
      await later()
    }

    /** "Later": the skip as before, question answered by not answering it (ES-011). */
    const later = async () => {
      if (answering.value) {
        return
      }
      answering.value = true
      try {
        await sendSkip()
      } catch {
        /* A lost measurement is not worth holding the member in a window they want to leave. */
      } finally {
        answering.value = false
      }
      close()
    }

    /**
     * "This is a project account": creation is off from now on (ES-021), and this window is
     * gone for good -- the server no longer calls the account eligible. The store learns it
     * here, so the "Create" menu item disappears without waiting for the next verifyLogin.
     */
    const declareProject = async () => {
      if (answering.value) {
        return
      }
      answering.value = true
      projectFailed.value = ''
      try {
        await sendDeclare()
        store.setCreationAllowed(false)
        close()
      } catch (error) {
        const message = (error as Error | undefined)?.message ?? ''
        projectFailed.value = message.includes('OPEN_CONTRIBUTIONS')
          ? t('settings.creationAccount.openContributions')
          : t('firstCreation.failed')
      } finally {
        answering.value = false
      }
    }

    /** Back to the question -- and a refusal from the last try does not come along. */
    const cancelProjectConfirm = () => {
      projectFailed.value = ''
      confirmingProject.value = false
    }

    const close = () => {
      dismissed.value = true
    }

    /**
     * ⛔ The recipient only, never an amount and never a booking (ZE-007): a thank-you that
     * the software fills in is not a thank-you. Whoever came in over somebody's invitation
     * finds that somebody already in the field; whoever came in by themselves finds the form
     * as it has always been.
     *
     * The route form is the one `PublicProfile` uses -- `Send` takes the pair of params, and
     * the form fills its field from them (`TransactionForm`, `userIdentifier`); it needs both
     * or it ignores them.
     */
    const thankSomeone = () => {
      dismissed.value = true
      if (referrerAlias.value) {
        router.push({
          name: 'Send',
          params: {
            communityIdentifier: CONFIG.COMMUNITY_NAME,
            userIdentifier: referrerAlias.value,
          },
        })
        return
      }
      router.push('/send')
    }

    /* ── waiting for a process we no longer hold the request for ───────────────── */

    const POLL_MS = 5000
    /** Two minutes. Past that the backend's own healing settles the row on the next read. */
    const POLL_MAX = 24
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let pollsLeft = 0

    const stopPolling = () => {
      clearInterval(pollTimer ?? undefined)
      pollTimer = null
    }

    /**
     * Only while the screen says "waiting" and the request is NOT ours any more — a row left in
     * SUBMITTED because the connection was cut, or because another tab is running one. With the
     * request still out there is nothing to poll for: its answer is coming.
     *
     * ⛔ `immediate`, and it is not a formality. A member who reloads the page mid-run arrives
     * with the row ALREADY in SUBMITTED, so this expression is true from the first render and
     * never changes — a watcher without it would start nothing at all, and the window would sit
     * on "the community is reading" for the rest of the session. Found by the spec, not by
     * reading this back.
     */
    watch(
      () => screen.value === 'waiting' && !sending.value,
      (orphaned) => {
        stopPolling()
        if (!orphaned) {
          return
        }
        pollsLeft = POLL_MAX
        pollTimer = setInterval(() => {
          if (pollsLeft-- <= 0) {
            stopPolling()
            return
          }
          refetch()?.catch(() => {
            // let go: the next poll asks again
          })
        }, POLL_MS)
      },
      { immediate: true },
    )

    /* ── the ticks ─────────────────────────────────────────────────────────────── */

    /*
     * `D` §2 step 7: one after another, not all at once — and slowly enough to be a moment
     * rather than a flicker. 250 ms was a flicker; Bernd asked for 2.5 s at the acceptance run.
     *
     * ⚠️ The first three carry the ceremony, the rest keep pace (Bernd, 06.09.): ten entries
     * would otherwise be 25 seconds of ticking before the message, the balance and both buttons
     * appear — longer than the wait that came before it. This way ten entries take 14.5 s and
     * three, the ordinary case, take the full 7.5 s.
     */
    const TICK_MS_CEREMONY = 2500
    const TICK_MS_REST = 1000
    const TICK_CEREMONY_COUNT = 3

    /** The pause BEFORE the nth tick, 1-based. */
    const tickDelay = (nth: number) =>
      nth <= TICK_CEREMONY_COUNT ? TICK_MS_CEREMONY : TICK_MS_REST
    const revealed = ref(0)
    /**
     * ⛔ A ref, not a computed on `revealed`. The last tick used to be the only one nobody ever
     * saw: the message, the balance and both buttons arrived in the same frame that drew it. So
     * the last tick gets a pause of its own — and it is the CEREMONY length even when the ticks
     * themselves have sped up to 1 s, because the pace exists to keep ten entries short, while
     * this pause exists so that the last of them is seen (Bernd, 06.09.).
     */
    const messageShown = ref(false)
    let tickTimer: ReturnType<typeof setTimeout> | null = null

    const stopTicking = () => {
      clearTimeout(tickTimer ?? undefined)
      tickTimer = null
    }

    /**
     * A chain of timeouts rather than one interval, because the gap CHANGES after the third
     * tick — an interval has one period for its whole life.
     */
    const tickOnce = () => {
      tickTimer = setTimeout(
        () => {
          revealed.value += 1
          if (revealed.value < doneEntries.value.length) {
            tickOnce()
          } else {
            tickTimer = setTimeout(() => {
              messageShown.value = true
              stopTicking()
            }, TICK_MS_CEREMONY)
          }
        },
        tickDelay(revealed.value + 1),
      )
    }

    watch(
      () => screen.value === 'result',
      (arrived) => {
        stopTicking()
        revealed.value = 0
        messageShown.value = false
        if (!arrived) {
          return
        }
        if (doneEntries.value.length > 0) {
          tickOnce()
        } else {
          // Nothing to reveal, nothing to wait for: the pause belongs to a tick, and there is
          // none. Without this the window would sit empty on a bundle with no entries.
          messageShown.value = true
        }
      },
      { immediate: true },
    )

    /* ── the balance, and why it waits ─────────────────────────────────────────── */

    /**
     * ⚠️ Shown only once the layout's booking query has ANSWERED since the entries went off.
     * The prop already holds a number before that — the one from before the creation — and
     * printing it here would put a stale, usually zero balance at the very moment the window
     * exists for. No fresh answer, no box: the message, the hundred and the buttons all stand
     * without it.
     */
    const balanceShown = computed(
      () => stampAtSubmit.value !== null && props.balanceStamp > stampAtSubmit.value,
    )

    /* ── which footer, named once ──────────────────────────────────────────────── */

    /**
     * ⛔ A footer with nothing to press has to reach BModal as `no-footer`, not as an empty
     * slot. BModal renders the footer as `renderSlot($slots, 'footer', …, () => [cancel, ok])`
     * — Cancel and OK are its FALLBACK (read in the installed 0.26.8) — and vue falls back to
     * it whenever the slot produces nothing but comments, which is exactly what a chain of
     * false `v-if`s leaves behind. So every screen with no button showed BootstrapVue's own
     * untranslated "Cancel"/"OK" in the middle of the act: the whole wait, the two-and-a-half
     * seconds before the message, and the project-account confirmation, which carries its own
     * two buttons in the body.
     *
     * Named here rather than tested twice, because `no-footer` and the slot have to say the
     * same thing — written out separately they would drift on the next screen anybody adds.
     */
    const footerMode = computed(() => {
      if (screen.value === 'form') {
        return 'form'
      }
      if (screen.value === 'projectAsk') {
        return 'projectAsk'
      }
      if (screen.value === 'waiting') {
        // Nothing to press while the request is still out there. Once it is gone and the
        // process runs on without us (see `ask` below), the way out comes back — a member
        // whose connection dropped must not be held in front of a spinner.
        return sending.value ? 'none' : 'leave'
      }
      if (screen.value === 'result') {
        return messageShown.value ? 'done' : 'none'
      }
      return screen.value === 'review' ? 'done' : 'none'
    })

    onBeforeUnmount(() => {
      stopPolling()
      stopTicking()
      setFirstLoginWindowWanted('firstCreation', false)
    })

    /* What `checked` is for a spec: the forbidden pair of ticks cannot be reached through the
       window, so the spec sets it here (see `checksConflict`). */
    expose({ checked })

    /* ── the question ─────────────────────────────────────────────────────── */
    const formScreen = () => (
      <div class={['fc', classes.fc, 'px-2 pt-3']} data-test='first-creation-form'>
        {/* ★ The door. A DIFFERENT sentence from the one that closes the message at the end
            ("Liebe Ira, willkommen!"), and deliberately the plainer of the two: the second
            one is then a step up rather than a repetition (Bernd, 06.09.). It also needs no
            gender guess — that heuristic lives in the backend, and this greeting is built
            here out of the name the wallet already holds. */}
        <p class='fc-welcome' data-test='first-creation-welcome'>
          {welcome.value}
        </p>
        {/* ⭐ Why anybody is being asked this at all, BEFORE the question — the window used
            to open with the question itself and walk in through the door with it (Bernd,
            07.09.). It also says the beginning is already prepared, which is what turns a
            blank demand into an offer. */}
        <p class='fc-intro' data-test='first-creation-intro'>
          {t('firstCreation.intro')}
        </p>
        <p class='h5 mb-2 mt-3'>{t('firstCreation.question')}</p>
        <p class='text-muted mb-3'>{t('firstCreation.subtitle')}</p>

        {/* The tick sits above everything, because it is the one entry that costs no
            typing at all (W5) -- and for somebody who has been retired for thirty years it
            may be the only one they need. */}
        {checkKeys.map((checkKey) => (
          <button
            key={checkKey}
            type='button'
            class={['fc-check', { 'fc-on': checked.value.includes(checkKey) }]}
            aria-pressed={checked.value.includes(checkKey)}
            data-test={`first-creation-check-${checkKey}`}
            onClick={() => toggleCheck(checkKey)}
          >
            <span class='fc-box'>{checked.value.includes(checkKey) ? '✓' : ''}</span>
            <span class='fc-check-text'>{t(`firstCreation.checks.${checkKey}`)}</span>
            <span class='fc-check-hint'>{t(`firstCreation.checkHints.${checkKey}`)}</span>
          </button>
        ))}

        {categories.map((category) => (
          <div key={category.key} class='fc-category'>
            <p class='fc-category-title'>{t(`firstCreation.categories.${category.key}`)}</p>

            {visibleStems(category).map((stem) => (
              <div key={stem} class='fc-stem'>
                <button
                  type='button'
                  class='fc-row'
                  data-test={`first-creation-stem-${stem}`}
                  onClick={() => addEntry(stem)}
                >
                  <span class='fc-dot'></span>
                  {/* ⛔ The row is a button again, and nothing else. It used to echo the
                      member's words behind the connector, because the sentence lived out here
                      and only its tail was in the box. The sentence is IN the box now, editable
                      from its first word — echoing it here would print it twice, and the second
                      copy would be the one nobody can change (Bernd, 06.09.). */}
                  <span class='fc-row-text'>{rowLabel(stem)}</span>
                </button>

                {/* Every entry made from this stem, in the order they were opened. The same
                    stem may carry several (ES-008) -- that is how four sentences grow out of
                    one beginning. */}
                {entriesOf(stem).map((entry) => (
                  <div key={entry.id} class='fc-edit' data-test={`first-creation-entry-${stem}`}>
                    <BFormTextarea
                      ref={(element) => registerField(entry.id, element)}
                      modelValue={entry.text}
                      onUpdate:modelValue={(text) => {
                        entry.text = text as string
                      }}
                      rows='2'
                      maxlength={MEMO_MAX_CHARS}
                      placeholder={t('firstCreation.placeholder')}
                      data-test={`first-creation-text-${entry.id}`}
                    />
                    {/* ⛔ The reason Save is pale, standing AT its cause. An empty field holds
                        nothing back any more (see `canSave`); a half-written one does, and then it
                        has to say so here — a pale button on the far side of the window is a
                        blockade nobody can find. Bernd looked for it and he wrote this code. */}
                    {isTooShort(entry) ? (
                      <p class='fc-too-short' data-test={`first-creation-short-${entry.id}`}>
                        {t('firstCreation.tooShort')}
                      </p>
                    ) : null}
                    <div class='fc-edit-foot'>
                      <button
                        type='button'
                        class='fc-link'
                        data-test={`first-creation-remove-${entry.id}`}
                        onClick={() => removeEntry(entry.id)}
                      >
                        {t('firstCreation.remove')}
                      </button>
                      {!atMaxEntries.value ? (
                        <button
                          type='button'
                          class='fc-link fc-again'
                          data-test={`first-creation-again-${stem}`}
                          onClick={() => addEntry(stem)}
                        >
                          {t('firstCreation.again')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {hiddenCount(category) > 0 || expanded.value.includes(category.key) ? (
              <button
                type='button'
                class='fc-link fc-more'
                data-test={`first-creation-more-${category.key}`}
                onClick={() => toggleCategory(category.key)}
              >
                {expanded.value.includes(category.key)
                  ? t('firstCreation.showLess')
                  : t('firstCreation.showMore', { count: hiddenCount(category) })}
              </button>
            ) : null}
          </div>
        ))}

        {atMaxEntries.value ? (
          <p class='fc-note' data-test='first-creation-max'>
            {t('firstCreation.maxEntries', { max: FIRST_CREATION_MAX_ENTRIES })}
          </p>
        ) : null}
        {failed.value ? (
          <p class='fc-note text-danger' data-test='first-creation-failed'>
            {t('firstCreation.failed')}
          </p>
        ) : null}
      </div>
    )

    /* ── the community is reading ─────────────────────────────────────────── */
    const waitingScreen = () => (
      <div class={['fc', classes.fc, 'px-2 pt-3']} data-test='first-creation-waiting'>
        <p class='h5 mb-2'>{t('firstCreation.waiting')}</p>
        <p class='text-muted mb-4'>{t('firstCreation.waitingHint')}</p>
        {pendingLines.value.map((line, index) => (
          <div key={index} class='fc-line'>
            <span class='fc-circle fc-circle-open'></span>
            <span data-test={`first-creation-pending-${index}`}>{line}</span>
          </div>
        ))}
      </div>
    )

    /* ── the project-account question (ES-012), once ───────────────────────── */
    /* Behind "nothing comes to mind", not in the footer of the form: the one place where
       the difference between a person and a project first makes a difference, and it must
       not distract anybody who is a person (mockup, section 6). Asked on the FIRST skip
       only -- `skippedBefore` comes from the server, so it holds across devices. */
    const projectAskScreen = () => (
      <div class={['fc', classes.fc, 'px-2 pt-3']} data-test='first-creation-project-ask'>
        <p class='h5 mb-2'>{t('firstCreation.projectAsk.title')}</p>
        <p>{t('firstCreation.projectAsk.text')}</p>
      </div>
    )

    /* ── "this is a project account": the same two steps as in the settings ─────
       (ABN-L3-01). The link above only opens this; nothing is declared before the word
       is typed. Rendered as a screen of this window, not as a second modal on top. */
    const projectConfirmScreen = () => (
      <div class={['fc', classes.fc]} data-test='first-creation-project-confirm'>
        <ProjectAccountConfirm
          mode='declare'
          busy={answering.value}
          onConfirm={declareProject}
          onCancel={cancelProjectConfirm}
        />
        {projectFailed.value ? (
          <p class='fc-note text-danger px-2' data-test='first-creation-project-failed'>
            {projectFailed.value}
          </p>
        ) : null}
      </div>
    )

    /* ── the ticks, then the message ──────────────────────────────────────── */
    const resultScreen = () => (
      <div class={['fc', classes.fc, 'px-2 pt-3']} data-test='first-creation-result'>
        {doneEntries.value.map((entry, index) => (
          <div key={index} class='fc-line'>
            <span
              class={['fc-circle', index < revealed.value ? 'fc-circle-done' : 'fc-circle-open']}
              data-test={
                index < revealed.value ? 'first-creation-tick' : 'first-creation-tick-pending'
              }
            >
              {index < revealed.value ? '✓' : ''}
            </span>
            <span>{entry.memo}</span>
          </div>
        ))}

        {messageShown.value ? (
          <div data-test='first-creation-message-block'>
            <p class='fc-message' data-test='first-creation-message'>
              {message.value}
            </p>
            <p class='fc-signature' data-test='first-creation-signature'>
              {signature.value}
            </p>

            {unbooked.value ? (
              <div class='fc-note' data-test='first-creation-unbooked'>
                {t('firstCreation.unbooked')}
              </div>
            ) : null}

            <p class='fc-why-title'>{t('firstCreation.whyHundredTitle')}</p>
            <p class='fc-why'>{t('firstCreation.whyHundred')}</p>
            {/* The word carries the link, not the address: an address in running text is
                something to read, a word is something to press. New tab, because the member
                is in the middle of their first minute here and losing the window to a web
                page would end it. `rel` with the target, or the opened page gets a handle
                back on this one. */}
            <I18nText
              keypath='firstCreation.whyMore'
              tag='p'
              class='fc-why'
              scope='global'
              v-slots={{
                link: () => (
                  <a
                    href={COMMON_GOOD_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                    data-test='first-creation-why-more-link'
                  >
                    {t('firstCreation.whyMoreLink')}
                  </a>
                ),
              }}
            />

            {/* ⭐ Who confirmed THIS one, and who confirms every one after it. It stands after
                the link rather than between it and `whyHundred`, so the "read more" sentence
                stays with the paragraph it belongs to instead of appearing to point at the
                moderation (Bernd, 07.09.).
                ⚠️ It sits in a known tension with "Bestätigt für die Gemeinschaft" a few lines
                up, where a person set in the admin signs (ES-005): what happened automatically
                was the DECISION, not the signature. Bernd knows and accepts it. */}
            <p class='fc-why' data-test='first-creation-why-confirmed'>
              {t('firstCreation.whyConfirmed')}
            </p>

            {/* ⛔ BELOW the hundred, not above it (Bernd, 06.09.). This box says what is on
                the account, and that is the hundred only for somebody who arrived with an
                empty one — whoever redeemed a link or a cheque first reads a larger number
                directly under the sentence about their first hundred, and then "why a
                hundred?" underneath answers a question they are no longer asking. */}
            {!unbooked.value && balanceShown.value ? (
              <div class='fc-balance' data-test='first-creation-balance'>
                <span class='fc-balance-label'>{t('firstCreation.balance')}</span>
                <span class='fc-balance-amount'>
                  {filters.amount(props.balance)} {t('GDD')}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )

    /* ── a person will look at this ───────────────────────────────────────── */
    const reviewScreen = () => (
      <div class={['fc', classes.fc, 'px-2 pt-3']} data-test='first-creation-review'>
        {doneEntries.value.map((entry, index) => (
          <div key={index} class='fc-line'>
            <span class='fc-circle fc-circle-open'></span>
            <span>{entry.memo}</span>
          </div>
        ))}
        <p class='fc-message' data-test='first-creation-review-message'>
          {message.value || t('firstCreation.review')}
        </p>
      </div>
    )

    const body = () => {
      if (screen.value === 'form') {
        return formScreen()
      }
      if (screen.value === 'waiting') {
        return waitingScreen()
      }
      if (screen.value === 'projectAsk') {
        return projectAskScreen()
      }
      if (screen.value === 'projectConfirm') {
        return projectConfirmScreen()
      }
      return screen.value === 'result' ? resultScreen() : reviewScreen()
    }

    /* What stands in the footer and had a scoped rule carries `fc-foot`: the footer is not
       inside `.fc` (see the style module). */
    const footer = () => {
      if (footerMode.value === 'form') {
        return (
          <>
            <BButton
              variant='secondary'
              data-test='first-creation-nothing'
              onClick={nothingComesToMind}
            >
              {t('firstCreation.nothing')}
            </BButton>
            <span class={['fc-count', classes['fc-foot']]} data-test='first-creation-count'>
              {t('firstCreation.entries', entryCount.value)}
            </span>
            <BButton
              variant={'gradido' as ButtonVariant}
              disabled={!canSave.value}
              data-test='first-creation-save'
              onClick={submit}
            >
              {t('form.save')}
            </BButton>
          </>
        )
      }
      if (footerMode.value === 'projectAsk') {
        return (
          <>
            <button
              type='button'
              class={['fc-link', classes['fc-foot']]}
              disabled={answering.value}
              data-test='first-creation-project-account'
              onClick={() => {
                confirmingProject.value = true
              }}
            >
              {t('firstCreation.projectAsk.project')}
            </button>
            <BButton
              variant='secondary'
              disabled={answering.value}
              data-test='first-creation-later'
              onClick={later}
            >
              {t('firstCreation.projectAsk.later')}
            </BButton>
          </>
        )
      }
      if (footerMode.value === 'leave') {
        return (
          <BButton variant='secondary' data-test='first-creation-waiting-close' onClick={close}>
            {t('firstCreation.toAccount')}
          </BButton>
        )
      }
      if (footerMode.value === 'done') {
        return (
          <>
            <BButton variant='secondary' data-test='first-creation-to-account' onClick={close}>
              {t('firstCreation.toAccount')}
            </BButton>
            {screen.value === 'result' ? (
              <BButton
                variant={'gradido' as ButtonVariant}
                data-test='first-creation-thank'
                onClick={thankSomeone}
              >
                {t('firstCreation.thankSomeone')}
              </BButton>
            ) : null}
          </>
        )
      }
      return null
    }

    return () => (
      <BModal
        id='modal-first-creation'
        modelValue={visible.value}
        onUpdate:modelValue={(open: boolean) => {
          visible.value = open
        }}
        centered
        scrollable
        size='lg'
        noHeader
        fullscreen='md'
        noFooter={footerMode.value === 'none'}
        noCloseOnBackdrop={sending.value}
        noCloseOnEsc={sending.value}
        data-test='first-creation'
        v-slots={{ default: body, footer }}
      />
    )
  },
})
