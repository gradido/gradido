<template>
  <BModal
    id="crea-evaluation-modal"
    v-model="modalVisible"
    size="lg"
    @shown="onShown"
    @hidden="resetState"
  >
    <template #title>
      <span class="d-flex align-items-center gap-2">
        <img src="../../public/img/crea-logo.jpg" :alt="$t('crea.title')" class="crea-title-logo" />
        {{ $t('crea.title') }}
      </span>
    </template>

    <template #footer>
      <div class="crea-footer">
        <span class="crea-footer-side"></span>
        <BButton variant="secondary" @click="modalVisible = false">
          {{ $t('crea.close') }}
        </BButton>
        <span class="crea-footer-side crea-footer-side-right">
          <BButton
            v-if="isBatch"
            variant="primary"
            :disabled="loading || selectedIds.length === 0"
            @click="runBatchEvaluation"
          >
            {{ $t('crea.evaluate') }}
          </BButton>
        </span>
      </div>
    </template>
    <!-- The contribution itself, shown at the top from the prop so it is visible the
         moment the modal opens - before Crea's evaluation returns. The large modal hides
         the row behind it, so without this the moderator cannot see what Crea judges. -->
    <div v-if="contributionMemo || isBatch" class="border rounded p-2 mb-3">
      <div class="d-flex justify-content-between align-items-baseline mb-1">
        <strong>
          <template v-if="contributionUserName">{{ contributionUserName }}</template>
          <template v-else-if="isBatch">{{ $t('crea.contributions') }}</template>
          <template v-else>{{ $t('crea.contribution') }}</template>
          <small v-if="contributionTenure" class="text-muted fw-normal">
            ({{ contributionTenure }})
          </small>
        </strong>
        <span v-if="!isBatch && contributionMeta" class="text-muted small ms-3">
          {{ contributionMeta }}
        </span>
      </div>

      <!-- Batch mode (E-020): the participant's open contributions as a checklist, all
           preselected; unchecking one leaves it out. Nothing runs until "Bewerten". -->
      <template v-if="isBatch">
        <p class="mb-2 text-muted small">{{ $t('crea.selectHint') }}</p>
        <div v-for="c in contributions" :key="c.id" class="form-check mb-2">
          <input
            :id="`crea-pick-${c.id}`"
            v-model="selectedIds"
            :value="c.id"
            type="checkbox"
            class="form-check-input"
          />
          <label :for="`crea-pick-${c.id}`" class="form-check-label d-block">
            <span v-if="contributionMetaOf(c)" class="text-muted small d-block">
              {{ contributionMetaOf(c) }}
            </span>
            <span class="text-break crea-original">{{ c.memo }}</span>
          </label>
        </div>
      </template>

      <!-- Single mode: the one contribution verbatim, as before. -->
      <p v-else class="mb-0 text-break crea-original">{{ contributionMemo }}</p>
    </div>

    <div v-if="loading" class="text-center py-4">
      <BSpinner class="me-2" />
      {{ loadingText }}
    </div>

    <div v-else-if="inactive" class="alert alert-info mb-0">
      {{ $t('crea.inactive') }}
    </div>

    <div v-else-if="errorMessage" class="alert alert-danger mb-0">
      {{ errorMessage }}
    </div>

    <div v-else-if="evaluation">
      <div v-if="stubPreview" class="alert alert-info">{{ $t('crea.previewBanner') }}</div>
      <p class="mb-3">
        <strong>{{ $t('crea.verdict.label') }}:</strong>
        <BBadge :variant="verdictVariant(evaluation.overallVerdict)" class="ms-2">
          <template v-if="evaluation.overallVerdict === 'confirm'">
            {{ $t('crea.verdict.confirm') }}
          </template>
          <template v-else-if="evaluation.overallVerdict === 'inquire'">
            {{ $t('crea.verdict.inquire') }}
          </template>
          <template v-else>{{ evaluation.overallVerdict }}</template>
        </BBadge>
      </p>

      <p class="mb-1">
        <strong>{{ $t('crea.reasoning') }}</strong>
      </p>
      <p class="mb-3 text-break">{{ evaluation.reasoning }}</p>

      <div v-if="visibleFlags.length" class="mb-3">
        <p class="mb-1">
          <strong class="text-danger">{{ $t('crea.flags') }}</strong>
        </p>
        <ul class="mb-0">
          <li v-for="flag in visibleFlags" :key="flag" class="text-danger">
            <template v-if="flag === 'discrepancy_recomputed'">
              {{ $t('crea.flags_map.discrepancy_recomputed') }}
            </template>
            <template v-else-if="flag === 'anrede_unsicher'">
              {{ $t('crea.flags_map.anrede_unsicher') }}
            </template>
            <template v-else>{{ flag }}</template>
          </li>
        </ul>
      </div>

      <div v-if="evaluation.openPoints.length" class="mb-3">
        <p class="mb-1">
          <strong>{{ $t('crea.openPoints') }}</strong>
        </p>
        <ul class="mb-0">
          <li v-for="(point, index) in evaluation.openPoints" :key="index">
            {{ point.question }}
            <small v-if="point.options.length" class="text-muted">
              ({{ point.options.join(' / ') }})
            </small>
          </li>
        </ul>
      </div>

      <!-- Your decision (E-017): Crea's own recommendation is preselected, so
           "follow" means leaving it. Switching is pure UI state and costs nothing;
           only "write for my decision" (shown when you deviate) calls Crea again.
           Works in both single and batch mode (batch uses creaRewriteBatch, E-020). -->
      <div class="mb-3">
        <p class="mb-1">
          <strong>{{ $t('crea.deviation') }}</strong>
        </p>
        <div class="btn-group" role="group">
          <BButton
            :variant="chosenDecision === 'confirm' ? 'success' : 'outline-success'"
            size="sm"
            @click="chosenDecision = 'confirm'"
          >
            {{ $t('crea.decision.confirm') }}
          </BButton>
          <BButton
            :variant="chosenDecision === 'inquire' ? 'warning' : 'outline-warning'"
            size="sm"
            @click="chosenDecision = 'inquire'"
          >
            {{ $t('crea.decision.inquire') }}
          </BButton>
          <BButton
            :variant="chosenDecision === 'deny' ? 'danger' : 'outline-danger'"
            size="sm"
            @click="chosenDecision = 'deny'"
          >
            {{ $t('crea.decision.deny') }}
          </BButton>
        </div>

        <div v-if="isDeviation" class="mt-2">
          <BFormTextarea
            v-model="moderatorContext"
            :rows="2"
            :placeholder="$t('crea.contextPlaceholder')"
            class="mb-1"
          />
          <p class="mb-2 text-muted small">{{ $t('crea.contextLabel') }}</p>
          <BButton variant="primary" size="sm" :disabled="rewriting" @click="rewriteForDecision">
            <BSpinner v-if="rewriting" small class="me-1" />
            {{ $t('crea.rewrite') }}
          </BButton>
        </div>
      </div>

      <!-- E-019: on a confirm deviation Crea also drafts a short public note for the
           contribution memo. Editable here; the "Text ergänzen" button in the reply
           form appends it (with the 💬 + first-name marker added locally by the code). -->
      <div v-if="supplementText" class="mb-3">
        <p class="mb-1">
          <strong>{{ $t('crea.supplement') }}</strong>
        </p>
        <BFormInput v-model="supplementText" size="sm" />
        <p class="mt-1 mb-0 text-muted small">{{ $t('crea.supplementHint') }}</p>
      </div>

      <p class="mb-1">
        <strong>{{ $t('crea.response') }}</strong>
      </p>
      <BFormTextarea v-model="responseText" :rows="16" class="mb-2" @keydown="onResponseKeydown" />
      <!-- How to get the suggestion into the contribution -- a new moderator would not
           know otherwise -- next to a quiet copy-to-clipboard icon (rarely needed now
           that the reply form has an "insert draft" button). -->
      <div class="d-flex justify-content-between align-items-start gap-3">
        <p class="mb-0 text-muted small">{{ $t('crea.useHint') }}</p>
        <BButton
          variant="link"
          size="sm"
          class="p-1 text-muted flex-shrink-0"
          :title="$t('crea.copy')"
          @click="copyResponse"
        >
          <IBiCopy />
        </BButton>
      </div>

      <div class="mt-3">
        <p class="mb-1">
          <strong>{{ $t('crea.signature') }}</strong>
        </p>
        <BFormTextarea
          v-model="moderatorSignature"
          :rows="2"
          :placeholder="$t('crea.signaturePlaceholder')"
          class="mb-2"
        />
        <p class="mt-1 mb-0 text-muted small">{{ $t('crea.signatureHint') }}</p>
      </div>

      <p class="mt-3 mb-0 text-muted small">{{ $t('crea.advisoryHint') }}</p>
    </div>
  </BModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminListContributions } from '@/graphql/adminListContributions.graphql'
