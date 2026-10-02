<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="thank-you-greeting" data-test="thank-you-greeting">
    <!-- The greeting is made: what to do with it. Nothing here leads back into the steps. -->
    <thank-you-greeting-done v-if="step === DONE && created" :created="created" />

    <template v-else-if="step !== DONE">
      <div class="tyg-head page-text">
        <!-- One step back, as the device's own back key: both walk the same history. -->
        <button
          type="button"
          class="tyg-back"
          :aria-label="$t('back')"
          :disabled="pending"
          data-test="thank-you-greeting-back"
          @click="back"
        >
          <svg
            viewBox="0 0 20 20"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5l-5 5 5 5" />
          </svg>
        </button>
        <ol class="tyg-steps" data-test="thank-you-greeting-steps">
          <li
            v-for="(name, index) in STEPS"
            :key="name"
            class="tyg-step"
            :class="{ 'is-current': name === step, 'is-passed': index < stepIndex }"
            :aria-current="name === step ? 'step' : undefined"
          >
            <span class="tyg-step-mark" aria-hidden="true">
              <svg
                v-if="index < stepIndex"
                viewBox="0 0 20 20"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 10.5l3.5 3.5L15 7" />
              </svg>
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span class="tyg-step-name">{{ stepLabel(name) }}</span>
          </li>
        </ol>
      </div>

      <!-- 1. The picture: five motifs, one of them chosen. -->
      <section v-if="step === PICTURE" data-test="thank-you-greeting-picture">
        <h2 class="h4 mb-3 page-text">{{ $t('thank-you-greeting.picture.question') }}</h2>
        <div class="tyg-motifs">
          <button
            v-for="motif in motifs"
            :key="motif.key"
            type="button"
            class="tyg-motif"
            :class="{ 'is-chosen': motif.key === form.motif }"
            :aria-pressed="motif.key === form.motif"
            :data-test="`thank-you-greeting-motif-${motif.key}`"
            @click="form.motif = motif.key"
          >
            <!-- ⛔ An <img>, never the SVG inlined: the motifs share the ids of their
                 gradients. The name stands beside it, so the picture itself says nothing. -->
            <img
              :src="motif.src"
              alt=""
              :width="THANK_YOU_MOTIF_WIDTH"
              :height="THANK_YOU_MOTIF_HEIGHT"
            />
            <span class="tyg-motif-name">{{ motif.name }}</span>
            <span v-if="motif.key === form.motif" class="tyg-motif-check" aria-hidden="true">
              <svg
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 10.5l3.5 3.5L15 7" />
              </svg>
            </span>
          </button>
        </div>
        <div class="tyg-actions">
          <BButton variant="gradido" data-test="thank-you-greeting-next" @click="go(WORDS)">
            {{ $t('thank-you-greeting.next') }}
          </BButton>
        </div>
      </section>

      <!-- 2. The words: whom it is for, the first line, the sender's own words, the amount. -->
      <section v-else-if="step === WORDS" data-test="thank-you-greeting-words">
        <div class="tyg-card bg-white app-box-shadow gradido-border-radius">
          <div class="tyg-field">
            <label class="tyg-label" for="thank-you-greeting-name">
              {{ $t('thank-you-greeting.words.for-whom') }}
            </label>
            <BFormInput
              id="thank-you-greeting-name"
              v-model="form.recipientName"
              type="text"
              autocomplete="off"
              :maxlength="THANK_YOU_RECIPIENT_NAME_MAX_CHARS"
              aria-describedby="thank-you-greeting-name-hint"
              data-test="thank-you-greeting-name"
            />
            <div id="thank-you-greeting-name-hint" class="tyg-hint small">
              {{ $t('thank-you-greeting.words.for-whom-hint') }}
            </div>
          </div>

          <div class="tyg-field" role="group" aria-labelledby="thank-you-greeting-line-label">
            <div id="thank-you-greeting-line-label" class="tyg-label">
              {{ $t('thank-you-greeting.words.line') }}
            </div>
            <!-- Suggestions, none of them chosen beforehand; a second tap takes the choice
                 back. Four at first, all twelve in their three groups on demand. -->
            <template v-if="allLinesOpen">
              <div
                v-for="group in LINE_GROUPS"
                :key="group.name"
                class="tyg-line-group"
                :data-test="`thank-you-greeting-group-${group.name}`"
              >
                <div class="tyg-line-group-title small">{{ groupTitle(group.name) }}</div>
                <div class="tyg-chips">
                  <button
                    v-for="key in group.lines"
                    :key="key"
                    type="button"
                    class="tyg-chip"
                    :class="{ 'is-chosen': form.lineChoice === key }"
                    :aria-pressed="form.lineChoice === key"
                    :data-test="`thank-you-greeting-line-${key}`"
                    @click="chooseLine(key)"
                  >
                    {{ lineText(key) }}
                  </button>
                </div>
              </div>
            </template>
            <div v-else class="tyg-chips">
              <button
                v-for="key in shownLines"
                :key="key"
                type="button"
                class="tyg-chip"
                :class="{ 'is-chosen': form.lineChoice === key }"
                :aria-pressed="form.lineChoice === key"
                :data-test="`thank-you-greeting-line-${key}`"
                @click="chooseLine(key)"
              >
                {{ lineText(key) }}
              </button>
            </div>
            <div class="tyg-line-more">
              <button
                type="button"
                class="tyg-link"
                :aria-expanded="allLinesOpen"
                data-test="thank-you-greeting-all-lines"
                @click="allLinesOpen = !allLinesOpen"
              >
                {{ $t('thank-you-greeting.words.all-lines') }}
              </button>
              <button
                type="button"
                class="tyg-link"
                :aria-pressed="form.lineChoice === OWN"
                data-test="thank-you-greeting-own-line"
                @click="chooseLine(OWN)"
              >
                {{ $t('thank-you-greeting.words.own-line') }}
              </button>
            </div>
            <BFormInput
              v-if="form.lineChoice === OWN"
              v-model="form.ownLine"
              type="text"
              autocomplete="off"
              :maxlength="THANK_YOU_LINE_MAX_CHARS"
              :aria-label="$t('thank-you-greeting.words.own-line')"
              data-test="thank-you-greeting-own-line-input"
            />
          </div>

          <div class="tyg-field">
            <label class="tyg-label" for="thank-you-greeting-words-input">
              {{ $t('thank-you-greeting.words.own-words') }}
            </label>
            <BFormTextarea
              id="thank-you-greeting-words-input"
              v-model="form.words"
              rows="4"
              max-rows="10"
              no-resize
              :state="tried && memoError ? false : null"
              data-test="thank-you-greeting-words-input"
            />
            <!-- Said once the member wants to go on: the line may be missing, the words may
                 be missing, both at once may not. -->
            <div
              v-if="tried && memoError"
              class="tyg-error small"
              role="alert"
              data-test="thank-you-greeting-memo-error"
            >
              {{ memoError }}
            </div>
          </div>

          <!-- The amount, small and last: the same rule as the send form's, with the reserve
               a link holds. -->
          <ValidatedInput
            id="thank-you-greeting-amount"
            class="tyg-amount"
            :model-value="form.amount"
            name="amount"
            :label="$t('thank-you-greeting.words.amount')"
            placeholder="0.01"
            inputmode="decimal"
            autocomplete="off"
            :rules="amountRules"
            :disable-smart-valid-state="tried"
            data-test="thank-you-greeting-amount"
            @update:model-value="form.amount = $event"
          />
        </div>
        <div class="tyg-actions">
          <BButton variant="gradido" data-test="thank-you-greeting-next" @click="toPreview">
            {{ $t('thank-you-greeting.next') }}
          </BButton>
        </div>
      </section>

      <!-- 3. The last look: the sheet as the other person will see it. -->
      <section v-else-if="step === PREVIEW" data-test="thank-you-greeting-preview">
        <h2 class="h4 mb-3 page-text" data-test="thank-you-greeting-preview-title">
          {{
            recipientName
              ? $t('thank-you-greeting.preview.title-for', { name: recipientName })
              : $t('thank-you-greeting.preview.title')
          }}
        </h2>
        <div class="tyg-paper">
          <redeem-thanks-paper :link-data="previewLink" />
        </div>
        <p class="tyg-note small page-text" data-test="thank-you-greeting-waits">
          {{
            recipientName
              ? $t(
                  'thank-you-greeting.preview.waits-for',
                  { days: LINK_VALID_DAYS, name: recipientName },
                  LINK_VALID_DAYS,
                )
              : $t('thank-you-greeting.preview.waits', { days: LINK_VALID_DAYS }, LINK_VALID_DAYS)
          }}
        </p>
        <p
          v-if="createError"
          class="tyg-error page-text"
          role="alert"
          data-test="thank-you-greeting-create-error"
        >
          {{ createError }}
        </p>
        <div class="tyg-actions">
          <BButton
            variant="gradido"
            :disabled="pending"
            data-test="thank-you-greeting-finish"
            @click="create"
          >
            {{ $t('thank-you-greeting.preview.finish') }}
          </BButton>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
