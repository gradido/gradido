<!-- AI-GENERATED — not an architecture reference -->
<template>
  <BModal
    id="modal-first-creation"
    v-model="visible"
    centered
    scrollable
    size="lg"
    hide-header
    fullscreen="md"
    :no-close-on-backdrop="sending"
    :no-close-on-esc="sending"
    data-test="first-creation"
  >
    <!-- ── the question ─────────────────────────────────────────────────────── -->
    <div v-if="screen === 'form'" class="fc px-2 pt-3" data-test="first-creation-form">
      <!-- ★ The door. A DIFFERENT sentence from the one that closes the message at the end
           ("Liebe Ira, willkommen!"), and deliberately the plainer of the two: the second
           one is then a step up rather than a repetition (Bernd, 06.09.). It also needs no
           gender guess — that heuristic lives in the backend, and this greeting is built
           here out of the name the wallet already holds. -->
      <p class="fc-welcome" data-test="first-creation-welcome">{{ welcome }}</p>
      <p class="h5 mb-2">{{ $t('firstCreation.question') }}</p>
      <p class="text-muted mb-3">{{ $t('firstCreation.subtitle') }}</p>

      <!-- The tick sits above everything, because it is the one entry that costs no
           typing at all (W5) -- and for somebody who has been retired for thirty years it
           may be the only one they need. -->
      <button
        v-for="checkKey in checkKeys"
        :key="checkKey"
        type="button"
        class="fc-check"
        :class="{ 'fc-on': checked.includes(checkKey) }"
        :aria-pressed="checked.includes(checkKey)"
        :data-test="`first-creation-check-${checkKey}`"
        @click="toggleCheck(checkKey)"
      >
        <span class="fc-box">{{ checked.includes(checkKey) ? '✓' : '' }}</span>
        <span class="fc-check-text">{{ $t(`firstCreation.checks.${checkKey}`) }}</span>
        <span class="fc-check-hint">{{ $t(`firstCreation.checkHints.${checkKey}`) }}</span>
      </button>

      <div v-for="category in categories" :key="category.key" class="fc-category">
        <p class="fc-category-title">{{ $t(`firstCreation.categories.${category.key}`) }}</p>

        <div v-for="stem in visibleStems(category)" :key="stem" class="fc-stem">
          <button
            type="button"
            class="fc-row"
            :data-test="`first-creation-stem-${stem}`"
            @click="addEntry(stem)"
          >
            <span class="fc-dot"></span>
            <!-- ⛔ The row is a button again, and nothing else. It used to echo the
                 member's words behind the connector, because the sentence lived out here
                 and only its tail was in the box. The sentence is IN the box now, editable
                 from its first word — echoing it here would print it twice, and the second
                 copy would be the one nobody can change (Bernd, 06.09.). -->
            <span class="fc-row-text">{{ $t(`firstCreation.catalog.${stem}`) }}</span>
          </button>

          <!-- Every entry made from this stem, in the order they were opened. The same
               stem may carry several (ES-008) -- that is how four sentences grow out of
               one beginning. -->
          <div
            v-for="entry in entriesOf(stem)"
            :key="entry.id"
            class="fc-edit"
            :data-test="`first-creation-entry-${stem}`"
          >
            <BFormTextarea
              :ref="(element) => registerField(entry.id, element)"
              v-model="entry.text"
              rows="2"
              :maxlength="MEMO_MAX_CHARS"
              :placeholder="$t('firstCreation.placeholder')"
              :data-test="`first-creation-text-${entry.id}`"
            />
            <!-- ⛔ The reason Save is pale, standing AT its cause. An empty field holds
                 nothing back any more (see `canSave`); a half-written one does, and then it
                 has to say so here — a pale button on the far side of the window is a
                 blockade nobody can find. Bernd looked for it and he wrote this code. -->
            <p
              v-if="isTooShort(entry)"
              class="fc-too-short"
              :data-test="`first-creation-short-${entry.id}`"
            >
              {{ $t('firstCreation.tooShort') }}
            </p>
            <div class="fc-edit-foot">
              <button
                type="button"
                class="fc-link"
                :data-test="`first-creation-remove-${entry.id}`"
                @click="removeEntry(entry.id)"
              >
                {{ $t('firstCreation.remove') }}
              </button>
              <button
                v-if="!atMaxEntries"
                type="button"
                class="fc-link fc-again"
                :data-test="`first-creation-again-${stem}`"
                @click="addEntry(stem)"
              >
                {{ $t('firstCreation.again') }}
              </button>
            </div>
          </div>
        </div>

        <button
          v-if="hiddenCount(category) > 0 || expanded.includes(category.key)"
          type="button"
          class="fc-link fc-more"
          :data-test="`first-creation-more-${category.key}`"
          @click="toggleCategory(category.key)"
        >
          {{
            expanded.includes(category.key)
              ? $t('firstCreation.showLess')
              : $t('firstCreation.showMore', { count: hiddenCount(category) })
          }}
        </button>
      </div>

      <p v-if="atMaxEntries" class="fc-note" data-test="first-creation-max">
        {{ $t('firstCreation.maxEntries', { max: FIRST_CREATION_MAX_ENTRIES }) }}
      </p>
      <p v-if="failed" class="fc-note text-danger" data-test="first-creation-failed">
        {{ $t('firstCreation.failed') }}
      </p>
    </div>

    <!-- ── the community is reading ─────────────────────────────────────────── -->
    <div v-else-if="screen === 'waiting'" class="fc px-2 pt-3" data-test="first-creation-waiting">
      <p class="h5 mb-2">{{ $t('firstCreation.waiting') }}</p>
      <p class="text-muted mb-4">{{ $t('firstCreation.waitingHint') }}</p>
      <div v-for="(line, index) in pendingLines" :key="index" class="fc-line">
        <span class="fc-circle fc-circle-open"></span>
        <span>{{ line }}</span>
      </div>
    </div>

    <!-- ── the project-account question (ES-012), once ───────────────────────── -->
    <!-- Behind "nothing comes to mind", not in the footer of the form: the one place where
         the difference between a person and a project first makes a difference, and it must
         not distract anybody who is a person (mockup, section 6). Asked on the FIRST skip
         only -- `skippedBefore` comes from the server, so it holds across devices. -->
    <div
      v-else-if="screen === 'projectAsk'"
      class="fc px-2 pt-3"
      data-test="first-creation-project-ask"
    >
      <p class="h5 mb-2">{{ $t('firstCreation.projectAsk.title') }}</p>
      <p>{{ $t('firstCreation.projectAsk.text') }}</p>
    </div>

    <!-- ── "this is a project account": the same two steps as in the settings ─────
         (ABN-L3-01). The link above only opens this; nothing is declared before the word
         is typed. Rendered as a screen of this window, not as a second modal on top. -->
    <div
      v-else-if="screen === 'projectConfirm'"
      class="fc"
      data-test="first-creation-project-confirm"
    >
      <project-account-confirm
        mode="declare"
        :busy="answering"
        @confirm="declareProject"
        @cancel="cancelProjectConfirm"
      />
      <p
        v-if="projectFailed"
        class="fc-note text-danger px-2"
        data-test="first-creation-project-failed"
      >
        {{ projectFailed }}
      </p>
    </div>

    <!-- ── the ticks, then the message ──────────────────────────────────────── -->
    <div v-else-if="screen === 'result'" class="fc px-2 pt-3" data-test="first-creation-result">
      <div v-for="(entry, index) in doneEntries" :key="index" class="fc-line">
        <span
          class="fc-circle"
          :class="index < revealed ? 'fc-circle-done' : 'fc-circle-open'"
          :data-test="index < revealed ? 'first-creation-tick' : 'first-creation-tick-pending'"
        >
          {{ index < revealed ? '✓' : '' }}
        </span>
        <span>{{ entry.memo }}</span>
      </div>

      <div v-if="messageShown" data-test="first-creation-message-block">
        <p class="fc-message" data-test="first-creation-message">{{ message }}</p>
        <p class="fc-signature" data-test="first-creation-signature">{{ signature }}</p>

        <div v-if="unbooked" class="fc-note" data-test="first-creation-unbooked">
          {{ $t('firstCreation.unbooked') }}
        </div>

        <p class="fc-why-title">{{ $t('firstCreation.whyHundredTitle') }}</p>
        <p class="fc-why">{{ $t('firstCreation.whyHundred') }}</p>
        <!-- The word carries the link, not the address: an address in running text is
             something to read, a word is something to press. New tab, because the member
             is in the middle of their first minute here and losing the window to a web
             page would end it. `rel` with the target, or the opened page gets a handle
             back on this one. -->
        <i18n-t keypath="firstCreation.whyMore" tag="p" class="fc-why" scope="global">
          <template #link>
            <a
              :href="COMMON_GOOD_URL"
              target="_blank"
              rel="noopener noreferrer"
              data-test="first-creation-why-more-link"
            >
              {{ $t('firstCreation.whyMoreLink') }}
            </a>
          </template>
        </i18n-t>

        <!-- ⛔ BELOW the hundred, not above it (Bernd, 06.09.). This box says what is on
             the account, and that is the hundred only for somebody who arrived with an
             empty one — whoever redeemed a link or a cheque first reads a larger number
             directly under the sentence about their first hundred, and then "why a
             hundred?" underneath answers a question they are no longer asking. -->
        <div v-if="!unbooked && balanceShown" class="fc-balance" data-test="first-creation-balance">
          <span class="fc-balance-label">{{ $t('firstCreation.balance') }}</span>
          <span class="fc-balance-amount">{{ $filters.amount(balance) }} {{ $t('GDD') }}</span>
        </div>
      </div>
    </div>

    <!-- ── a person will look at this ───────────────────────────────────────── -->
    <div v-else class="fc px-2 pt-3" data-test="first-creation-review">
      <div v-for="(entry, index) in doneEntries" :key="index" class="fc-line">
        <span class="fc-circle fc-circle-open"></span>
        <span>{{ entry.memo }}</span>
      </div>
      <p class="fc-message" data-test="first-creation-review-message">
        {{ message || $t('firstCreation.review') }}
      </p>
    </div>

    <template #footer>
      <template v-if="screen === 'form'">
        <BButton variant="secondary" data-test="first-creation-nothing" @click="nothingComesToMind">
          {{ $t('firstCreation.nothing') }}
        </BButton>
        <span class="fc-count" data-test="first-creation-count">
          {{ $t('firstCreation.entries', entryCount) }}
        </span>
        <BButton
          variant="gradido"
          :disabled="!canSave"
          data-test="first-creation-save"
          @click="submit"
        >
          {{ $t('form.save') }}
        </BButton>
      </template>

      <template v-else-if="screen === 'projectAsk'">
        <button
          type="button"
          class="fc-link"
          :disabled="answering"
          data-test="first-creation-project-account"
          @click="confirmingProject = true"
        >
          {{ $t('firstCreation.projectAsk.project') }}
        </button>
        <BButton
          variant="secondary"
          :disabled="answering"
          data-test="first-creation-later"
          @click="later"
        >
          {{ $t('firstCreation.projectAsk.later') }}
        </BButton>
      </template>

      <!-- Nothing to press while the request is still out there. Once it is gone and the
           process runs on without us (see `ask` below), the way out comes back -- a member
           whose connection dropped must not be held in front of a spinner. -->
      <BButton
        v-else-if="screen === 'waiting' && !sending"
        variant="secondary"
        data-test="first-creation-waiting-close"
        @click="close"
      >
        {{ $t('firstCreation.toAccount') }}
      </BButton>

      <template v-else-if="screen === 'result' ? messageShown : screen === 'review'">
        <BButton variant="secondary" data-test="first-creation-to-account" @click="close">
          {{ $t('firstCreation.toAccount') }}
        </BButton>
        <BButton
          v-if="screen === 'result'"
          variant="gradido"
          data-test="first-creation-thank"
          @click="thankSomeone"
        >
          {{ $t('firstCreation.thankSomeone') }}
        </BButton>
      </template>
    </template>
  </BModal>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BFormTextarea, BModal } from 'bootstrap-vue-next'