import {
  creaEvaluateBatch,
  creaEvaluateContribution,
  creaRewriteBatch,
  creaRewriteResponse,
} from '@/graphql/crea.graphql'
import { useBoldShortcut } from '@/composables/useBoldShortcut'
import { useCreaClipboard } from '@/composables/useCreaClipboard'
import { useCreaSupplement } from '@/composables/useCreaSupplement'
import { primeCreaSound, playCreaSound } from '@/composables/useCreaSound'
import { tenureBucket } from '@/utils/tenure'

// Preview flag the backend stub carries so the modal shows a "no AI" banner and
// hides it from the red review flags.
const STUB_PREVIEW_FLAG = 'stub_preview'
// The moderator's signature lives only in the browser (E-014 — no DB field). It is
// filled into the reply locally, so the moderator's name never reaches the server.
const SIGNATURE_STORAGE_KEY = 'crea.moderatorSignature'
// The placeholder Crea closes its reply with; filled in locally with the signature.
const SIGNATURE_PLACEHOLDER = '[SIGNATUR]'

// Crea's evaluation modal for a single contribution (DO-4 v1 slice). Advisory
// only: confirm/deny/send stay the existing table buttons; Crea recommends and
// drafts a warm reply. The contribution is passed in as a prop; the evaluation
// runs lazily when the modal is shown (anti-routine, cheaper).
const props = defineProps({
  contribution: {
    type: Object,
    default: null,
  },
})