/**
 * Writing a thank-you greeting: a picture, the words, a last look -- and then a link to share.
 *
 * Technically a greeting is a transaction link (ZE-016): `createTransactionLink` with a
 * `greeting` beside amount and memo. The memo is the first line, a line break, and the
 * sender's own words; that is what goes into the booking. Who it is for is not known to the
 * system -- "Für wen?" is a name written freely.
 *
 * The steps are entries of the browser's history (`?step=`), so that the arrow of the page and
 * the back key of the device do the same thing: one step back, with everything typed still
 * there. What was typed lives in this component and nowhere else:
 * - whoever reloads the page starts at the picture;
 * - ⛔ once the greeting is made, no way leads back to "Gruß fertigstellen" -- a second tap
 *   would make a second greeting and hold the amount twice. From the result, back leads to the
 *   list of links.
 */
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { BButton, BFormInput, BFormTextarea } from 'bootstrap-vue-next'
import ValidatedInput from '@/components/Inputs/ValidatedInput.vue'
import RedeemThanksPaper from '@/components/LinkInformations/RedeemThanksPaper.vue'
import ThankYouGreetingDone from '@/components/ThankYouGreeting/ThankYouGreetingDone.vue'
import { LINK_VALID_DAYS, linkAmountMax } from '@/constants'
import { createTransactionLink } from '@/graphql/mutations'
import {
  greetingMemo,
  THANK_YOU_LINE_MAX_CHARS,
  THANK_YOU_RECIPIENT_NAME_MAX_CHARS,
} from '@/utils/thankYouGreeting'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_KEYS,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotifs,
} from '@/utils/thankYouMotifs'
import {
  amount as amountUpTo,
  memo as memoSchema,
  translateYupErrorString,
} from '@/validationSchemas'

