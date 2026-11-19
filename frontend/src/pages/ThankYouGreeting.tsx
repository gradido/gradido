// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { BButton, BFormInput, BFormTextarea, type ButtonVariant } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  nextTick,
  onUnmounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ValidatedInput } from '@/components/Inputs/ValidatedInput'
import { RedeemThanksPaper } from '@/components/LinkInformations/RedeemThanksPaper'
import {
  type ThankYouGreetingCreated,
  ThankYouGreetingDone,
} from '@/components/ThankYouGreeting/ThankYouGreetingDone'
import {
  type ThankYouPhoto,
  ThankYouPictureChoice,
} from '@/components/ThankYouGreeting/ThankYouPictureChoice'
import { useAmountInText } from '@/composables/useAmountInText'
import { rememberGreetingPicture } from '@/composables/useGreetingPictures'
import { useLinkDraft } from '@/composables/useLinkDraft'
import { LINK_VALID_DAYS, linkAmountMax } from '@/constants'
import { addThankYouGreetingPicture, createTransactionLink } from '@/graphql/mutations'
import { thankYouGreetingPictureRenditions } from '@/graphql/queries'
import { useWalletStore } from '@/store/useWalletStore'
import { staysInWallet } from '@/utils/backOrOverview'
import { chatImageProblemWords, chatImageRefusal } from '@/utils/chatImage'
import {
  greetingMemo,
  greetingParts,
  THANK_YOU_LINE_MAX_CHARS,
  THANK_YOU_RECIPIENT_NAME_MAX_CHARS,
} from '@/utils/thankYouGreeting'
import { THANK_YOU_MOTIF_KEYS } from '@/utils/thankYouMotifs'
import {
  encodeThankYouPictures,
  openThankYouRenditions,
  thankYouPictureInput,
} from '@/utils/thankYouPicture'
import {
  amount as amountUpTo,
  memo as memoSchema,
  translateYupErrorString,
} from '@/validationSchemas'
import classes from './ThankYouGreeting.module.scss'

const PICTURE = 'picture'
const WORDS = 'words'
const PREVIEW = 'preview'
const DONE = 'done'
type Step = typeof PICTURE | typeof WORDS | typeof PREVIEW | typeof DONE
const STEPS: Step[] = [PICTURE, WORDS, PREVIEW]

// The twelve lines in their three groups (the catalogue of 29.08.2026), and the four that
// stand there at first.
const LINE_GROUPS = [
  { name: 'for-something', lines: ['help', 'talk', 'time', 'effort'] },
  { name: 'just-so', lines: ['just-so', 'encouragement', 'appreciation', 'joy'] },
  { name: 'occasion', lines: ['welcome', 'birthday', 'recovery', 'farewell'] },
]
const LINE_KEYS = LINE_GROUPS.flatMap((group) => group.lines)
const QUICK_LINES = ['help', 'talk', 'just-so', 'joy']
const OWN = 'own'

/** What the member typed and chose, as the page holds it. */
type GreetingForm = {
  motif: string | null
  recipientName: string
  lineChoice: string | null
  ownLine: string
  words: string
  amount: string
}

/** A photo that came from a greeting made before: opened from the two JPEGs it was made with. */
type TakenOverPhoto = NonNullable<Awaited<ReturnType<typeof openThankYouRenditions>>>
/** The two renditions that go out with a greeting: encoded here, or as they came. */
type SentPictures =
  | Awaited<ReturnType<typeof encodeThankYouPictures>>
  | TakenOverPhoto['renditions']
/** The photo in the page's memory: as the choice hands it over, or taken over with its renditions. */
type GreetingPhoto = ThankYouPhoto & { renditions?: TakenOverPhoto['renditions'] }

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
 *
 * The result offers one more of the same for the next person ("Noch einen für jemand anderen",
 * ZE-030): that begins a NEW greeting in this page, with a number of its own in the address.
 * The entries of the history belong to one greeting each, and none of them shows another one.
 */