const { t, locale } = useI18n()
const { toastSuccess, toastError } = useAppToast()

const modalVisible = ref(false)
const loading = ref(false)
const inactive = ref(false)
const errorMessage = ref('')
const evaluation = ref(null)
const responseText = ref('')
// The backend reply still carries the [SIGNATUR] placeholder; the signature is
// filled in locally and reactively, so it appears the moment it is entered or changed.
const rawResponseText = ref('')
// The moderator's chosen outcome (E-017). Preselected to Crea's own recommendation
// when the evaluation arrives, so "follow" = leave it. Pure UI state until the
// moderator hits "write for my decision".
const chosenDecision = ref(null)
const moderatorContext = ref('')
const rewriting = ref(false)
// The public note Crea drafts for the contribution memo on a confirm rewrite (E-019).
// Editable; empty unless the moderator confirmed a deviation and Crea returned one.
const supplementText = ref('')

// Batch mode (E-020): the participant's open contributions, loaded when the modal
// opens. Two or more -> batch mode (checklist + "Bewerten"); fewer -> the single
// contribution path as before. selectedIds holds the ticked ones (all preselected).
const contributions = ref([])
const selectedIds = ref([])
const isBatch = computed(() => contributions.value.length >= 2)
// "Crea liest den Beitrag" (one) vs "... die Beiträge" (several) while evaluating.
const loadingText = computed(() => {
  const count = isBatch.value ? selectedIds.value.length : 1
  return count === 1 ? t('crea.loading') : t('crea.loadingPlural')
})

const applySignature = (text, signature) =>
  signature ? text.split(SIGNATURE_PLACEHOLDER).join(signature) : text

// Cmd/Ctrl+B wraps the selected text in ** so the moderator gets the familiar
// bold shortcut in the editable draft (rendered bold once the reply is sent).
const { onKeydown: onResponseKeydown } = useBoldShortcut(
  () => responseText.value,
  (value) => {
    responseText.value = value
  },
)