const PICTURE = 'picture'
const WORDS = 'words'
const PREVIEW = 'preview'
const DONE = 'done'
const STEPS = [PICTURE, WORDS, PREVIEW]

// The twelve lines in their three groups (the catalogue of 29.08.2026), and the four that
// stand there at first.
const LINE_GROUPS = [
  { name: 'for-something', lines: ['help', 'talk', 'time', 'effort'] },
  { name: 'just-so', lines: ['just-so', 'encouragement', 'appreciation', 'joy'] },
  { name: 'occasion', lines: ['welcome', 'birthday', 'recovery', 'farewell'] },
]
const QUICK_LINES = ['help', 'talk', 'just-so', 'joy']
const OWN = 'own'

const props = defineProps({
  balance: { type: Number, default: 0 },
})

const emit = defineEmits(['update-transactions'])

const route = useRoute()
const router = useRouter()
const store = useStore()
const { t } = useI18n()

// The keys are written out one by one, here and below: the unused-keys rule of the linter only
// counts a key it finds as a literal.
const stepLabel = (name) => {
  switch (name) {
    case PICTURE:
      return t('thank-you-greeting.step.picture')
    case WORDS:
      return t('thank-you-greeting.step.words')
    default:
      return t('thank-you-greeting.step.preview')
  }
}

