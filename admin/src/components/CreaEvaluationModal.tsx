// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import {
  BBadge,
  BButton,
  BFormInput,
  BFormTextarea,
  BModal,
  BSpinner,
  type ColorVariant,
} from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  Fragment,
  type PropType,
  ref,
  toDisplayString,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useBoldShortcut } from '@/composables/useBoldShortcut'
import { useCreaClipboard } from '@/composables/useCreaClipboard'
import { playCreaSound, primeCreaSound } from '@/composables/useCreaSound'
import { useCreaSupplement } from '@/composables/useCreaSupplement'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import { adminListContributions } from '@/graphql/adminListContributions.graphql'
import {
  creaEvaluateBatch,
  creaEvaluateContribution,
  creaRewriteBatch,
  creaRewriteResponse,
  setCreaSalutation,
} from '@/graphql/crea.graphql'
import { tenureBucket } from '@/utils/tenure'
import IBiCopy from '~icons/bi/copy'
import creaLogo from '../../public/img/crea-logo.jpg'
import classes from './CreaEvaluationModal.module.css'

// Preview flag the backend stub carries so the modal shows a "no AI" banner and
// hides it from the red review flags.
const STUB_PREVIEW_FLAG = 'stub_preview'
// The moderator's signature lives only in the browser (E-014 — no DB field). It is
// filled into the reply locally, so the moderator's name never reaches the server.
const SIGNATURE_STORAGE_KEY = 'crea.moderatorSignature'
// The placeholder Crea closes its reply with; filled in locally with the signature.
const SIGNATURE_PLACEHOLDER = '[SIGNATUR]'
// The placeholder Crea opens its reply with. Unlike the signature, the salutation
// belongs to the participant and is stored on their record (E-013), so the next
// moderator starts from it instead of guessing again. Filled locally either way -
// the participant's name never reaches the API.
const SALUTATION_PLACEHOLDER = '[ANREDE]'
// Crea flags an uncertain salutation (E-005) so the moderator checks it before sending.
const SALUTATION_UNCERTAIN_FLAG = 'anrede_unsicher'
// Matches the users.salutation column, so an over-long value is stopped at the field
// instead of reaching the database and coming back as a driver error.
const SALUTATION_MAX_LENGTH = 255

// A contribution as the list behind the modal and loadSiblings hand it over: only the
// fields read here.
interface Contribution {
  id: number
  userId?: number | null
  memo?: string | null
  amount?: string | number | null
  contributionDate?: string | null
  resubmissionAt?: string | null
  user?: {
    firstName?: string | null
    lastName?: string | null
    salutation?: string | null
    createdAt?: string | null
  } | null
}

type Verdict = 'confirm' | 'inquire' | 'deny'

interface Evaluation {
  responseText: string
  defaultSalutation?: string | null
  overallVerdict: string
  reasoning?: string
  flags?: string[]
  openPoints: { question: string; options: string[] }[]
}

interface Section {
  key: string
  heading: string
  items: Contribution[]
}