// Hold Crea's current draft (with the moderator's edits) in the browser so it can be
// inserted into the reply field with one click — no OS clipboard needed inside the
// admin. Guard on a real, non-empty evaluation so closing the modal (which clears
// responseText via resetState) never wipes the stored proposal.
const { setLastResponse } = useCreaClipboard()
watch(responseText, (value) => {
  if (evaluation.value && value) {
    setLastResponse(value)
  }
})

// Same bridge for the memo supplement (E-019): hold Crea's note (with the moderator's
// edits) in the browser so the "Text ergänzen" button in the reply form can append it.
// Guard on a non-empty value so closing/resetting the modal never wipes the stored note.
const { setLastSupplement } = useCreaSupplement()
watch(supplementText, (value) => {
  if (value) {
    setLastSupplement(value)
  }
})

const loadSignature = () => {
  try {
    return localStorage.getItem(SIGNATURE_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}
const moderatorSignature = ref(loadSignature())
watch(moderatorSignature, (value, previous) => {
  try {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, value)
  } catch {
    // ignore storage failures (private mode etc.)
  }
  // Keep the draft's signature in sync as long as the moderator hasn't hand-edited it.
  if (evaluation.value && responseText.value === applySignature(rawResponseText.value, previous)) {
    responseText.value = applySignature(rawResponseText.value, value)
  }
})

const stubPreview = computed(() => evaluation.value?.flags?.includes(STUB_PREVIEW_FLAG) ?? false)
const visibleFlags = computed(() =>
  (evaluation.value?.flags ?? []).filter((flag) => flag !== STUB_PREVIEW_FLAG),
)
// The moderator has picked an outcome other than Crea's recommendation.
const isDeviation = computed(
  () => evaluation.value != null && chosenDecision.value !== evaluation.value.overallVerdict,
)

// The original contribution text, taken from the prop so it shows immediately on open
// (independent of the evaluation call). Later, judging several contributions at once,
// this becomes a list separated by thin rules; for now it is the single contribution.
const contributionMemo = computed(() => props.contribution?.memo ?? '')

// Hours (1 h = 20 GDD), the entered GDD and the date, shown next to the heading so the
// moderator sees the contribution's key facts at a glance. Parts join only when present,
// so a missing field simply drops out.
const contributionMetaOf = (c) => {
  if (!c) {
    return ''
  }
  const parts = []
  if (c.amount != null) {
    const gdd = Number(c.amount)
    const hours = gdd / 20
    const hoursText = hours.toLocaleString(locale.value, { maximumFractionDigits: 1 })
    parts.push(`${hoursText} ${t('crea.hoursUnit')}`)
    parts.push(`${gdd.toLocaleString(locale.value)} GDD`)
  }
  if (c.contributionDate) {
    const date = new Date(c.contributionDate)
    if (!Number.isNaN(date.getTime())) {
      parts.push(date.toLocaleDateString(locale.value))
    }
  }
  return parts.join(' · ')
}
const contributionMeta = computed(() => contributionMetaOf(props.contribution))

// The participant's full name + registration date, shown as the box heading instead of
// a generic label. Display only: the name stays in our system (like the local [ANREDE]
// fill), never reaches the API, and the persisted record stays pseudonymous.
const contributionUserName = computed(() => {
  const u = props.contribution?.user
  return u ? [u.firstName, u.lastName].filter(Boolean).join(' ') : ''
})
// Relative tenure ("seit drei Wochen") instead of an absolute date - quicker to grasp and
// no year mix-ups. The bucket picks the coarse unit; the singular/plural key is chosen
// explicitly (static keys, so the i18n linter sees each one as used).
const contributionTenure = computed(() => {
  const created = props.contribution?.user?.createdAt
  if (!created) {
    return ''
  }
  const bucket = tenureBucket(created)
  if (!bucket) {
    return ''
  }
  const { unit, count } = bucket
  if (unit === 'today') {
    return t('crea.tenure.today')
  }
  if (unit === 'days') {
    return count === 1 ? t('crea.tenure.day') : t('crea.tenure.days', { count })
  }
  if (unit === 'weeks') {
    return count === 1 ? t('crea.tenure.week') : t('crea.tenure.weeks', { count })
  }
  if (unit === 'months') {
    return count === 1 ? t('crea.tenure.month') : t('crea.tenure.months', { count })
  }
  return count === 1 ? t('crea.tenure.year') : t('crea.tenure.years', { count })
})

const { mutate: evaluateMutation } = useMutation(creaEvaluateContribution)
const { mutate: rewriteMutation } = useMutation(creaRewriteResponse)
const { mutate: evaluateBatchMutation } = useMutation(creaEvaluateBatch)
const { mutate: rewriteBatchMutation } = useMutation(creaRewriteBatch)
// Not destructured: useApolloClient() is undefined when no Apollo provider is present
// (e.g. in the CreationConfirm unit tests that mount this modal), and destructuring
// undefined at setup would throw. loadSiblings guards on it before use.
const apolloClient = useApolloClient()

const buildInput = (contribution) => ({
  text: contribution.memo ?? '',
  // Only the GDD amount is on the row; the backend derives the hours (1 h = 20 GDD).
  enteredGdd: contribution.amount != null ? Number(contribution.amount) : null,
  // Presence of contributionRef makes the resolver persist crea_records (E-007).
  contributionRef: String(contribution.id),
  // Local only: fills the [ANREDE] placeholder, never forwarded to the API (E-012).
  recipientFirstName: contribution.user?.firstName ?? null,
  // Pseudonymous handle for the record — the user id, never a name (E-010).
  personPseudonym: contribution.userId != null ? String(contribution.userId) : null,
  date: contribution.contributionDate ?? null,
  uiLanguage: locale.value,
})

const resetState = () => {
  loading.value = false
  inactive.value = false
  errorMessage.value = ''
  evaluation.value = null
  responseText.value = ''
  rawResponseText.value = ''
  chosenDecision.value = null
  moderatorContext.value = ''
  rewriting.value = false
  supplementText.value = ''
  contributions.value = []
  selectedIds.value = []
}

const runEvaluation = async () => {
  if (!props.contribution) {
    return
  }
  resetState()
  loading.value = true
  primeCreaSound()
  try {
    const response = await evaluateMutation({ input: buildInput(props.contribution) })
    evaluation.value = response.data.creaEvaluateContribution
    rawResponseText.value = evaluation.value.responseText
    responseText.value = applySignature(rawResponseText.value, moderatorSignature.value)
    // Preselect Crea's own recommendation, so switching away = deviating.
    chosenDecision.value = evaluation.value.overallVerdict
    moderatorContext.value = ''
    playCreaSound()
  } catch (error) {
    // Crea stays dormant on staging until the API key (DO-5) is set; the resolver
    // then throws "Anthropic API is not enabled". Show a calm hint, not an error.
    if (/not enabled/i.test(error.message)) {
      inactive.value = true
    } else {
      errorMessage.value = error.message
    }
  } finally {
    loading.value = false
  }
}

// Loads the participant's open contributions (E-020). Batch mode judges them
// together; loaded by user id via the existing filter, independent of the list's
// paging/tab. A generous page size covers the (practically never) >25 case.
const loadSiblings = async () => {
  const userId = props.contribution?.userId
  if (userId == null || !apolloClient) {
    return []
  }
  const { data } = await apolloClient.resolveClient().query({
    query: adminListContributions,
    variables: {
      filter: { statusFilter: ['IN_PROGRESS', 'PENDING'], userId },
      paginated: { currentPage: 1, pageSize: 50, order: 'DESC' },
    },
    fetchPolicy: 'no-cache',
  })
  return data?.adminListContributions?.contributionList ?? []
}

const buildBatchInput = () => ({
  contributions: contributions.value
    .filter((c) => selectedIds.value.includes(c.id))
    .map((c) => ({
      text: c.memo ?? '',
      enteredGdd: c.amount != null ? Number(c.amount) : null,
      date: c.contributionDate ?? null,
    })),
  // Local only: fills [ANREDE], never forwarded to the API (E-012). All contributions
  // belong to the same participant, so one first name covers them.
  recipientFirstName: props.contribution?.user?.firstName ?? null,
  uiLanguage: locale.value,
})

// Batch evaluation: judge the ticked contributions together into ONE verdict + ONE
// reply. Runs only on the "Bewerten" click (and re-runs after the selection changes),
// so the moderator can prune first. No persistence (E-020).
const runBatchEvaluation = async () => {
  if (selectedIds.value.length === 0) {
    return
  }
  loading.value = true
  inactive.value = false
  errorMessage.value = ''
  evaluation.value = null
  primeCreaSound()
  try {
    const response = await evaluateBatchMutation({ input: buildBatchInput() })
    evaluation.value = response.data.creaEvaluateBatch
    rawResponseText.value = evaluation.value.responseText
    responseText.value = applySignature(rawResponseText.value, moderatorSignature.value)
    // Preselect Crea's own overall recommendation, so switching a button = deviating.
    chosenDecision.value = evaluation.value.overallVerdict
    moderatorContext.value = ''
    playCreaSound()
  } catch (error) {
    if (/not enabled/i.test(error.message)) {
      inactive.value = true
    } else {
      errorMessage.value = error.message
    }
  } finally {
    loading.value = false
  }
}

// The moderator deviated: ask Crea for a fresh reply text for the chosen outcome
// (+ optional context). Only the reply text changes — Crea's frozen assessment
// (badge, reasoning, open points) stays put, so `rewriting` is separate from
// `loading` (which would hide that whole block). Does not persist (E-017).
const rewriteForDecision = async () => {
  if (!isDeviation.value) {
    return
  }
  rewriting.value = true
  primeCreaSound()
  try {
    if (isBatch.value) {
      // Batch deviation (E-020): one fresh joint reply for the chosen outcome. No
      // memoSupplement in batch mode ("Text ergänzen" is single-contribution, E-019).
      const response = await rewriteBatchMutation({
        input: {
          ...buildBatchInput(),
          moderatorDecision: chosenDecision.value,
          moderatorContext: moderatorContext.value.trim() || null,
        },
      })
      const result = response.data.creaRewriteBatch
      rawResponseText.value = result.responseText
      responseText.value = applySignature(rawResponseText.value, moderatorSignature.value)
      // A confirm deviation also carries the public memo note (E-019); surfacing it fills
      // the "Ergänzung" field and enables the "Text ergänzen" button in the reply form.
      supplementText.value = result.memoSupplement ?? ''
    } else {
      const response = await rewriteMutation({
        input: {
          ...buildInput(props.contribution),
          moderatorDecision: chosenDecision.value,
          moderatorContext: moderatorContext.value.trim() || null,
        },
      })
      const result = response.data.creaRewriteResponse
      rawResponseText.value = result.responseText
      responseText.value = applySignature(rawResponseText.value, moderatorSignature.value)
      // A confirm rewrite also carries the public memo note (E-019); inquire/deny return
      // null. Surfacing it fills the editable field above and the "Text ergänzen" button.
      supplementText.value = result.memoSupplement ?? ''
    }
    // Same "BaDong" cue as the initial and batch evaluation (E-025): a fresh reply just
    // arrived after the moderator deviated.
    playCreaSound()
  } catch (error) {
    toastError(error.message)
  } finally {
    rewriting.value = false
  }
}

// The modal stays mounted, so re-read the signature from the browser every time
// it opens. Reading it only once at setup meant a signature stored in an earlier
// session (or after a re-login) never showed up without a full page reload.
const onShown = async () => {
  moderatorSignature.value = loadSignature()
  // Load the participant's open contributions: two or more -> batch checklist (no
  // auto-evaluate; the moderator prunes then presses "Bewerten"). Otherwise the single
  // contribution is evaluated right away, as before. Fall back to single on any error.
  let siblings = []
  try {
    siblings = await loadSiblings()
  } catch {
    siblings = []
  }
  if (siblings.length >= 2) {
    contributions.value = siblings
    selectedIds.value = siblings.map((c) => c.id)
  } else {
    contributions.value = []
    runEvaluation()
  }
}

const verdictVariant = (verdict) => {
  if (verdict === 'confirm') {
    return 'success'
  }
  if (verdict === 'inquire') {
    return 'warning'
  }
  return 'secondary'
}

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(responseText.value)
    toastSuccess(t('crea.copied'))
  } catch {
    toastError(t('crea.copyFailed'))
  }
}
</script>