const groupTitle = (name) => {
  switch (name) {
    case 'for-something':
      return t('thank-you-greeting.group.for-something')
    case 'just-so':
      return t('thank-you-greeting.group.just-so')
    default:
      return t('thank-you-greeting.group.occasion')
  }
}

// ⛔ Each of these goes into a booking and stays there, in the language the sender chose it
// in (E-018): timeless, and without a word of paying.
const lineText = (key) => {
  switch (key) {
    case 'help':
      return t('thank-you-greeting.line.help')
    case 'talk':
      return t('thank-you-greeting.line.talk')
    case 'time':
      return t('thank-you-greeting.line.time')
    case 'effort':
      return t('thank-you-greeting.line.effort')
    case 'just-so':
      return t('thank-you-greeting.line.just-so')
    case 'encouragement':
      return t('thank-you-greeting.line.encouragement')
    case 'appreciation':
      return t('thank-you-greeting.line.appreciation')
    case 'joy':
      return t('thank-you-greeting.line.joy')
    case 'welcome':
      return t('thank-you-greeting.line.welcome')
    case 'birthday':
      return t('thank-you-greeting.line.birthday')
    case 'recovery':
      return t('thank-you-greeting.line.recovery')
    case 'farewell':
      return t('thank-you-greeting.line.farewell')
    default:
      return ''
  }
}

const motifs = computed(() => thankYouMotifs(t))

// One motif is always chosen: the first, the warm one that goes with everything.
const form = reactive({
  motif: THANK_YOU_MOTIF_KEYS[0],
  recipientName: '',
  // null, one of the twelve keys, or OWN. A suggestion is kept by its key, so the line is in
  // the language the wallet is in when the greeting is made.
  lineChoice: null,
  ownLine: '',
  words: '',
  amount: '',
})
const allLinesOpen = ref(false)

const chooseLine = (key) => {
  form.lineChoice = form.lineChoice === key ? null : key
}

// With the groups folded in, a line chosen from among the other eight stays in sight.
const shownLines = computed(() =>
  form.lineChoice && form.lineChoice !== OWN && !QUICK_LINES.includes(form.lineChoice)
    ? [...QUICK_LINES, form.lineChoice]
    : QUICK_LINES,
)

const recipientName = computed(() => form.recipientName.trim())
const line = computed(() => {
  if (form.lineChoice === OWN) return form.ownLine.trim()
  return form.lineChoice ? lineText(form.lineChoice) : ''
})
// What goes into the booking: the line, a line break, the words -- or the one there is.
const memo = computed(() => greetingMemo(line.value, form.words))

// The line may be missing, the words may be missing, both at once may not; and together they
// keep the bounds of every memo. The check is the memo's own, on the memo as it will go out.
const memoError = computed(() => {
  if (memo.value === '') return t('thank-you-greeting.words.missing')
  try {
    memoSchema.validateSync(memo.value)
    return ''
  } catch (error) {
    return translateYupErrorString(error.message, t)
  }
})

// The send form's rule, up to what a link may carry out of this balance: the field then names
// the most that goes.
const amountRules = computed(() => amountUpTo(linkAmountMax(props.balance)))
const amountValid = computed(() => amountRules.value.isValidSync(form.amount))
// As a string: `GradidoUnit` takes nothing else, and a number would die before the resolver.
const amountToSend = computed(() => String(amountRules.value.cast(form.amount)))

const formValid = computed(() => memoError.value === '' && amountValid.value)
// The member wanted to go on once: from then on the fields say what is missing.
const tried = ref(false)

const greeting = computed(() => ({
  motif: form.motif,
  line: line.value || null,
  recipientName: recipientName.value || null,
}))

// The sheet of the redeem page, fed with what the form holds and the member's own user name:
// one sheet for both, so what is shown here is what arrives.
const previewLink = computed(() => ({
  amount: amountToSend.value,
  memo: memo.value,
  senderUser: { alias: store.state.username, gradidoID: store.state.gradidoID },
  greeting: greeting.value,
}))