// Crea's evaluation modal for a single contribution (DO-4 v1 slice). Advisory
// only: confirm/deny/send stay the existing table buttons; Crea recommends and
// drafts a warm reply. The contribution is passed in as a prop; the evaluation
// runs lazily when the modal is shown (anti-routine, cheaper).
export const CreaEvaluationModal = defineComponent({
  name: 'CreaEvaluationModal',
  props: {
    contribution: {
      type: Object as PropType<Contribution | null>,
      default: null,
    },
  },
  setup(props) {
    const { t, locale } = useI18n()
    const { toastSuccess, toastError } = useAppToast()
    const viewport = useViewport()
    const phone = computed(() => viewport.value === 'mobile')

    const modalVisible = ref(false)
    const loading = ref(false)
    const inactive = ref(false)
    const errorMessage = ref('')
    const evaluation = ref<Evaluation | null>(null)
    const responseText = ref('')
    // The backend reply still carries the [SIGNATUR] placeholder; the signature is
    // filled in locally and reactively, so it appears the moment it is entered or changed.
    const rawResponseText = ref('')
    // The moderator's chosen outcome (E-017). Preselected to Crea's own recommendation
    // when the evaluation arrives, so "follow" = leave it. Pure UI state until the
    // moderator hits "write for my decision".
    const chosenDecision = ref<string | null>(null)
    const moderatorContext = ref('')
    const rewriting = ref(false)
    // What the moderator typed. Empty means "no salutation stored" - the automatic one
    // is then used, shown as this field's hint.
    const salutation = ref('')
    // What is actually in the database for this participant (empty = none). The save
    // button compares against THIS, not against what is displayed: with nothing stored
    // the field shows the automatic salutation as a hint only, so emptying the field
    // leaves nothing to save.
    const storedSalutation = ref('')
    // What the name heuristic alone gives, e.g. "Hallo Gradido". Used whenever the field
    // is empty, so the draft never shows a bare [ANREDE] placeholder.
    const defaultSalutation = ref('')
    const savingSalutation = ref(false)
    // Set once the moderator has stored a salutation for this participant. Crea's
    // "anrede_unsicher" flag is a snapshot of the moment the evaluation arrived, and the
    // field that answers it now sits in the same window - so leaving the warning up after
    // it has been answered would tell the moderator nothing they can act on.
    const salutationSettled = ref(false)
    // What we saved during this session, per participant. The contribution list is not
    // reloaded after saving, so its copy of the participant goes stale the moment a
    // salutation is stored - reading it again would send the old value back into the next
    // evaluation. Keyed by user id; survives closing the window, unlike the fields above.
    const savedSalutations = ref<Record<number, string | null>>({})
    // What the participant's record said when this window opened. loadSiblings re-reads the
    // contributions with fetchPolicy "no-cache", so this is current even when the list behind
    // the modal was loaded before another moderator stored a salutation. undefined = not read
    // yet (no participant, no Apollo provider, failed query), which is NOT the same as null.
    const loadedSalutation = ref<string | null | undefined>(undefined)
    // The salutation to send into an evaluation, newest source first. Each step asks WHETHER
    // that source knows something, not WHAT - a cleared salutation is null, and a nullish
    // check would read that as "nothing recorded" and fall through to an older copy,
    // resurrecting the salutation the moderator just deleted.
    const salutationFor = (contribution: Contribution | null) => {
      const userId = contribution?.userId
      if (userId != null && userId in savedSalutations.value) {
        return savedSalutations.value[userId]
      }
      if (loadedSalutation.value !== undefined) {
        return loadedSalutation.value
      }
      return contribution?.user?.salutation ?? null
    }

    // Something is typed that is not stored yet. Drives the save button, so an unsaved
    // change is visible instead of relying on the moderator remembering.
    const salutationChanged = computed(
      () => salutation.value.trim() !== storedSalutation.value.trim(),
    )
    // The salutation the draft is rendered with: what is typed, or the automatic one.
    const effectiveSalutation = computed(() => salutation.value.trim() || defaultSalutation.value)

    // The public note Crea drafts for the contribution memo on a confirm rewrite (E-019).
    // Editable; empty unless the moderator confirmed a deviation and Crea returned one.
    const supplementText = ref('')

    // Batch mode (E-020): the participant's open contributions, loaded when the modal
    // opens. Two or more -> batch mode (checklist + "Bewerten"); fewer -> the single
    // contribution path as before. selectedIds holds the ticked ones.
    const contributions = ref<Contribution[]>([])
    const selectedIds = ref<number[]>([])
    const isBatch = computed(() => contributions.value.length >= 2)

    // The clock the checklist is built against, taken once when the window opens. Grouping
    // and preselection have to agree on one instant, otherwise a contribution could count
    // as due in the list and as still pending for the tick.
    const openedAt = ref(new Date())

    // The checklist splits by resubmission (E-026). "Put off" means the same thing here as
    // behind the modal, where the list's "Wiedervorlage verbergen" hides exactly those whose
    // date still lies ahead (findContributions.ts): a date that has passed puts the
    // contribution back on the table. Three groups, in the order the moderator works them:
    //   open  - never put off
    //   due   - was put off, the date has arrived
    //   later - put off, the date is still ahead
    const groupedContributions = computed(() => {
      const groups: Record<'open' | 'due' | 'later', Contribution[]> = {
        open: [],
        due: [],
        later: [],
      }
      for (const c of contributions.value) {
        if (!c.resubmissionAt) {
          groups.open.push(c)
          continue
        }
        // An unreadable date still means the contribution was handled once, so it counts as
        // put off rather than falling back into the untouched group.
        const at = new Date(c.resubmissionAt)
        groups[at > openedAt.value ? 'later' : 'due'].push(c)
      }
      return groups
    })

    // Empty groups drop out entirely, so a participant with nothing put off sees the plain
    // list as before - no rule, no heading.
    const contributionSections = computed<Section[]>(() => {
      const { open, due, later } = groupedContributions.value
      return [
        { key: 'open', heading: '', items: open },
        { key: 'due', heading: t('crea.resubmissionDue'), items: due },
        { key: 'later', heading: t('crea.resubmission'), items: later },
      ].filter((section) => section.items.length > 0)
    })

    // One control for both directions, read off the sections so it can never fall out of step
    // with what the checklist shows. Asked for by a moderator for the clearing half: with a
    // long list, ticking the two she wants is quicker than unticking the twenty she does not.
    //
    // Selecting all takes the resubmission groups with it. They start unticked by design
    // (E-026) -- but that governs the DEFAULT, not what the moderator may ask for on purpose;
    // ticking them by hand was free before this button existed.
    const allPickIds = computed(() =>
      contributionSections.value.flatMap((section) => section.items.map((c) => c.id)),
    )

    const toggleAllPicks = () => {
      selectedIds.value = selectedIds.value.length ? [] : [...allPickIds.value]
    }
    // "Crea liest den Beitrag" (one) vs "... die Beiträge" (several) while evaluating.
    const loadingText = computed(() => {
      const count = isBatch.value ? selectedIds.value.length : 1
      return count === 1 ? t('crea.loading') : t('crea.loadingPlural')
    })

    // Fills both placeholders for display. Crea's reply arrives with [ANREDE] and
    // [SIGNATUR] intact, so either can be changed and the draft follows at once.
    const renderDraft = (text: string, salutationValue: string, signature: string) => {
      const withSalutation = salutationValue
        ? text.split(SALUTATION_PLACEHOLDER).join(salutationValue)
        : text
      return signature
        ? withSalutation.split(SIGNATURE_PLACEHOLDER).join(signature)
        : withSalutation
    }

    const loadSignature = () => {
      try {
        return localStorage.getItem(SIGNATURE_STORAGE_KEY) ?? ''
      } catch {
        return ''
      }
    }
    // Declared before applyDraft reads it; the .vue declared it further down, which a
    // `const` in one function scope does not allow to be read earlier.
    const moderatorSignature = ref(loadSignature())

    // The one place the draft is rendered. Every path - first evaluation, batch evaluation,
    // rewrite - goes through here, so none of them can pick a different salutation than the
    // others. Passing the typed value instead of the effective one leaves a bare [ANREDE] in
    // a reply the moderator then sends, and desyncs the watcher below for good.
    const applyDraft = () => {
      responseText.value = renderDraft(
        rawResponseText.value,
        effectiveSalutation.value,
        moderatorSignature.value,
      )
    }

    // Cmd/Ctrl+B wraps the selected text in ** so the moderator gets the familiar
    // bold shortcut in the editable draft (rendered bold once the reply is sent).
    const { onKeydown: onResponseKeydown } = useBoldShortcut(
      () => responseText.value,
      (value: string) => {
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

    watch(moderatorSignature, (value) => {
      try {
        localStorage.setItem(SIGNATURE_STORAGE_KEY, value)
      } catch {
        // ignore storage failures (private mode etc.)
      }
    })

    // Keep the draft in step with both placeholders while the moderator types, and stop
    // following once they have edited the text by hand (then the rendering no longer
    // matches and their edit is safe). The guard renders with the PREVIOUS values, which is
    // why every other path has to render through applyDraft: render the draft any other way
    // and this comparison stops matching, so the draft never follows again.
    watch([effectiveSalutation, moderatorSignature], (_current, [prevSal, prevSig]) => {
      if (
        evaluation.value &&
        responseText.value === renderDraft(rawResponseText.value, prevSal, prevSig)
      ) {
        applyDraft()
      }
    })

    const stubPreview = computed(
      () => evaluation.value?.flags?.includes(STUB_PREVIEW_FLAG) ?? false,
    )
    const visibleFlags = computed(() =>
      (evaluation.value?.flags ?? []).filter(
        (flag) =>
          flag !== STUB_PREVIEW_FLAG &&
          !(flag === SALUTATION_UNCERTAIN_FLAG && salutationSettled.value),
      ),
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
    const contributionMetaOf = (c: Contribution | null) => {
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
    const { mutate: saveSalutationMutation } = useMutation(setCreaSalutation)
    // Not destructured: useApolloClient() is undefined when no Apollo provider is present
    // (e.g. in the CreationConfirm unit tests that mount this modal), and destructuring
    // undefined at setup would throw. loadSiblings guards on it before use.
    const apolloClient = useApolloClient()

    const buildInput = (contribution: Contribution) => ({
      text: contribution.memo ?? '',
      // Only the GDD amount is on the row; the backend derives the hours (1 h = 20 GDD).
      enteredGdd: contribution.amount != null ? Number(contribution.amount) : null,
      // Presence of contributionRef makes the resolver persist crea_records (E-007).
      contributionRef: String(contribution.id),
      // Local only: fills the [ANREDE] placeholder, never forwarded to the API (E-012).
      recipientFirstName: contribution.user?.firstName ?? null,
      // A salutation stored for this participant wins over the name heuristic (E-013).
      salutation: salutationFor(contribution),
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
      salutation.value = ''
      storedSalutation.value = ''
      defaultSalutation.value = ''
      salutationSettled.value = false
      contributions.value = []
      selectedIds.value = []
    }

    // Where an arriving evaluation lands - shared by the single and the batch path so the
    // two cannot drift apart. Seeds the salutation field from what is stored, but only when
    // the field still matches its baseline: a batch re-run must not silently throw away a
    // correction the moderator typed and has not saved yet.
    const applyEvaluation = (result: Evaluation) => {
      evaluation.value = result
      rawResponseText.value = result.responseText
      defaultSalutation.value = result.defaultSalutation ?? ''
      const stored = salutationFor(props.contribution) ?? ''
      if (!salutationChanged.value) {
        salutation.value = stored
      }
      storedSalutation.value = stored
      applyDraft()
      // Preselect Crea's own recommendation, so switching away = deviating.
      chosenDecision.value = result.overallVerdict
      moderatorContext.value = ''
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
        applyEvaluation(response?.data.creaEvaluateContribution)
        playCreaSound()
      } catch (error) {
        // Crea stays dormant on staging until the API key (DO-5) is set; the resolver
        // then throws "Anthropic API is not enabled". Show a calm hint, not an error.
        if (/not enabled/i.test((error as Error).message)) {
          inactive.value = true
        } else {
          errorMessage.value = (error as Error).message
        }
      } finally {
        loading.value = false
      }
    }

    // Loads the participant's open contributions (E-020). Batch mode judges them
    // together; loaded by user id via the existing filter, independent of the list's
    // paging/tab. A generous page size covers the (practically never) >25 case.
    const loadSiblings = async (): Promise<Contribution[]> => {
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
      salutation: salutationFor(props.contribution),
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
        applyEvaluation(response?.data.creaEvaluateBatch)
        playCreaSound()
      } catch (error) {
        if (/not enabled/i.test((error as Error).message)) {
          inactive.value = true
        } else {
          errorMessage.value = (error as Error).message
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
          const result = response?.data.creaRewriteBatch
          rawResponseText.value = result.responseText
          applyDraft()
          // A confirm deviation also carries the public memo note (E-019); surfacing it fills
          // the "Ergänzung" field and enables the "Text ergänzen" button in the reply form.
          supplementText.value = result.memoSupplement ?? ''
        } else {
          const response = await rewriteMutation({
            input: {
              // Non-null: isDeviation needs an evaluation, which only runEvaluation sets -- and it
              // returns early without a contribution.
              ...buildInput(props.contribution!),
              moderatorDecision: chosenDecision.value,
              moderatorContext: moderatorContext.value.trim() || null,
            },
          })
          const result = response?.data.creaRewriteResponse
          rawResponseText.value = result.responseText
          applyDraft()
          // A confirm rewrite also carries the public memo note (E-019); inquire/deny return
          // null. Surfacing it fills the editable field above and the "Text ergänzen" button.
          supplementText.value = result.memoSupplement ?? ''
        }
        // Same "BaDong" cue as the initial and batch evaluation (E-025): a fresh reply just
        // arrived after the moderator deviated.
        playCreaSound()
      } catch (error) {
        toastError((error as Error).message)
      } finally {
        rewriting.value = false
      }
    }

    // The modal stays mounted, so re-read the signature from the browser every time
    // it opens. Reading it only once at setup meant a signature stored in an earlier
    // session (or after a re-login) never showed up without a full page reload.
    const onShown = async () => {
      moderatorSignature.value = loadSignature()
      // Before the query, not after it: a slow connection must not move a contribution from
      // one group to another, and the moderator asked for this list when they opened it.
      openedAt.value = new Date()
      // Load the participant's open contributions: two or more -> batch checklist (no
      // auto-evaluate; the moderator prunes then presses "Bewerten"). Otherwise the single
      // contribution is evaluated right away, as before. Fall back to single on any error.
      loadedSalutation.value = undefined
      let siblings: Contribution[] = []
      try {
        siblings = await loadSiblings()
      } catch {
        siblings = []
      }
      // Those rows were just read with fetchPolicy "no-cache", so they carry the participant's
      // current salutation - unlike the list behind the modal, which may predate another
      // moderator storing one. All rows belong to the same participant, so the first will do.
      if (siblings.length > 0) {
        loadedSalutation.value = siblings[0].user?.salutation ?? null
      }
      if (siblings.length >= 2) {
        contributions.value = siblings
        // Preselect what was never put off (E-026). Anything with a resubmission date has
        // been handled once already and starts unticked - also when the date has arrived,
        // because "seen before" is what decides, not "due today". The contribution whose
        // button was clicked stays ticked wherever it sits: the moderator asked for it.
        const preselected = new Set(groupedContributions.value.open.map((c) => c.id))
        if (props.contribution?.id != null) {
          preselected.add(props.contribution.id)
        }
        selectedIds.value = siblings.filter((c) => preselected.has(c.id)).map((c) => c.id)
      } else {
        contributions.value = []
        runEvaluation()
      }
    }

    // Storing the salutation is an explicit act with a visible confirmation. It used to
    // happen silently on closing the window, which left the moderator unable to tell
    // whether anything had been stored - and made a wrong baseline impossible to notice.
    // An emptied field clears the stored salutation and hands the decision back to the
    // name heuristic.
    const saveSalutation = async () => {
      const userId = props.contribution?.userId
      if (userId == null) {
        return
      }
      const value = salutation.value.trim()
      savingSalutation.value = true
      try {
        await saveSalutationMutation({ userId: Number(userId), salutation: value || null })
        // New baseline, so the button disappears and a further change shows up again.
        storedSalutation.value = value
        savedSalutations.value = { ...savedSalutations.value, [userId]: value || null }
        // A stored salutation answers Crea's "please check the salutation" flag. An emptied
        // one hands the decision back to the heuristic, so the flag is apt again.
        salutationSettled.value = value !== ''
        toastSuccess(t('crea.salutationSaved'))
      } catch {
        // The backend returns a code, not a sentence: the wording belongs here.
        toastError(t('crea.salutationSaveFailed'))
      } finally {
        savingSalutation.value = false
      }
    }

    const verdictVariant = (verdict: string): ColorVariant => {
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

    // One button of the decision group: filled for the chosen outcome, outlined otherwise.
    // The label comes in as a text: a key spelled out at the call is one the i18n check can see.
    const decisionButton = (
      decision: Verdict,
      variant: 'success' | 'warning' | 'danger',
      label: string,
    ) => (
      <BButton
        variant={chosenDecision.value === decision ? variant : `outline-${variant}`}
        size='sm'
        onClick={() => {
          chosenDecision.value = decision
        }}
      >
        {label}
      </BButton>
    )

    const renderTitle = () => (
      <span class='d-flex align-items-center gap-2'>
        <img src={creaLogo} alt={t('crea.title')} class={classes.creaTitleLogo} />
        {` ${t('crea.title')}`}
      </span>
    )

    const renderFooter = () => (
      <div class={classes.creaFooter}>
        <span class={classes.creaFooterSide}></span>
        <BButton
          variant='secondary'
          onClick={() => {
            modalVisible.value = false
          }}
        >
          {t('crea.close')}
        </BButton>
        <span class={[classes.creaFooterSide, classes.creaFooterSideRight]}>
          {isBatch.value ? (
            <BButton
              variant='primary'
              disabled={loading.value || selectedIds.value.length === 0}
              onClick={runBatchEvaluation}
            >
              {t('crea.evaluate')}
            </BButton>
          ) : null}
        </span>
      </div>
    )

    // Batch mode (E-020): the participant's open contributions as a checklist, split
    // by resubmission (E-026). Untouched ones come preselected, anything put off
    // starts unticked; ticking is free either way. Nothing runs until "Bewerten".
    const renderChecklist = () => (
      <>
        <div class='d-flex align-items-baseline gap-3 mb-2'>
          <p class='mb-0 text-muted small flex-grow-1'>{t('crea.selectHint')}</p>
          <button
            type='button'
            class='btn btn-link p-0 small text-nowrap crea-toggle-all'
            onClick={toggleAllPicks}
          >
            {selectedIds.value.length ? t('crea.deselectAll') : t('crea.selectAll')}
          </button>
        </div>
        {contributionSections.value.map((section, index) => (
          <Fragment key={section.key}>
            {index > 0 ? <hr class={classes.creaSectionRule} /> : null}
            {section.heading ? (
              <p class='crea-section-heading mb-2 fw-bold small'>{section.heading}</p>
            ) : null}
            {section.items.map((c) => (
              <div key={c.id} class='form-check mb-2'>
                <input
                  id={`crea-pick-${c.id}`}
                  v-model={selectedIds.value}
                  value={c.id}
                  type='checkbox'
                  class='form-check-input'
                />
                <label for={`crea-pick-${c.id}`} class='form-check-label d-block'>
                  {contributionMetaOf(c) ? (
                    <span class='text-muted small d-block'>{contributionMetaOf(c)}</span>
                  ) : null}
                  <span class={['text-break', classes.creaOriginal]}>{c.memo}</span>
                </label>
              </div>
            ))}
          </Fragment>
        ))}
      </>
    )

    // The contribution itself, shown at the top from the prop so it is visible the
    // moment the modal opens - before Crea's evaluation returns. The large modal hides
    // the row behind it, so without this the moderator cannot see what Crea judges.
    const renderContribution = () => (
      <div class='border rounded p-2 mb-3'>
        <div class='d-flex justify-content-between align-items-baseline mb-1'>
          <strong>
            {contributionUserName.value
              ? contributionUserName.value
              : isBatch.value
                ? t('crea.contributions')
                : t('crea.contribution')}
            {contributionTenure.value ? (
              <small class='text-muted fw-normal'>{` (${toDisplayString(contributionTenure.value)}) `}</small>
            ) : null}
          </strong>
          {!isBatch.value && contributionMeta.value ? (
            <span class='text-muted small ms-3'>{contributionMeta.value}</span>
          ) : null}
        </div>
        {isBatch.value ? (
          renderChecklist()
        ) : (
          // Single mode: the one contribution verbatim, as before.
          <p class={['mb-0 text-break', classes.creaOriginal]}>{contributionMemo.value}</p>
        )}
      </div>
    )

    const renderEvaluation = (result: Evaluation) => (
      <div class={classes.palette}>
        {stubPreview.value ? <div class='alert alert-info'>{t('crea.previewBanner')}</div> : null}
        <p class='mb-3'>
          <strong>{`${t('crea.verdict.label')}:`}</strong>
          <BBadge variant={verdictVariant(result.overallVerdict)} class='ms-2'>
            {result.overallVerdict === 'confirm'
              ? t('crea.verdict.confirm')
              : result.overallVerdict === 'inquire'
                ? t('crea.verdict.inquire')
                : result.overallVerdict}
          </BBadge>
        </p>

        <p class='mb-1'>
          <strong>{t('crea.reasoning')}</strong>
        </p>
        <p class='mb-3 text-break'>{result.reasoning}</p>

        {visibleFlags.value.length ? (
          <div class='mb-3'>
            <p class='mb-1'>
              <strong class='text-danger'>{t('crea.flags')}</strong>
            </p>
            <ul class='mb-0'>
              {visibleFlags.value.map((flag) => (
                <li key={flag} class='text-danger'>
                  {flag === 'discrepancy_recomputed'
                    ? t('crea.flags_map.discrepancy_recomputed')
                    : flag === SALUTATION_UNCERTAIN_FLAG
                      ? t('crea.flags_map.anrede_unsicher')
                      : flag}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {result.openPoints.length ? (
          <div class='mb-3'>
            <p class='mb-1'>
              <strong>{t('crea.openPoints')}</strong>
            </p>
            <ul class='mb-0'>
              {result.openPoints.map((point, index) => (
                // Keyed by position: open points carry no id, as in the .vue.
                <li key={index}>
                  {`${toDisplayString(point.question)} `}
                  {point.options.length ? (
                    <small class='text-muted'>{` (${point.options.join(' / ')}) `}</small>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Your decision (E-017): Crea's own recommendation is preselected, so
            "follow" means leaving it. Switching is pure UI state and costs nothing;
            only "write for my decision" (shown when you deviate) calls Crea again.
            Works in both single and batch mode (batch uses creaRewriteBatch, E-020). */}
        <div class='mb-3'>
          <p class='mb-1'>
            <strong>{t('crea.deviation')}</strong>
          </p>
          <div class='btn-group' role='group'>
            {decisionButton('confirm', 'success', t('crea.decision.confirm'))}
            {decisionButton('inquire', 'warning', t('crea.decision.inquire'))}
            {decisionButton('deny', 'danger', t('crea.decision.deny'))}
          </div>

          {isDeviation.value ? (
            <div class='mt-2'>
              <BFormTextarea
                v-model={moderatorContext.value}
                rows={2}
                placeholder={t('crea.contextPlaceholder')}
                class='mb-1'
              />
              <p class='mb-2 text-muted small'>{t('crea.contextLabel')}</p>
              <BButton
                variant='primary'
                size='sm'
                disabled={rewriting.value}
                onClick={rewriteForDecision}
              >
                {rewriting.value ? <BSpinner small class='me-1' /> : null}
                {` ${t('crea.rewrite')}`}
              </BButton>
            </div>
          ) : null}
        </div>

        {/* E-019: on a confirm deviation Crea also drafts a short public note for the
            contribution memo. Editable here; the "Text ergänzen" button in the reply
            form appends it (with the 💬 + first-name marker added locally by the code). */}
        {supplementText.value ? (
          <div class='mb-3'>
            <p class='mb-1'>
              <strong>{t('crea.supplement')}</strong>
            </p>
            <BFormInput v-model={supplementText.value} size='sm' />
            <p class='mt-1 mb-0 text-muted small'>{t('crea.supplementHint')}</p>
          </div>
        ) : null}

        <div class='mb-3'>
          <label class='mb-1 d-block' for='crea-salutation'>
            <strong>{t('crea.salutation')}</strong>
          </label>
          <div class='d-flex align-items-start gap-2'>
            <BFormInput
              id='crea-salutation'
              v-model={salutation.value}
              size='sm'
              placeholder={defaultSalutation.value}
              // Not a prop of BFormInput: it falls through to the <input>.
              maxlength={SALUTATION_MAX_LENGTH}
            />
            {salutationChanged.value ? (
              <BButton
                variant='primary'
                size='sm'
                class='flex-shrink-0'
                disabled={savingSalutation.value}
                onClick={saveSalutation}
              >
                {t('crea.salutationSave')}
              </BButton>
            ) : null}
          </div>
          <p class='mt-1 mb-0 text-muted small'>{t('crea.salutationHint')}</p>
        </div>

        <p class='mb-1'>
          <strong>{t('crea.response')}</strong>
        </p>
        {/* Half the rows on a phone: sixteen made the window 1925px tall at 320 × 568, the
            reply alone 398px of it (measured 23.10.2026). */}
        <BFormTextarea
          v-model={responseText.value}
          rows={phone.value ? 8 : 16}
          class='mb-2'
          // Falls through to the <textarea>.
          onKeydown={onResponseKeydown}
        />
        {/* How to get the suggestion into the contribution -- a new moderator would not
            know otherwise -- next to a quiet copy-to-clipboard icon (rarely needed now
            that the reply form has an "insert draft" button). */}
        <div class='d-flex justify-content-between align-items-start gap-3'>
          <p class='mb-0 text-muted small'>{t('crea.useHint')}</p>
          <BButton
            variant='link'
            size='sm'
            class='p-1 text-muted flex-shrink-0'
            onClick={copyResponse}
            // Falls through to the <button>.
            title={t('crea.copy')}
          >
            <IBiCopy />
          </BButton>
        </div>

        <div class='mt-3'>
          <p class='mb-1'>
            <strong>{t('crea.signature')}</strong>
          </p>
          <BFormTextarea
            v-model={moderatorSignature.value}
            rows={2}
            placeholder={t('crea.signaturePlaceholder')}
            class='mb-2'
          />
          <p class='mt-1 mb-0 text-muted small'>{t('crea.signatureHint')}</p>
        </div>

        <p class='mt-3 mb-0 text-muted small'>{t('crea.advisoryHint')}</p>
      </div>
    )

    const renderBody = () => [
      contributionMemo.value || isBatch.value ? renderContribution() : null,
      loading.value ? (
        <div class='text-center py-4'>
          <BSpinner class='me-2' />
          {` ${loadingText.value}`}
        </div>
      ) : inactive.value ? (
        <div class='alert alert-info mb-0'>{t('crea.inactive')}</div>
      ) : errorMessage.value ? (
        <div class='alert alert-danger mb-0'>{errorMessage.value}</div>
      ) : evaluation.value ? (
        renderEvaluation(evaluation.value)
      ) : null,
    ]

    return () => (
      // Scrollable on every width, as the decision dialog of the contribution page (AO-004): the
      // head and the foot with "Schließen" stay in the window and the body scrolls. The whole
      // window scrolled before, and on a 320 × 568 phone its foot lay 1365px below the edge.
      <BModal
        id='crea-evaluation-modal'
        v-model={modalVisible.value}
        size='lg'
        scrollable
        onShown={onShown}
        onHidden={resetState}
      >
        {{ title: renderTitle, footer: renderFooter, default: renderBody }}
      </BModal>
    )
  },
})