<style scoped>
.crea-original {
  white-space: pre-line;
}

.crea-title-logo {
  display: block;
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 20%;
}

/* Footer: primary action ("Bewerten") on the right, "Schließen" centred. */
.crea-footer {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
}

.crea-footer-side {
  display: flex;
  flex: 1 1 0;
}

.crea-footer-side-right {
  justify-content: flex-end;
}

/* Crea-scoped Gradido palette for the decision buttons + verdict badge. The admin
   otherwise ships stock Bootstrap; these three tones match the wallet toast colours
   (green #047006 / gold #c58d38 / red #c62828). Gold carries dark text for contrast.
   We override Bootstrap's own --bs-btn-* variables so hover/active/disabled follow. */
:deep(.btn-success) {
  --bs-btn-bg: #047006;
  --bs-btn-border-color: #047006;
  --bs-btn-hover-bg: #035c05;
  --bs-btn-hover-border-color: #035c05;
  --bs-btn-active-bg: #035c05;
  --bs-btn-active-border-color: #035c05;
  --bs-btn-disabled-bg: #047006;
  --bs-btn-disabled-border-color: #047006;
}

:deep(.btn-outline-success) {
  --bs-btn-color: #047006;
  --bs-btn-border-color: #047006;
  --bs-btn-hover-bg: #047006;
  --bs-btn-hover-border-color: #047006;
  --bs-btn-active-bg: #047006;
  --bs-btn-active-border-color: #047006;
}