const step = computed(() =>
  [WORDS, PREVIEW, DONE].includes(route.query.step) ? route.query.step : PICTURE,
)
const stepIndex = computed(() => STEPS.indexOf(step.value))

// The steps this page itself has led to. An address that names a step it has not is a reload,
// or the forward key into an entry of an earlier visit: the form is empty then.
const reached = new Set([PICTURE])
const created = ref(null)
const pending = ref(false)
const createError = ref('')

const here = (query) => ({ path: route.path, query })

const go = (next) => {
  reached.add(next)
  return router.push(here({ step: next }))
}

const toPreview = () => {
  tried.value = true
  if (!formValid.value) return
  createError.value = ''
  go(PREVIEW)
}

// One step back, through the history the steps were pushed onto -- the same walk as the
// device's back key. From the first step it leaves the page: back to where the member came
// from, or to "Zeig es Deinen Freunden" where the page was opened by its address.
const back = () => {
  if (step.value === PICTURE && !window.history.state?.back) {
    router.push('/show-friends')
    return
  }
  router.back()
}

watch(
  step,
  (now) => {
    // ⛔ The greeting is made: whatever entry the browser walks to, none shows the steps
    // again. Back from the result leads to the list of links.
    if (created.value) {
      if (now !== DONE) router.replace('/transactions')
      return
    }
    if (now === DONE || !reached.has(now)) {
      router.replace(here({}))
      return
    }
    // The forward key into the last look, after the words were changed on the way back.
    if (now === PREVIEW && !formValid.value) {
      tried.value = true
      router.replace(here({ step: WORDS }))
    }
  },
  { immediate: true },
)

let alive = true
onUnmounted(() => {
  alive = false
})

const { mutate: createLink } = useMutation(createTransactionLink)

async function create() {
  // Locked while the request is on its way, and for good once it has made a greeting.
  if (pending.value || created.value) return
  pending.value = true
  createError.value = ''
  try {
    const result = await createLink({
      amount: amountToSend.value,
      memo: memo.value,
      greeting: greeting.value,
    })
    // What the result shows is the server's answer, not the form: the member may have walked
    // back and changed a field while the request was under way, and the greeting that exists
    // is the one that was sent.
    created.value = result.data.createTransactionLink
    // The balance and the sum of open links have changed (as pages/Send.vue says it).
    emit('update-transactions', {})
    // Only where the member is still here: whoever left for another page is not pulled back.
    if (alive) await router.replace(here({ step: DONE }))
  } catch (error) {
    createError.value = error.message
  } finally {
    pending.value = false
  }
}
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector".

   The gold of the house in two depths: the darker one carries text on a light ground, the
   lighter one lines. On the dark sheet the text gold is a lighter one -- the brown would stand
   at 3 : 1 there. */
.thank-you-greeting {
  --tyg-accent: #8a6124;
  --tyg-accent-line: #c58d38;
  --tyg-on-accent: #fff;
  --tyg-chosen-ground: #fdf6e3;
}

.dark-mode .thank-you-greeting {
  --tyg-accent: #e6bd70;
  --tyg-on-accent: #23262b;
  --tyg-chosen-ground: #3a3424;
}

.tyg-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 1rem;
}

/* The arrow has the height and width a thumb needs, and none of a button's looks. */
.tyg-back {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-inline-start: -10px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
}

.tyg-back:disabled {
  opacity: 0.4;
}

/* Three steps on one line, a fine line between them; they share the room there is. */
.tyg-steps {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
  font-weight: 600;
}