import {
  firstCreationStatus,
  skipFirstCreation,
  submitFirstCreation,
} from '@/graphql/firstCreation.graphql'
import { declareProjectAccount } from '@/graphql/user.graphql'
import ProjectAccountConfirm from '@/components/UserSettings/ProjectAccountConfirm.vue'
import {
  FIRST_CREATION_CATEGORIES,
  FIRST_CREATION_CHECK_KEYS,
  FIRST_CREATION_MAX_ENTRIES,
  FIRST_CREATION_MIN_WORDS,
  FIRST_CREATION_STEMS_VISIBLE,
} from '@/utils/firstCreationCatalog'
import {
  firstLoginWindowOnScreen,
  setFirstLoginWindowWanted,
} from '@/composables/useFirstLoginWindow'
import CONFIG from '@/config'

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
 */

const props = defineProps({
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
})

const emit = defineEmits(['update-transactions'])

const store = useStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const { result, refetch } = useQuery(firstCreationStatus, null, {
  fetchPolicy: 'cache-and-network',
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
  const name = (store.state.firstName ?? '').trim()
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
const checked = ref([])
/** `{ id, catalogKey, text }`, in the order they were opened. The same key may repeat. */
const entries = reactive([])
/** Which categories show all their stems rather than the first few. */
const expanded = ref([])
let nextEntryId = 0

const wordCount = (text) => (text ?? '').trim().split(/\s+/).filter(Boolean).length

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
const prefillFor = (stem) =>
  `${t(`firstCreation.catalog.${stem}`)} ${t('firstCreation.connector')} `

/**
 * How much of this entry is the MEMBER'S. While the text still begins with the opening, it
 * is what stands behind it; once they have rewritten the sentence, it is the whole thing.
 *
 * ⛔ Not the plain word count of the box any more, and that is not a detail: the untouched
 * opening is already eight words, so a plain count would call an empty entry finished and
 * put Save within reach of somebody who has written nothing.
 */
const ownWords = (entry) => {
  const text = entry.text ?? ''
  const prefill = prefillFor(entry.catalogKey)
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
const isBlank = (entry) => ownWords(entry) === 0
const isTooShort = (entry) => {
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

const entriesOf = (stem) => entries.filter((entry) => entry.catalogKey === stem)

/**
 * The stems a category shows.
 *
 * ⚠️ Plus every stem that already carries an entry, whether or not it is among the first
 * few. Without that, writing under an unfolded stem and then folding the category back up
 * takes the sentence off the screen while it is still in the list being sent.
 */
const visibleStems = (category) => {
  if (expanded.value.includes(category.key)) {
    return category.stems
  }
  const open = category.stems.slice(0, FIRST_CREATION_STEMS_VISIBLE)
  return category.stems.filter(
    (stem) => open.includes(stem) || entries.some((entry) => entry.catalogKey === stem),
  )
}

const hiddenCount = (category) => category.stems.length - visibleStems(category).length

const toggleCategory = (key) => {
  expanded.value = expanded.value.includes(key)
    ? expanded.value.filter((entry) => entry !== key)
    : [...expanded.value, key]
}

const toggleCheck = (key) => {
  if (checked.value.includes(key)) {
    checked.value = checked.value.filter((entry) => entry !== key)
  } else if (!atMaxEntries.value) {
    checked.value = [...checked.value, key]
  }
}

/** The fields, so a freshly opened one can take the cursor without the member hunting. */
const fields = new Map()
const registerField = (id, element) => {
  if (element) {
    fields.set(id, element)
  } else {
    fields.delete(id)
  }
}

const addEntry = async (stem) => {
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

const removeEntry = (id) => {
  const index = entries.findIndex((entry) => entry.id === id)
  if (index >= 0) {
    entries.splice(index, 1)
  }
  fields.delete(id)
}

const canSave = computed(
  () =>
    entryCount.value > 0 &&
    // Unreachable while `atMaxEntries` counts slots — and kept anyway, because the backend
    // is the one that decides (`TOO_MANY` in Submitter.role.ts) and a refusal there reaches
    // the member as a bare "that did not work".
    entryCount.value <= FIRST_CREATION_MAX_ENTRIES &&
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
const stampAtSubmit = ref(null)
/** The settled answer, which the live query stops describing once the row is done. */
const settled = ref(null)

const status = computed(() => settled.value ?? result.value?.firstCreationStatus ?? null)

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

const applyStatus = (next) => {
  settled.value = next && SETTLED_STATES.includes(next.state) ? next : null
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
    store.commit('creationAllowed', false)
    close()
  } catch (error) {
    const message = error?.message ?? ''
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

const thankSomeone = () => {
  dismissed.value = true
  router.push('/send')
}

/* ── waiting for a process we no longer hold the request for ───────────────── */

const POLL_MS = 5000
/** Two minutes. Past that the backend's own healing settles the row on the next read. */
const POLL_MAX = 24
let pollTimer = null
let pollsLeft = 0

const stopPolling = () => {
  clearInterval(pollTimer)
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
      refetch()?.catch(() => {})
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
const tickDelay = (nth) => (nth <= TICK_CEREMONY_COUNT ? TICK_MS_CEREMONY : TICK_MS_REST)
const revealed = ref(0)
/**
 * ⛔ A ref, not a computed on `revealed`. The last tick used to be the only one nobody ever
 * saw: the message, the balance and both buttons arrived in the same frame that drew it. So
 * the last tick gets a pause of its own — and it is the CEREMONY length even when the ticks
 * themselves have sped up to 1 s, because the pace exists to keep ten entries short, while
 * this pause exists so that the last of them is seen (Bernd, 06.09.).
 */
const messageShown = ref(false)
let tickTimer = null

const stopTicking = () => {
  clearTimeout(tickTimer)
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

onBeforeUnmount(() => {
  stopPolling()
  stopTicking()
  setFirstLoginWindowWanted('firstCreation', false)
})
</script>

<style scoped>
.fc {
  font-size: 0.95rem;
}

.fc-welcome {
  margin-bottom: 4px;
  color: var(--gold, #c58d38);
  font-size: 1.15rem;
  font-weight: 600;
}

.fc-check {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 2px 0 14px;
  padding: 10px 12px;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: left;
  background: var(--gradido-goldsoft, rgb(197 141 56 / 8%));
  border: 1.5px solid var(--gold, #c58d38);
  border-radius: 8px;
}

.fc-box {
  display: flex;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #fff;
  font-size: 0.8rem;
  border: 1.8px solid var(--gold, #c58d38);
  border-radius: 4px;
}

.fc-on .fc-box {
  background: var(--gold, #c58d38);
}

.fc-check-hint {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 400;
}

.fc-category-title {
  margin: 16px 0 6px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fc-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 6px;
  padding: 9px 12px;
  text-align: left;
  background: transparent;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 8px;
}

.fc-dot {
  flex: 0 0 10px;
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border: 1.5px solid var(--bs-border-color, #dee2e6);
  border-radius: 50%;
}

.fc-too-short {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.fc-edit {
  margin: 0 0 10px 28px;
  padding: 10px 12px;
  background: var(--bs-body-bg, #fff);
  border: 1px solid var(--gold, #c58d38);
  border-radius: 8px;
}

.fc-edit-foot {
  display: flex;
  gap: 16px;
  margin-top: 6px;
}

.fc-link {
  padding: 0;
  color: var(--gold, #c58d38);
  font-size: 0.8rem;
  background: none;
  border: 0;
}

.fc-again {
  margin-left: auto;
}

.fc-more {
  display: block;
  margin-bottom: 4px;
}

.fc-note {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.fc-count {
  margin: 0 auto;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.fc-line {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.fc-circle {
  display: flex;
  flex: 0 0 20px;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  color: #fff;
  font-size: 0.75rem;
  border-radius: 50%;
}

.fc-circle-open {
  border: 1.5px dashed var(--bs-border-color, #adb5bd);
}

.fc-circle-done {
  background: var(--gold, #c58d38);
  border: 1.5px solid var(--gold, #c58d38);
}

.fc-message {
  margin: 18px 0 6px;
  padding: 16px 20px;
  font-size: 1rem;
  line-height: 1.55;

  /* The message is composed on the server out of several lines (ES-006); the breaks
     between them are part of it. */
  white-space: pre-line;
  background: var(--gradido-goldsoft, rgb(197 141 56 / 8%));
  border-left: 3px solid var(--gold, #c58d38);
  border-radius: 0 10px 10px 0;
}

.fc-signature {
  margin-bottom: 18px;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.fc-balance {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18px;
  padding: 12px 16px;
  border: 1px solid var(--gold, #c58d38);
  border-radius: 10px;
}

.fc-balance-label {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.fc-balance-amount {
  color: var(--gold, #c58d38);
  font-size: 1.3rem;
  font-weight: 700;
}

.fc-why-title {
  margin-bottom: 2px;
  font-weight: 600;
}

.fc-why {
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>