:deep(.btn-warning) {
  --bs-btn-bg: #c58d38;
  --bs-btn-border-color: #c58d38;
  --bs-btn-color: #2c2c2c;
  --bs-btn-hover-bg: #b57f2f;
  --bs-btn-hover-border-color: #b57f2f;
  --bs-btn-hover-color: #2c2c2c;
  --bs-btn-active-bg: #b57f2f;
  --bs-btn-active-border-color: #b57f2f;
  --bs-btn-active-color: #2c2c2c;
  --bs-btn-disabled-bg: #c58d38;
  --bs-btn-disabled-border-color: #c58d38;
  --bs-btn-disabled-color: #2c2c2c;
}

:deep(.btn-outline-warning) {
  --bs-btn-color: #8a5f1c;
  --bs-btn-border-color: #c58d38;
  --bs-btn-hover-bg: #c58d38;
  --bs-btn-hover-border-color: #c58d38;
  --bs-btn-hover-color: #2c2c2c;
  --bs-btn-active-bg: #c58d38;
  --bs-btn-active-border-color: #c58d38;
  --bs-btn-active-color: #2c2c2c;
}

:deep(.btn-danger) {
  --bs-btn-bg: #c62828;
  --bs-btn-border-color: #c62828;
  --bs-btn-hover-bg: #a81f1f;
  --bs-btn-hover-border-color: #a81f1f;
  --bs-btn-active-bg: #a81f1f;
  --bs-btn-active-border-color: #a81f1f;
  --bs-btn-disabled-bg: #c62828;
  --bs-btn-disabled-border-color: #c62828;
}

:deep(.btn-outline-danger) {
  --bs-btn-color: #c62828;
  --bs-btn-border-color: #c62828;
  --bs-btn-hover-bg: #c62828;
  --bs-btn-hover-border-color: #c62828;
  --bs-btn-active-bg: #c62828;
  --bs-btn-active-border-color: #c62828;
}

:deep(.badge.text-bg-success) {
  color: #fff;
  background-color: #047006;
}

:deep(.badge.text-bg-warning) {
  color: #2c2c2c;
  background-color: #c58d38;
}
</style>