.tyg-step {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  color: var(--bs-secondary-color, #6c757d);
}

.tyg-step + .tyg-step::before {
  flex: 1 1 12px;
  min-width: 8px;
  height: 1px;
  background: var(--bs-border-color, #c9ced3);
  content: '';
}

.tyg-step + .tyg-step {
  flex: 1;
}

.tyg-step.is-current,
.tyg-step.is-passed {
  color: var(--tyg-accent);
}

.tyg-step.is-current::before,
.tyg-step.is-passed::before {
  background: var(--tyg-accent);
}

.tyg-step-mark {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1.5px solid currentcolor;
  border-radius: 50%;
  font-size: 0.75rem;
}

.tyg-step.is-current .tyg-step-mark,
.tyg-step.is-passed .tyg-step-mark {
  border-color: var(--tyg-accent);
  background: var(--tyg-accent);
  color: var(--tyg-on-accent);
}

.tyg-step-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The motifs: two columns of tiles, picture above name. */
.tyg-motifs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.tyg-motif {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 14px;
  background: var(--bs-body-bg, #fff);
  color: inherit;
  font: inherit;
  text-align: start;
}

/* The room of the picture stands before the picture has come: 36 : 25, as the files are. */
.tyg-motif img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 36 / 25;
  background: #fbf3de;
}

.tyg-motif-name {
  padding: 7px 10px 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

/* The chosen tile keeps its size: the thicker line is drawn inside the tile, not added to it. */
.tyg-motif.is-chosen {
  border-color: var(--tyg-accent-line);
  box-shadow: inset 0 0 0 1.5px var(--tyg-accent-line);
}

.tyg-motif.is-chosen .tyg-motif-name {
  color: var(--tyg-accent);
  font-weight: 700;
}

/* The tick stands on the picture, whose ground is light in both themes: its own colours. */
.tyg-motif-check {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #8a6124;
  color: #fff;
}

.tyg-card {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.25rem;
}

.tyg-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tyg-label {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.tyg-hint,
.tyg-line-group-title {
  color: var(--bs-secondary-color, #6c757d);
}

.tyg-line-group + .tyg-line-group {
  margin-top: 6px;
}

.tyg-line-group-title {
  margin-bottom: 4px;
}

.tyg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* A suggestion: as high as a thumb needs, its words on as many lines as they take. */
.tyg-chip {
  min-height: 44px;
  padding: 6px 14px;
  border: 1px solid var(--bs-border-color, #ced4da);
  border-radius: 22px;
  background: var(--bs-body-bg, #fff);
  color: inherit;
  font: inherit;
  font-size: 0.8125rem;
  text-align: start;
  overflow-wrap: anywhere;
}

.tyg-chip.is-chosen {
  border-color: var(--tyg-accent-line);
  box-shadow: inset 0 0 0 1px var(--tyg-accent-line);
  background: var(--tyg-chosen-ground);
  color: var(--tyg-accent);
  font-weight: 700;
}

.tyg-line-more {
  display: flex;
  flex-wrap: wrap;
  gap: 0 18px;
}

/* Reads as a link, is a button: it opens something on this page. */
.tyg-link {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(var(--bs-link-color-rgb), 1);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: start;
}

.tyg-link:hover,
.tyg-link[aria-pressed='true'] {
  text-decoration: underline;
}

.tyg-error {
  color: var(--bs-form-invalid-color, #dc3545);
}

/* The amount is the small thing here: a short field and a label like the others'. */
.tyg-amount :deep(label) {
  margin-bottom: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.tyg-amount :deep(input) {
  max-width: 10rem;
}

.tyg-amount :deep(fieldset),
.tyg-amount :deep(.form-group) {
  margin-bottom: 0;
}

/* The sheet no wider than on the page a link opens as. */
.tyg-paper {
  max-width: 24rem;
  margin: 0 auto 1rem;
}

.tyg-note {
  color: var(--bs-secondary-color, #6c757d);
  line-height: 1.5;
}

.tyg-actions {
  display: flex;
  justify-content: center;
  margin-top: 1.25rem;
}

/* Whoever walks the page with the keyboard sees where they are. */
.tyg-back:focus-visible,
.tyg-link:focus-visible,
.tyg-chip:focus-visible,
.tyg-motif:focus-visible {
  outline: 2px solid var(--tyg-accent);
  outline-offset: 2px;
}
</style>