export const ThankYouGreeting = defineComponent({
  name: 'ThankYouGreeting',
  props: {
    balance: { type: Number, default: 0 },
  },
  emits: ['update-transactions'],
  setup(props, { emit }) {
    const route = useRoute()
    const router = useRouter()
    const store = useWalletStore()
    const { t } = useI18n()

    // The keys are written out one by one, here and below: the unused-keys rule of the linter only
    // counts a key it finds as a literal.
    const stepLabel = (name: Step) => {
      switch (name) {
        case PICTURE:
          return t('thank-you-greeting.step.picture')
        case WORDS:
          return t('thank-you-greeting.step.words')
        default:
          return t('thank-you-greeting.step.preview')
      }
    }

    const groupTitle = (name: string) => {
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
    const lineText = (key: string) => {
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

    // A picture is always chosen: at first the first motif, the warm one that goes with everything.
    // With a photo of the member's own as the choice, `motif` is null.
    const form = reactive<GreetingForm>({
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

    /**
     * The photo of the member's own, once one was chosen (ThankYouPictureChoice): the picture as
     * decoded, what was done to it in the editor, and the edited picture for the eye. It stays in its
     * tile while a motif is the choice.
     *
     * A photo that came from a greeting made before -- the old one of a duplicate, or the one this
     * page made a moment ago -- carries `renditions` as well: the two JPEGs that greeting was made
     * with. ⛔ They go out with the next greeting as they are (`create`), until the member cuts the
     * photo anew: what the editor hands back is a photo without them.
     *
     * ⛔ In the memory of this page only, like everything typed here: never the store (which is
     * mirrored into the device's storage) and never Apollo's cache. A shallow ref: nothing inside it
     * changes, and a decoded picture is no business of Vue's reactivity.
     */
    const photo = shallowRef<GreetingPhoto | null>(null)
    const photoChosen = computed(() => form.motif === null && photo.value !== null)

    /**
     * A greeting duplicated from the member's own list (TransactionLink.vue, ZE-030), or null: what
     * the old link carried, handed over once and in memory (useLinkDraft). It stands in the fields as
     * if it had been written here, and all of it can be changed. The greeting made of it is a new
     * link, on the way of every greeting (`create`); the old one stays as it is. Whoever reloads the
     * page starts empty.
     *
     * - The words are the old memo without its first line.
     * - The first line is told by its wording: where it is, word for word, one of the twelve in the
     *   language the wallet is in now, that suggestion is the choice. Any other line -- one of the
     *   member's own, or a suggestion chosen in another language -- stands as a line of their own.
     *   An old greeting without a line leaves none chosen, and the page asks for one as it does of
     *   every new greeting.
     * - The amount stands as its field takes it and the wallet's language writes it ("12,5").
     */
    const amountInText = useAmountInText()
    const duplicated = useLinkDraft().takeGreeting()
    // The picture of the old greeting, where this page can show it again: one of the motifs.
    const duplicatedMotif: string | null =
      duplicated &&
      !duplicated.greeting.hasPicture &&
      THANK_YOU_MOTIF_KEYS.includes(duplicated.greeting.motif)
        ? duplicated.greeting.motif
        : null
    /**
     * The photo of the old greeting, where it carried one of the member's own: on its way from the
     * server, here, or not come (`takeOverPhoto`). Null where there is none to wait for.
     * - On its way, the first motif stands as the choice, the tile of the photo waits, and the page
     *   does not go on: ⛔ no greeting is made with another picture than the page shows.
     * - Not come -- deleted meanwhile, or the line --, a sentence at the picture says so until a
     *   photo is chosen anew.
     */
    const COMING = 'coming'
    const HERE = 'here'
    const MISSING = 'missing'
    const takeover = ref<typeof COMING | typeof HERE | typeof MISSING | null>(
      duplicated?.greeting.hasPicture === true ? COMING : null,
    )
    const photoComing = computed(() => takeover.value === COMING)
    const photoNotTakenOver = computed(() => takeover.value === MISSING)
    if (duplicated) {
      const old = greetingParts(duplicated.memo, duplicated.greeting.line)
      const suggestion = LINE_KEYS.find((key) => lineText(key) === old.line)
      if (duplicatedMotif) {
        form.motif = duplicatedMotif
      }
      form.recipientName = duplicated.greeting.recipientName ?? ''
      form.lineChoice = suggestion ?? (old.line ? OWN : null)
      form.ownLine = !suggestion && old.line ? old.line : ''
      form.words = old.words
      form.amount = amountInText(duplicated.amount)
    }

    // The picture the member chooses (ThankYouPictureChoice). A motif chosen while the old photo is
    // still on its way is the member's answer: the photo is waited for no longer, and whenever it
    // lands it is let go (`takeOverPhoto`).
    const chooseMotif = (key: string | null) => {
      if (photoComing.value) {
        takeover.value = null
      }
      form.motif = key
    }
    const choosePhoto = (chosen: ThankYouPhoto | null) => {
      if (photoComing.value) {
        takeover.value = null
      }
      photo.value = chosen
    }

    const chooseLine = (key: string) => {
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
      if (form.lineChoice === OWN) {
        return form.ownLine.trim()
      }
      return form.lineChoice ? lineText(form.lineChoice) : ''
    })
    // What goes into the booking: the line, a line break, the words -- or the one there is.
    const memo = computed(() => greetingMemo(line.value, form.words))

    // ⛔ A greeting has a first line (Bernd, 04.10.2026): it is the title of the card -- on paper it
    // stands on the front, under the picture, and a card printed without one has a front without a
    // word. One of the suggestions is chosen or a line of the member's own is written; the words
    // may be missing. Greetings made before this rule carry none, and every place that shows a
    // greeting still takes that.
    const lineError = computed(() =>
      line.value === '' ? t('thank-you-greeting.words.missing') : '',
    )

    // Line and words together keep the bounds of every memo. The check is the memo's own, on the
    // memo as it will go out -- asked once there is a line: one thing is said at a time.
    const memoError = computed((): string => {
      if (lineError.value) {
        return ''
      }
      try {
        memoSchema.validateSync(memo.value)
        return ''
      } catch (error) {
        return translateYupErrorString((error as Error).message, t)
      }
    })

    // The send form's rule, up to what a link may carry out of this balance: the field then names
    // the most that goes.
    const amountRules = computed(() => amountUpTo(linkAmountMax(props.balance)))
    const amountValid = computed(() => amountRules.value.isValidSync(form.amount))
    // As a string: `GradidoUnit` takes nothing else, and a number would die before the resolver.
    const amountToSend = computed(() => String(amountRules.value.cast(form.amount)))

    const formValid = computed(
      () => lineError.value === '' && memoError.value === '' && amountValid.value,
    )
    // The member wanted to go on once: from then on the fields say what is missing.
    const tried = ref(false)

    // A motif or a photo, never both: with the photo as the choice the motif is null, and the photo
    // itself goes along only when the greeting is made (see `create`).
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
      senderUser: { alias: store.username, gradidoID: store.gradidoID },
      // The face the page of the link will carry (ZE-038): the member's small picture, where they
      // show it to other members -- the server hands it out there by the same switch.
      senderAvatar: store.avatarVisibleToMembers === true ? store.avatar : null,
      // `hasPicture`: what the server will say of the greeting once it is made.
      greeting: { ...greeting.value, hasPicture: photoChosen.value },
    }))

    const step = computed<Step>(() => {
      const named = route.query.step as Step
      return ([WORDS, PREVIEW, DONE] as Step[]).includes(named) ? named : PICTURE
    })
    const stepIndex = computed(() => STEPS.indexOf(step.value))

    /**
     * Which greeting of this visit the page holds: the first, or one begun with "Noch einen für
     * jemand anderen" on the result of the one before (`another`).
     *
     * ⛔ The entries of the history belong to ONE greeting each. Behind a second greeting lie the
     * entries of the first -- its words, its picture --, and with nothing to tell them apart they
     * would show the second one once more (back: words, picture, words, picture). So the address of
     * every greeting after the first names its number: a count, and nothing of the greeting. An
     * entry that names another number than the page holds shows nothing of the greeting in the page
     * (the watcher below).
     */
    const GREETING = 'greeting'
    const greetingNumber = ref(1)
    const entryNumber = computed(() => {
      const named = route.query[GREETING]
      if (named === undefined) {
        return 1
      }
      return typeof named === 'string' && /^[1-9]\d{0,5}$/.test(named) ? Number(named) : NaN
    })

    // The steps this page itself has led to, of the greeting it holds. An address that names a step
    // it has not is a reload, or the forward key into an entry of an earlier visit: the form is empty
    // then.
    const reached = new Set<Step>([PICTURE])
    const created = ref<ThankYouGreetingCreated | null>(null)
    const pending = ref(false)
    const createError = ref('')

    const here = (query: Record<string, string>) => ({
      path: route.path,
      query:
        greetingNumber.value > 1 ? { ...query, [GREETING]: String(greetingNumber.value) } : query,
    })

    const go = (next: Step) => {
      reached.add(next)
      return router.push(here({ step: next }))
    }

    const toPreview = () => {
      tried.value = true
      if (!formValid.value) {
        return
      }
      createError.value = ''
      go(PREVIEW)
    }

    // One step back, through the history the steps were pushed onto -- the same walk as the
    // device's back key. From the first step it leaves the page: back to where the member came
    // from, or to "Zeig es Deinen Freunden" where the page was opened by its address.
    //
    // ⛔ "Where the member came from" has to be a page of the signed-in wallet. After a session
    // has run out the way here leads through the sign-in form, the form is then the entry behind
    // this page, and "back" showed the form to somebody signed in (the loop of the till tools,
    // 08.10.2026 -- utils/backOrOverview). Such an entry counts like no entry.
    const back = () => {
      if (step.value === PICTURE && !staysInWallet(router, window.history.state?.back)) {
        router.push('/show-friends')
        return
      }
      router.back()
    }

    watch(
      [step, entryNumber],
      ([now, entry]) => {
        // ⛔ An entry of another greeting than the one the page holds. One of an earlier greeting of
        // this visit is done with, like the steps of a greeting that is made: the list of links. Any
        // other number is of no greeting this page began -- a reload, the forward key into a visit
        // that is over --, and the page shows the one it holds, from its picture.
        if (entry !== greetingNumber.value) {
          router.replace(entry < greetingNumber.value ? '/transactions' : here({}))
          return
        }
        // ⛔ The greeting is made: whatever entry the browser walks to, none shows the steps
        // again. Back from the result leads to the list of links.
        if (created.value) {
          if (now !== DONE) {
            router.replace('/transactions')
          }
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

    // A duplicated greeting opens at the words, its picture one step back in the history: two taps
    // make the greeting for somebody whose link ran out, and for the next person the name is in
    // sight. ⛔ On the page's own way (`go`), from the entry of the picture the list led to. An
    // address that names the words is turned back to the picture (above), and marking the words as
    // reached without walking there would leave no picture behind them.
    // A greeting with a photo of the member's own goes the same way once the photo is here
    // (`takeOverPhoto`); where the old picture does not come along, the page stays at the picture.
    if (duplicatedMotif) {
      go(WORDS)
    }

    let alive = true
    onUnmounted(() => {
      alive = false
    })

    // Looked at only where the server is asked for the photo of a duplicated greeting.
    const apollo = useApolloClient()

    /** How long the photo of a duplicated greeting is waited for, before the page says it did not come. */
    const PHOTO_TAKEOVER_MAX_MS = 15000

    /**
     * Fetches the photo of the old greeting of a duplicate and puts it into its tile, as the choice:
     * both renditions in one request of this page's own (thankYouGreetingPictureRenditions,
     * `no-cache`), kept in this page's memory and nowhere else.
     * ⛔ Not through the store of the list's photos (useGreetingPictures): that one knows a link by
     * its id and hands back the SMALL rendition it remembers, without asking -- the duplicate would
     * be made of the small picture, without a word.
     *
     * With the photo in its tile the page goes on to the words, as it does for a motif. Where the
     * photo does not come -- the old link is deleted meanwhile, the line fails, the answer is no
     * picture, or none is there within PHOTO_TAKEOVER_MAX_MS --, the page stays at the picture and
     * says so.
     *
     * ⛔ The answer is placed only where it is still waited for: not once the member chose a motif
     * themselves, and not in a page that was left.
     */
    const takeOverPhoto = async (linkId: number) => {
      let giveUp: ReturnType<typeof setTimeout> | undefined
      const tooLate = new Promise<never>((_resolve, reject) => {
        giveUp = setTimeout(() => reject(new Error('no photo in time')), PHOTO_TAKEOVER_MAX_MS)
      })
      let taken: TakenOverPhoto | null = null
      try {
        taken = await Promise.race([
          apollo.client
            .query({
              query: thankYouGreetingPictureRenditions,
              variables: { linkId },
              fetchPolicy: 'no-cache',
            })
            .then(({ data }) =>
              openThankYouRenditions({ small: data?.small ?? null, large: data?.large ?? null }),
            ),
          tooLate,
        ])
      } catch {
        taken = null
      } finally {
        clearTimeout(giveUp)
      }
      if (!alive || !photoComing.value) {
        return
      }
      if (!taken) {
        takeover.value = MISSING
        return
      }
      photo.value = taken
      form.motif = null
      takeover.value = HERE
      if (step.value === PICTURE) {
        go(WORDS)
      }
    }
    if (photoComing.value) {
      takeOverPhoto(duplicated.id)
    }

    const { mutate: createLink } = useMutation(createTransactionLink)
    const { mutate: addPicture } = useMutation(addThankYouGreetingPicture)

    /**
     * What the greeting that was made last carried, as it was sent: the fields at the press, and the
     * two renditions of its photo that went out (null without a photo). All that "Noch einen für
     * jemand anderen" needs (`another`) -- and not the photo as the member chose it from the device,
     * which is let go once the greeting is made.
     */
    let made: { form: GreetingForm; renditions: SentPictures | null } | null = null

    /**
     * Why the greeting was not made, in the page's words: a photo that cannot be made small enough,
     * or one the server did not take, in the sentences the chat says it with; anything else as the
     * server says it.
     */
    const createProblemWords = (error: unknown): string => {
      const said = error as { name?: string; problem?: string; message?: string } | null | undefined
      if (said?.name === 'ChatImageError') {
        return chatImageProblemWords(said.problem, t)
      }
      if (chatImageRefusal(error) === 'IMAGE_NOT_ACCEPTED') {
        return t('chatThread.imageNotAccepted')
      }
      return said?.message ?? String(error)
    }

    /**
     * Makes the greeting. With a photo it is a chain, and each of its steps runs once:
     *   1. both renditions are made of the photo, here in the browser (utils/thankYouPicture);
     *   2. the link is made, with the SMALL rendition in the greeting;
     *   3. the LARGE rendition follows in a request of its own -- the two do not fit into one.
     * ⛔ Step 3 may fail without a word: the greeting stands, and the page its link opens as shows
     * the small rendition then. No second try -- that would be a second request for the same row.
     *
     * ⛔ A photo that came from a greeting made before (`renditions`) skips step 1: the two JPEGs
     * that greeting was made with go out as they are, byte for byte. Encoded again, the new
     * greeting would carry another picture than the old one -- a step coarser, or a size smaller.
     */
    const create = async () => {
      // Locked while the chain is on its way, and for good once it has made a greeting.
      if (pending.value || created.value) {
        return
      }
      pending.value = true
      createError.value = ''
      // What is sent is the greeting as it stands at this press: the member may walk back with the
      // device's own key and change a field, or the picture, while the chain is under way.
      const sent = { amount: amountToSend.value, memo: memo.value, greeting: { ...greeting.value } }
      const sentForm = { ...form }
      const sentPhoto = photoChosen.value ? photo.value : null
      try {
        const pictures: SentPictures | null = sentPhoto
          ? (sentPhoto.renditions ??
            (await encodeThankYouPictures(sentPhoto.source, sentPhoto.edit)))
          : null
        const result = await createLink({
          amount: sent.amount,
          memo: sent.memo,
          greeting: pictures
            ? { ...sent.greeting, picture: thankYouPictureInput(pictures.small) }
            : sent.greeting,
        })
        // The cast is for the types alone: an answer without a result fails here, as it did.
        const link = (result as NonNullable<typeof result>).data.createTransactionLink
        // The member's own photo, for their list of links: kept from what was just sent, so the
        // list does not ask the server for it (in memory, until the member signs out).
        if (pictures) {
          rememberGreetingPicture(link.id, pictures.small.data)
        }
        if (pictures?.large) {
          try {
            await addPicture({ linkId: link.id, picture: thankYouPictureInput(pictures.large) })
          } catch {
            // The greeting stands without it.
          }
        }
        // What the result shows is the server's answer, not the form: the member may have walked
        // back and changed a field while the request was under way, and the greeting that exists
        // is the one that was sent. Its photo is the one this page holds -- the server is not asked
        // for it.
        created.value = { ...link, picture: sentPhoto?.preview ?? null }
        // Kept for one more of the same (`another`): the fields as they were sent, and the two
        // renditions of the photo that went out -- two small JPEGs.
        made = { form: sentForm, renditions: pictures }
        // ⛔ The photo itself is let go, as ever: what stands in the form now is no greeting any
        // more, the picture as the device handed it over is many times the size of what was sent,
        // and the result is the page the member leaves for a messenger and comes back to. The
        // device has its memory back.
        photo.value = null
        // The balance and the sum of open links have changed (as pages/Send.vue says it).
        emit('update-transactions', {})
        // Only where the member is still here: whoever left for another page is not pulled back.
        if (alive) {
          await router.replace(here({ step: DONE }))
        }
      } catch (error) {
        createError.value = createProblemWords(error)
      } finally {
        pending.value = false
      }
    }

    // "Für wen?", for the caret of a greeting begun with `another`.
    const nameInput = ref<InstanceType<typeof BFormInput> | null>(null)

    /**
     * "Noch einen für jemand anderen" on the result (ZE-030): a NEW greeting with everything the one
     * just made carried -- picture, first line, words, amount --, for the next person. Only "Für
     * wen?" is empty, and the caret stands in it: the greeting for the next person would carry the
     * name of the first otherwise. It opens at the words, its picture one step back.
     *
     * - Its photo is opened from the two renditions the page sent a moment ago, as the photo of a
     *   duplicated greeting is (`takeOverPhoto`): they go out again as they are (`create`), and cut
     *   anew, the large one is the picture. The member chooses nothing anew, and the server is not
     *   asked for it. Where it does not open, the new greeting stays at its picture and says so.
     * - ⛔ The order: first the new greeting stands in the page -- fields, photo, and `created`,
     *   `reached` and `tried` taken back --, THEN the step changes. With `created` still set, the
     *   watcher above leads to the list of links. (The line of an error needs no taking back: it is
     *   empty whenever a greeting is made -- `create` empties it before it begins.)
     * - ⛔ The greeting made before is made, and stays so. The new one has a number of its own
     *   (`greetingNumber`): its picture takes the place of the result in the history, and every
     *   entry of the old one leads to the list of links from now on.
     */
    const another = async () => {
      // What the greeting just made left is taken once: a second tap finds nothing to begin with,
      // also while the photo opens.
      if (!made) {
        return
      }
      const last = made
      made = null
      let again: TakenOverPhoto | null = null
      if (last.renditions) {
        try {
          again = await openThankYouRenditions({
            small: last.renditions.small.data,
            large: last.renditions.large?.data ?? null,
          })
        } catch {
          again = null
        }
        if (!alive) {
          return
        }
      }
      const photoMissing = last.renditions !== null && again === null
      Object.assign(form, last.form, { recipientName: '' })
      if (photoMissing) {
        form.motif = THANK_YOU_MOTIF_KEYS[0]
      }
      photo.value = again
      takeover.value = photoMissing ? MISSING : null
      allLinesOpen.value = false
      tried.value = false
      created.value = null
      greetingNumber.value += 1
      reached.clear()
      reached.add(PICTURE)
      const own = route.path
      await router.replace(here({}))
      // ⛔ Only where that step arrived at this page. The wallet's guard may lead elsewhere -- a
      // session that ran out: the sign-in page --, and the words of a greeting are pushed onto no
      // other page's address.
      if (route.path !== own) {
        return
      }
      // Without its photo the new greeting stays at its picture, where the sentence says so.
      if (photoMissing) {
        return
      }
      await go(WORDS)
      await nextTick()
      if (alive) {
        nameInput.value?.focus()
      }
    }

    /** A suggestion for the first line: chosen by a tap, taken back by a second. */
    const chip = (key: string) => (
      <button
        key={key}
        type='button'
        class={['tyg-chip', { 'is-chosen': form.lineChoice === key }]}
        aria-pressed={form.lineChoice === key}
        data-test={`thank-you-greeting-line-${key}`}
        onClick={() => chooseLine(key)}
      >
        {lineText(key)}
      </button>
    )

    // `gradido` is the wallet's own variant (.btn-gradido, gradido.css)
    const gradido = 'gradido' as ButtonVariant

    return () => (
      <div
        class={['thank-you-greeting', classes['thank-you-greeting']]}
        data-test='thank-you-greeting'
      >
        {/* The greeting is made: what to do with it. Nothing here leads back into the steps. */}
        {step.value === DONE && created.value ? (
          <ThankYouGreetingDone created={created.value} onAnother={another} />
        ) : step.value !== DONE ? (
          <>
            <div class='tyg-head page-text'>
              {/* One step back, as the device's own back key: both walk the same history. */}
              <button
                type='button'
                class='tyg-back'
                aria-label={t('back')}
                disabled={pending.value}
                data-test='thank-you-greeting-back'
                onClick={back}
              >
                <svg
                  viewBox='0 0 20 20'
                  width='22'
                  height='22'
                  fill='none'
                  stroke='currentColor'
                  stroke-width='1.8'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  aria-hidden='true'
                >
                  <path d='M12 5l-5 5 5 5' />
                </svg>
              </button>
              <ol class='tyg-steps' data-test='thank-you-greeting-steps'>
                {STEPS.map((name, index) => (
                  <li
                    key={name}
                    class={[
                      'tyg-step',
                      { 'is-current': name === step.value, 'is-passed': index < stepIndex.value },
                    ]}
                    aria-current={name === step.value ? 'step' : undefined}
                  >
                    <span class='tyg-step-mark' aria-hidden='true'>
                      {index < stepIndex.value ? (
                        <svg
                          viewBox='0 0 20 20'
                          width='14'
                          height='14'
                          fill='none'
                          stroke='currentColor'
                          stroke-width='2.4'
                          stroke-linecap='round'
                          stroke-linejoin='round'
                        >
                          <path d='M5 10.5l3.5 3.5L15 7' />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span class='tyg-step-name'>{stepLabel(name)}</span>
                  </li>
                ))}
              </ol>
            </div>

            {step.value === PICTURE ? (
              // 1. The picture: one of the five motifs, or a photo of one's own.
              <section data-test='thank-you-greeting-picture'>
                <h2 class='h4 mb-3 page-text'>{t('thank-you-greeting.picture.question')}</h2>
                {/* A duplicated greeting whose photo did not come along: said here, over the tiles,
                    until a photo is chosen anew. The first motif is the choice meanwhile. */}
                {photoNotTakenOver.value && !photo.value ? (
                  <p
                    class='tyg-notice page-text'
                    data-test='thank-you-greeting-photo-not-taken-over'
                  >
                    {t('thank-you-greeting.picture.not-taken-over')}
                  </p>
                ) : null}
                {/* While the photo of a duplicated greeting is on its way, its tile waits for it and
                    the page does not go on: the greeting is made with the picture the page shows. */}
                <ThankYouPictureChoice
                  motif={form.motif}
                  photo={photo.value}
                  busy={photoComing.value}
                  onUpdate:motif={chooseMotif}
                  onUpdate:photo={choosePhoto}
                />
                <div class='tyg-actions'>
                  <BButton
                    variant={gradido}
                    disabled={photoComing.value}
                    data-test='thank-you-greeting-next'
                    onClick={() => go(WORDS)}
                  >
                    {t('thank-you-greeting.next')}
                  </BButton>
                </div>
              </section>
            ) : step.value === WORDS ? (
              // 2. The words: whom it is for, the first line, the sender's own words, the amount.
              <section data-test='thank-you-greeting-words'>
                <div class='tyg-card bg-white app-box-shadow gradido-border-radius'>
                  <div class='tyg-field'>
                    <label class='tyg-label' for='thank-you-greeting-name'>
                      {t('thank-you-greeting.words.for-whom')}
                    </label>
                    <BFormInput
                      id='thank-you-greeting-name'
                      ref={nameInput}
                      modelValue={form.recipientName}
                      onUpdate:modelValue={(value) => {
                        form.recipientName = value as string
                      }}
                      type='text'
                      autocomplete='off'
                      maxlength={THANK_YOU_RECIPIENT_NAME_MAX_CHARS}
                      aria-describedby='thank-you-greeting-name-hint'
                      data-test='thank-you-greeting-name'
                    />
                    <div id='thank-you-greeting-name-hint' class='tyg-hint small'>
                      {t('thank-you-greeting.words.for-whom-hint')}
                    </div>
                  </div>

                  {/* An error that stands is the description of what it is about: a screen reader
                      says it again when the member comes back, not only at the moment it appears. */}
                  <div
                    class='tyg-field'
                    role='group'
                    aria-labelledby='thank-you-greeting-line-label'
                    aria-describedby={
                      tried.value && lineError.value ? 'thank-you-greeting-line-error' : undefined
                    }
                  >
                    <div id='thank-you-greeting-line-label' class='tyg-label'>
                      {t('thank-you-greeting.words.line')}
                    </div>
                    {/* Suggestions, none of them chosen beforehand; a second tap takes the choice
                        back. Four at first, all twelve in their three groups on demand. */}
                    {allLinesOpen.value ? (
                      LINE_GROUPS.map((group) => (
                        <div
                          key={group.name}
                          class='tyg-line-group'
                          data-test={`thank-you-greeting-group-${group.name}`}
                        >
                          <div class='tyg-line-group-title small'>{groupTitle(group.name)}</div>
                          <div class='tyg-chips'>{group.lines.map(chip)}</div>
                        </div>
                      ))
                    ) : (
                      <div class='tyg-chips'>{shownLines.value.map(chip)}</div>
                    )}
                    <div class='tyg-line-more'>
                      <button
                        type='button'
                        class='tyg-link'
                        aria-expanded={allLinesOpen.value}
                        data-test='thank-you-greeting-all-lines'
                        onClick={() => {
                          allLinesOpen.value = !allLinesOpen.value
                        }}
                      >
                        {t('thank-you-greeting.words.all-lines')}
                      </button>
                      <button
                        type='button'
                        class='tyg-link'
                        aria-pressed={form.lineChoice === OWN}
                        data-test='thank-you-greeting-own-line'
                        onClick={() => chooseLine(OWN)}
                      >
                        {t('thank-you-greeting.words.own-line')}
                      </button>
                    </div>
                    {form.lineChoice === OWN ? (
                      <BFormInput
                        modelValue={form.ownLine}
                        onUpdate:modelValue={(value) => {
                          form.ownLine = value as string
                        }}
                        type='text'
                        autocomplete='off'
                        maxlength={THANK_YOU_LINE_MAX_CHARS}
                        aria-label={t('thank-you-greeting.words.own-line')}
                        aria-describedby={
                          tried.value && lineError.value
                            ? 'thank-you-greeting-line-error'
                            : undefined
                        }
                        state={tried.value && lineError.value ? false : null}
                        data-test='thank-you-greeting-own-line-input'
                      />
                    ) : null}
                    {/* Said once the member wants to go on: a greeting has a first line, one of the
                        suggestions or one of the member's own. */}
                    {tried.value && lineError.value ? (
                      <div
                        id='thank-you-greeting-line-error'
                        class='tyg-error small'
                        role='alert'
                        data-test='thank-you-greeting-line-error'
                      >
                        {lineError.value}
                      </div>
                    ) : null}
                  </div>

                  <div class='tyg-field'>
                    <label class='tyg-label' for='thank-you-greeting-words-input'>
                      {t('thank-you-greeting.words.own-words')}
                    </label>
                    <BFormTextarea
                      id='thank-you-greeting-words-input'
                      modelValue={form.words}
                      onUpdate:modelValue={(value) => {
                        form.words = value as string
                      }}
                      rows='4'
                      maxRows='10'
                      noResize
                      aria-describedby={
                        tried.value && memoError.value ? 'thank-you-greeting-memo-error' : undefined
                      }
                      state={tried.value && memoError.value ? false : null}
                      data-test='thank-you-greeting-words-input'
                    />
                    {/* Said once the member wants to go on: line and words together are too short
                        or too long for a memo. */}
                    {tried.value && memoError.value ? (
                      <div
                        id='thank-you-greeting-memo-error'
                        class='tyg-error small'
                        role='alert'
                        data-test='thank-you-greeting-memo-error'
                      >
                        {memoError.value}
                      </div>
                    ) : null}
                  </div>

                  {/* The amount, small and last: the same rule as the send form's, with the reserve
                      a link holds. In a wrapper of its own: what is written on the house's input
                      lands on the field itself, not around it. */}
                  <div class='tyg-amount'>
                    <ValidatedInput
                      modelValue={form.amount}
                      name='amount'
                      label={t('thank-you-greeting.words.amount')}
                      placeholder='0.01'
                      inputmode='decimal'
                      autocomplete='off'
                      rules={amountRules.value}
                      disableSmartValidState={tried.value}
                      data-test='thank-you-greeting-amount'
                      onUpdate:modelValue={(value: string) => {
                        form.amount = value
                      }}
                    />
                  </div>
                </div>
                <div class='tyg-actions'>
                  <BButton
                    variant={gradido}
                    data-test='thank-you-greeting-next'
                    onClick={toPreview}
                  >
                    {t('thank-you-greeting.next')}
                  </BButton>
                </div>
              </section>
            ) : step.value === PREVIEW ? (
              // 3. The last look: the sheet as the other person will see it.
              <section data-test='thank-you-greeting-preview'>
                <h2 class='h4 mb-3 page-text' data-test='thank-you-greeting-preview-title'>
                  {recipientName.value
                    ? t('thank-you-greeting.preview.title-for', { name: recipientName.value })
                    : t('thank-you-greeting.preview.title')}
                </h2>
                <div class='tyg-paper'>
                  {/* A photo of one's own is shown as the page made it: the server has none yet. */}
                  <RedeemThanksPaper
                    linkData={previewLink.value}
                    picture={photoChosen.value && photo.value ? photo.value.preview : null}
                  />
                </div>
                <p class='tyg-note small page-text' data-test='thank-you-greeting-waits'>
                  {recipientName.value
                    ? t(
                        'thank-you-greeting.preview.waits-for',
                        { days: LINK_VALID_DAYS, name: recipientName.value },
                        LINK_VALID_DAYS,
                      )
                    : t(
                        'thank-you-greeting.preview.waits',
                        { days: LINK_VALID_DAYS },
                        LINK_VALID_DAYS,
                      )}
                </p>
                {createError.value ? (
                  <p
                    class='tyg-error page-text'
                    role='alert'
                    data-test='thank-you-greeting-create-error'
                  >
                    {createError.value}
                  </p>
                ) : null}
                <div class='tyg-actions'>
                  <BButton
                    variant={gradido}
                    disabled={pending.value}
                    data-test='thank-you-greeting-finish'
                    onClick={create}
                  >
                    {t('thank-you-greeting.preview.finish')}
                  </BButton>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    )
  },
})
