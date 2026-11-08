// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { computed, defineComponent, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { GddSend, TRANSACTION_STEPS, type TransactionStep } from '@/components/GddSend'
import { RecipientNotFound } from '@/components/GddSend/RecipientNotFound'
import { SendEmailResultError } from '@/components/GddSend/SendEmailResultError'
import { TransactionConfirmationLink } from '@/components/GddSend/TransactionConfirmationLink'
import { TransactionConfirmationSend } from '@/components/GddSend/TransactionConfirmationSend'
import {
  type Community,
  type TransactionEntries,
  TransactionForm,
} from '@/components/GddSend/TransactionForm'
import type { TransactionPicture } from '@/components/GddSend/TransactionPictureField'
import { TransactionResultLink } from '@/components/GddSend/TransactionResultLink'
import { TransactionResultSendError } from '@/components/GddSend/TransactionResultSendError'
import SuccessMessage from '@/components/SuccessMessage.vue'
import ThankYouGreetingDone from '@/components/ThankYouGreeting/ThankYouGreetingDone.vue'
import { rememberGreetingPicture } from '@/composables/useGreetingPictures'
import { usePassOnDraft } from '@/composables/usePassOnDraft'
import { useSendReturn } from '@/composables/useSendReturn'
import { useAppToast } from '@/composables/useToast'
import { linkAmountMax } from '@/constants'
import { reachableCommunities } from '@/graphql/communities.graphql'
import {
  addThankYouGreetingPicture,
  createTransactionLink,
  sendCoins,
  sendEmail as sendEmailMut,
} from '@/graphql/mutations.js'
import { user as userQuery } from '@/graphql/queries'
import { backOrOverviewUnless } from '@/utils/backOrOverview'
import {
  type ChatImageError,
  chatImageProblemWords,
  chatImageRefusal,
  encodeChatImage,
} from '@/utils/chatImage'
import { memberAlias } from '@/utils/gradidoAddress'
import { isRecipientNotFoundError, isUserNotFoundAnswer } from '@/utils/recipientNotFound'
import { SEND_TYPES, type SendType } from '@/utils/sendTypes'
import { lineFromMemo } from '@/utils/thankYouGreeting'
import {
  encodeThankYouPictures,
  THANK_YOU_PICTURE_SMALL,
  thankYouPictureInput,
} from '@/utils/thankYouPicture'
import { isEmailIdentifier } from '@/validationSchemas'

/**
 * What the page holds of the transfer, the link or the letter: the fields as the form hands
 * them over, bound as a whole back onto the form and onto the check view. Empty until the first
 * press: tab, community and name come with it.
 */
export type TransactionData = {
  identifier: string
  amount: number
  subject: string
  memo: string
  selected?: SendType
  targetCommunity?: Community
  userName?: string
}

/** The link made for a mail, as the mutation answers it, with the photo for "Fertig" to show. */
type MadeForEmail = { id: number; picture: string | null; [field: string]: unknown }

/** An error as Apollo rejects a query with, where the server answered at all. */
type QueryRefusal = Error & { graphQLErrors?: { message: string }[] }

export const Send = defineComponent({
  name: 'Send',
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
  },
  emits: ['set-tunneled-email', 'update-transactions'],
  setup(props, { emit, expose }) {
    const { t } = useI18n()
    const EMPTY_TRANSACTION_DATA: TransactionData = {
      identifier: '',
      amount: 0,
      subject: '',
      memo: '',
    }

    const route = useRoute()
    const router = useRouter()
    const { client: apolloClient } = useApolloClient()
    const { toastError } = useAppToast()

    const transactionData: TransactionData = reactive({ ...EMPTY_TRANSACTION_DATA })

    /**
     * The picture to go with a transfer (ZE-016), or null: `{ motif }`, or `{ photo }` -- the
     * member's own as the picture choice hands it over, decoded and whole.
     *
     * ⛔ BESIDE `transactionData`, not in it: that one is `reactive` and bound as a whole onto the
     * form and the check view, and the form's fields are cast by the validation schema. A decoded
     * photo belongs into a shallowRef, as the page of the greeting keeps its own.
     * ⛔ In this page's memory only: never the store (mirrored into localStorage), never the
     * device's storage, never Apollo's cache.
     *
     * The form is taken down between the steps: the check view's "Zurück" finds the picture here.
     * A transfer that was sent lets it go, one that failed leaves it; the form's own "Zurück"
     * leaves the page, and the picture with it.
     */
    const picture = shallowRef<TransactionPicture | null>(null)

    /**
     * What of it goes with THIS transfer: nothing to a member of another community -- there the
     * form shows a sentence in the field's place, and a picture chosen before waits here
     * untouched -- and nothing with a link.
     */
    const pictureToSend = computed(() =>
      transactionData.selected === SEND_TYPES.send &&
      transactionData.targetCommunity?.foreign !== true
        ? picture.value
        : null,
    )

    /**
     * The received thank-you this visit's transfer passes on, where "Jemandem danken" led here
     * (usePassOnDraft) -- or null. The trail of the thank-you (`passOnOf` of sendCoins); nothing
     * of it is shown.
     *
     * Taken once, when the page is made, and kept HERE, beside `transactionData` as the picture
     * is: the form is taken down between the steps, and the check view's "Zurück" finds it here.
     * A transfer that was sent lets it go, one that failed keeps it. Named with a transfer to a
     * member of this community only -- a link, a letter and a member of another community go
     * without it.
     *
     * ⛔ Never in the store, the device's storage or Apollo's cache (usePassOnDraft says why).
     */
    const passOnOf = ref(usePassOnDraft().take())

    /**
     * Where "Zurück" leads (E-043): the place one of the three windows named when it opened this
     * form (useSendReturn) -- the conversation, the group, the map -- or null, and then the
     * browser's history decides (`leave`).
     *
     * Taken when the page is made, and again at every change of its address: ⛔ the form beside
     * /send is patched, not rebuilt, when a contact is tapped in the column (TransactionForm says
     * so), and setup does not run again. A way back handed over for the path the page stands on
     * now takes the place of the one held. A new path without one lets it go -- another
     * recipient, with no window that named a place. A change of the query alone (`onBack` takes
     * `?art` out of the address) is the same form for the same recipient, and the way back stays.
     *
     * ⛔ And a new path brings the form back (`showFormForAddress`): the address names another
     * recipient now, or the empty form, and the step the page stood on was the one before's --
     * the success of a transfer to Sarah under Carla's address, whose "Zurück" led into Carla's
     * conversation without her form ever shown.
     *
     * Only on the page's own addresses: on the way out the route names the next page already.
     */
    const sendReturn = useSendReturn()
    const returnTo = shallowRef(sendReturn.take(route.path))
    let returnToPath = route.path
    watch(
      () => route.fullPath,
      () => {
        if (route.name !== 'Send') {
          return
        }
        const anotherPath = route.path !== returnToPath
        const handed = sendReturn.take(route.path)
        if (handed) {
          returnTo.value = handed
        } else if (anotherPath) {
          returnTo.value = null
        }
        returnToPath = route.path
        if (anotherPath) {
          showFormForAddress()
        }
      },
    )

    /**
     * "Zurück" from the form, and after a transfer or a letter that went out: out of the page, to
     * the place the window that opened it named, or else back by the browser's history -- never
     * through the form for the recipient before (backOrOverviewUnless).
     */
    const leave = () => {
      if (returnTo.value) {
        router.push(returnTo.value)
      } else {
        backOrOverviewUnless(router, 'Send')
      }
    }

    /**
     * The picture as the mutation takes it: `{ motif }`, or `{ picture }` -- the photo in the
     * chat's measure (THANK_YOU_PICTURE_SMALL), encoded now, right before it is sent --, or
     * nothing. Rejects with a ChatImageError where the photo cannot be made small enough.
     */
    const pictureArguments = async (chosen: TransactionPicture | null) => {
      if (chosen?.motif) {
        return { motif: chosen.motif }
      }
      if (chosen?.photo) {
        const small = await encodeChatImage(
          chosen.photo.source,
          chosen.photo.edit,
          THANK_YOU_PICTURE_SMALL,
        )
        return { picture: thankYouPictureInput(small) }
      }
      return {}
    }

    /** Everything the member entered is let go: after a transfer, a link or a letter went out. */
    const forgetEntries = () => {
      Object.assign(transactionData, EMPTY_TRANSACTION_DATA)
      picture.value = null
      passOnOf.value = null
    }
    const error = ref(false)
    const errorResult = ref('')
    const currentTransactionStep = ref<TransactionStep>(TRANSACTION_STEPS.transactionForm)
    const loading = ref(false)
    // The link that was made, for its result step: set before that step is shown.
    const link = ref<string | null>(null)
    const amount = ref<number | string>(0)
    const memo = ref('')
    const validUntil = ref<string | null>(null)

    const { mutate: sendCoinsMutation } = useMutation(sendCoins)
    const { mutate: createTransactionLinkMutation } = useMutation(createTransactionLink)
    const { mutate: sendEmailMutation } = useMutation(sendEmailMut)
    const { mutate: addGreetingPictureMutation } = useMutation(addThankYouGreetingPicture)

    /** "Jetzt prüfen" is asking the server about the recipient: the form takes no second press. */
    const checkingRecipient = ref(false)
    /** How long that answer is waited for, before the form is the member's again. */
    const RECIPIENT_CHECK_MAX_MS = 15000
    /** The step for a recipient nobody has: whether there is another community to choose. */
    const canChooseCommunity = ref(false)
    /**
     * The link that was made for a mail (`sendByEmail`), as "Fertig" shows it, and the address
     * the mail is for.
     *
     * ⛔ The wallet keeps the address here, in the memory of this page, and nowhere else: never
     * the store, the device's storage, the link or an event (ZE-037). And BESIDE
     * `transactionData`: that one is bound as a whole onto the form and the check view. It goes
     * when the member leaves this view, or the page with its memory.
     */
    const madeForEmail = shallowRef<MadeForEmail | null>(null)
    const emailAddress = ref('')

    const handleSendTypeChange = (sendType: SendType) => {
      transactionData.selected = sendType
      // Every tab stands on the form. (The .vue page named a step `sendEmailForm` for the
      // letter, which GddSend never had: it showed its default, the form, for that one as well.)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
    }

    /**
     * Whether "Jetzt prüfen" can ask the server about this recipient first: a transfer to
     * somebody typed into the form, in this community. `user` knows the members of this
     * community only -- for another one the question stays with "Jetzt senden".
     *
     * ⚠️ Not on /send/<community>/<user>: there the form has asked already, and its recipient is
     * empty until the answer has come.
     */
    const canAskFirst = ({ selected, targetCommunity }: TransactionEntries) =>
      selected === SEND_TYPES.send &&
      targetCommunity?.foreign !== true &&
      !route.params.userIdentifier

    /** Nobody has that account: the step that says so, and what can be done about it. */
    const showRecipientNotFound = () => {
      // The list the switch in the form asked for, as it stands in the cache: no second list.
      const communities = apolloClient.readQuery({
        query: reachableCommunities,
      })?.reachableCommunities
      canChooseCommunity.value = (communities?.length ?? 0) > 1
      currentTransactionStep.value = TRANSACTION_STEPS.recipientNotFound
    }

    /**
     * "Jetzt prüfen" for a member of this community (ZE-037): found, and the check view names
     * them by their user name (NU-018: never the real name); not found, and the step for that.
     * Anything else that goes wrong is said as it is, and the form stays. ⛔ Never "no account"
     * because the network was gone (isUserNotFoundAnswer).
     *
     * Asked anew at every press and kept nowhere (`no-cache`): an address without an account a
     * minute ago may have one now, and what was typed has no place in Apollo's cache.
     *
     * ⛔ What was pressed goes over to the page only with the answer: where an error leaves the
     * form standing, `transactionData` holds nothing of a press that did not go through.
     *
     * ⛔ The answer counts on the address it was asked on: a contact tapped in the meantime names
     * another recipient, and this answer must not take that one's form away. A line that gives
     * no answer (RECIPIENT_CHECK_MAX_MS) must not hold the form either: it is the whole of the
     * member's work.
     */
    const checkRecipient = async (pressed: TransactionEntries) => {
      checkingRecipient.value = true
      const askedOn = route.fullPath
      let giveUp: ReturnType<typeof setTimeout> | undefined
      const tooLate = new Promise<never>((_resolve, reject) => {
        giveUp = setTimeout(
          () => reject(new Error(t('form.recipient-not-found.no-answer'))),
          RECIPIENT_CHECK_MAX_MS,
        )
      })
      try {
        const { data } = await Promise.race([
          apolloClient.query({
            query: userQuery,
            variables: {
              identifier: pressed.identifier,
              communityIdentifier: pressed.targetCommunity.uuid,
            },
            fetchPolicy: 'no-cache',
            // A press after RECIPIENT_CHECK_MAX_MS has to ask anew: Apollo would hang it on the
            // request that is still open, and that one gives no answer.
            context: { queryDeduplication: false },
          }),
          tooLate,
        ])
        if (route.fullPath !== askedOn) {
          return
        }
        Object.assign(transactionData, pressed, {
          userName: memberAlias(data.user.alias, data.user.gradidoID),
        })
        currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
      } catch (err) {
        if (route.fullPath !== askedOn) {
          return
        }
        const refusal = err as QueryRefusal
        if (isUserNotFoundAnswer(refusal)) {
          Object.assign(transactionData, pressed, { userName: '' })
          showRecipientNotFound()
        } else {
          toastError(refusal.message)
        }
      } finally {
        clearTimeout(giveUp)
        checkingRecipient.value = false
      }
    }

    const setTransaction = async (data: TransactionEntries) => {
      // One question for one press: Enter beside a tap, or a second tap while the answer is on
      // its way.
      if (checkingRecipient.value) {
        return
      }
      if (canAskFirst(data)) {
        await checkRecipient(data)
        return
      }
      Object.assign(transactionData, data)
      switch (data.selected) {
        case SEND_TYPES.send:
          currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
          break
        case SEND_TYPES.link:
          currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationLink
          break
        case SEND_TYPES.email:
          // A letter does not come this way (`sendEmail`).
          break
        default:
          currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
          break
      }
    }

    const sendEmail = async (data: TransactionEntries) => {
      Object.assign(transactionData, data)
      loading.value = true
      error.value = false

      try {
        if (data.selected === SEND_TYPES.email) {
          const result = await sendEmailMutation({
            recipientCommunityIdentifier: data.targetCommunity.uuid,
            recipientIdentifier: data.identifier,
            subject: data.subject,
            memo: data.memo,
          })
          if (result) {
            currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultSuccess
            forgetEntries()
          } else {
            currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
          }
        }
      } catch (err) {
        if (transactionData.selected === SEND_TYPES.email) {
          errorResult.value = (err as Error).message
          error.value = true
          currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
        } else {
          toastError((err as Error).message)
        }
      } finally {
        loading.value = false
      }
    }

    const sendTransaction = async () => {
      // One transfer for one press: the photo is encoded before the mutation goes out, and a
      // second press in that time -- or Enter beside a tap -- must not send a second one.
      if (loading.value) {
        return
      }
      loading.value = true
      error.value = false

      try {
        if (transactionData.selected === SEND_TYPES.send) {
          let withPicture: Awaited<ReturnType<typeof pictureArguments>>
          try {
            withPicture = await pictureArguments(pictureToSend.value)
          } catch (problem) {
            // The photo cannot be made ready: nothing is sent, the chat's sentence says why, and
            // what the member entered -- the picture too -- stands in the form again.
            toastError(chatImageProblemWords((problem as ChatImageError)?.problem, t))
            currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
            return
          }
          // The check view stands on a press of the form, which names the community.
          const { targetCommunity } = transactionData
          if (!targetCommunity) {
            throw new Error('sendTransaction: no target community')
          }
          // Without a picture the mutation carries neither of the two arguments -- and without a
          // thank-you passed on to a member of this community, no `passOnOf` either.
          const passingOn =
            passOnOf.value && targetCommunity.foreign !== true ? { passOnOf: passOnOf.value } : {}
          await sendCoinsMutation({
            recipientCommunityIdentifier: targetCommunity.uuid,
            recipientIdentifier: transactionData.identifier,
            amount: transactionData.amount.toString(),
            memo: transactionData.memo,
            ...withPicture,
            ...passingOn,
          })

          error.value = false
          emit('set-tunneled-email', null)
          // A counterparty was involved, so the contact list may have gained somebody -- see
          // the layout's `updateTransactions`. Creating a LINK names nobody, which is why the
          // two calls below say different things.
          updateTransactions({ contactsChanged: true })
          // The photo as decoded is needed no more. Its bytes are not kept either: the wallet
          // does not learn the booking's id from this answer, and the conversation asks the
          // server.
          forgetEntries()
          currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendSuccess
        } else if (transactionData.selected === SEND_TYPES.link) {
          const result = await createTransactionLinkMutation({
            amount: transactionData.amount.toString(),
            memo: transactionData.memo,
          })

          emit('set-tunneled-email', null)
          const made = result?.data.createTransactionLink
          const {
            link: newLink,
            amount: newAmount,
            memo: newMemo,
            validUntil: newValidUntil,
          } = made
          link.value = newLink
          amount.value = newAmount
          memo.value = newMemo
          validUntil.value = newValidUntil
          forgetEntries()
          currentTransactionStep.value = TRANSACTION_STEPS.transactionResultLink
          updateTransactions({})
        } else if (transactionData.selected === SEND_TYPES.email) {
          currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultSuccess
        } else {
          throw new Error(`undefined transactionData.selected : ${transactionData.selected}`)
        }
      } catch (err) {
        const { message } = err as Error
        if (transactionData.selected === SEND_TYPES.send) {
          // Nobody has that account after all -- in another community, whose answer comes only
          // now, or here, where the account is gone since "Jetzt prüfen": the same step, not the
          // dead end.
          // ⚠️ With a recipient to show: on /send/<community>/<user> it stays empty where the
          // form's own question found nobody.
          if (isRecipientNotFoundError(message) && transactionData.identifier) {
            showRecipientNotFound()
          } else {
            errorResult.value = message
            error.value = true
            currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendError
          }
        } else if (transactionData.selected === SEND_TYPES.email) {
          errorResult.value = message
          error.value = true
          currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
        } else {
          toastError(message)
        }
      } finally {
        // ⛔ The address stays as it is (E-043): a `push('/send')` here threw the recipient out
        // of it, and "Zurück" after the success needs the way back and the browser's history
        // untouched. A step that needs the recipient out of it takes it out itself
        // (`changeRecipient`).
        loading.value = false
      }
    }

    /**
     * "Dank per E-Mail schicken": the link is made out of what stands in the form, without
     * another form in between -- as a thank-you greeting where a picture was chosen, as a plain
     * link where none was. The mail itself is the member's own, from the view this leads to.
     *
     * With a photo it is the chain of the greeting's page (pages/ThankYouGreeting.vue says why):
     * both renditions, the link with the small one, the large one in a request of its own, which
     * may fail without a word. A photo that cannot be made small enough makes nothing.
     *
     * ⛔ What is made is what stands at this press: taken before anything waits, and let go only
     * when the link is there. `pictureToSend` and not `picture`: a picture chosen before the
     * member named another community is no part of this any more, the form has said so.
     */
    const sendByEmail = async () => {
      // One link for one press.
      if (loading.value) {
        return
      }
      const { amount: linkAmount, memo: linkMemo, identifier: address } = transactionData
      const chosen = pictureToSend.value
      // A link holds a little more than its amount: the server would refuse this in its own
      // words. The amount is changed in the form, so that is where this leads back to.
      const amountMax = linkAmountMax(props.balance)
      if (linkAmount > amountMax) {
        toastError(t('form.validation.amount.max', { max: amountMax }))
        currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
        return
      }
      loading.value = true
      try {
        const pictures = chosen?.photo
          ? await encodeThankYouPictures(chosen.photo.source, chosen.photo.edit)
          : null
        // A greeting needs a picture: without one this is a plain link. Its name stays empty, an
        // address says nothing about one, and on the card it would stand printed.
        const greeting = chosen && {
          ...(pictures
            ? { picture: thankYouPictureInput(pictures.small) }
            : { motif: chosen.motif }),
          line: lineFromMemo(linkMemo),
          recipientName: null,
        }
        const result = await createTransactionLinkMutation({
          amount: linkAmount.toString(),
          memo: linkMemo,
          ...(greeting ? { greeting } : {}),
        })
        const made = result?.data.createTransactionLink
        // The member's own photo, for their list of links: not asked for again a moment later.
        if (pictures) {
          rememberGreetingPicture(made.id, pictures.small.data)
        }
        if (pictures?.large) {
          try {
            await addGreetingPictureMutation({
              linkId: made.id,
              picture: thankYouPictureInput(pictures.large),
            })
          } catch {
            // The greeting stands without it.
          }
        }
        madeForEmail.value = { ...made, picture: chosen?.photo?.preview ?? null }
        emailAddress.value = address
        forgetEntries()
        updateTransactions({})
        currentTransactionStep.value = TRANSACTION_STEPS.sendByEmailReady
      } catch (err) {
        const failure = err as ChatImageError
        if (failure?.name === 'ChatImageError') {
          toastError(chatImageProblemWords(failure.problem, t))
          currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
        } else if (chatImageRefusal(failure) === 'IMAGE_NOT_ACCEPTED') {
          toastError(t('chatThread.imageNotAccepted'))
        } else {
          toastError(failure.message)
        }
      } finally {
        loading.value = false
      }
    }

    /**
     * The form, for what the address names now (E-043). What the page held of a letter goes, as
     * at `onBack`. Where the address names a recipient, the one held goes as well: the form takes
     * theirs from the address (TransactionForm), and until that answer has come its field would
     * still hold the other one. Without a recipient in the address what was entered stays, as
     * the form keeps it where the menu's "Senden" leaves a recipient named.
     *
     * ⛔ Not while a transfer, a link or a letter is on its way (`loading`): its answer says what
     * became of it, and that step is the member's to see.
     */
    function showFormForAddress() {
      if (loading.value) {
        return
      }
      if (route.params.userIdentifier) {
        transactionData.identifier = ''
      }
      emailAddress.value = ''
      madeForEmail.value = null
      currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
    }

    /**
     * "Gemeinschaft wählen" and "Eingabe ändern", where nobody had that account: into the form,
     * to change what reached nobody. On /send/<community>/<user> the address names the
     * recipient, and the form keeps a recipient named there fixed -- so the recipient leaves the
     * address first, as the page did after every transfer before E-043. What was entered stays
     * in the fields. The way back goes with the address: from the free form "Zurück" follows the
     * browser's history.
     */
    const changeRecipient = async () => {
      if (route.params.userIdentifier) {
        await router.replace({ path: '/send', query: route.query, hash: route.hash })
      }
      await onBack()
    }

    const onBack = async () => {
      // `?art` is the command that opened the form, and the member has chosen another tab since.
      // The form is built anew now and would obey it again: "Adresse ändern" would lead to the
      // link tab, which has no address field. So it leaves the address first. (Here and not at
      // the tab: a change of address brings the window to the top of the page, and a member
      // choosing a tab stands further down.)
      if (route.query.art && route.query.art !== transactionData.selected) {
        const { art: _answered, ...query } = route.query
        await router.replace({ path: route.path, query, hash: route.hash })
      }
      emailAddress.value = ''
      madeForEmail.value = null
      currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
    }

    function updateTransactions(pagination: { contactsChanged?: boolean }) {
      emit('update-transactions', pagination)
    }

    expose({
      transactionData,
      picture,
      pictureToSend,
      error,
      errorResult,
      currentTransactionStep,
      loading,
      link,
      checkingRecipient,
      madeForEmail,
      emailAddress,
      setTransaction,
      sendEmail,
      sendTransaction,
      sendByEmail,
      onBack,
      updateTransactions,
    })

    return () => (
      <div>
        <GddSend currentTransactionStep={currentTransactionStep.value}>
          {{
            transactionForm: () => (
              <TransactionForm
                {...transactionData}
                picture={picture.value}
                onUpdate:picture={(chosen: TransactionPicture | null) => {
                  picture.value = chosen
                }}
                balance={props.balance}
                checking={checkingRecipient.value}
                onSend-email={sendEmail}
                onSet-transaction={setTransaction}
                onSet-send-type={handleSendTypeChange}
                onBack={leave}
              />
            ),
            transactionConfirmationSend: () => (
              <TransactionConfirmationSend
                balance={props.balance}
                {...transactionData}
                picture={pictureToSend.value}
                onSend-transaction={sendTransaction}
                onOn-back={onBack}
              />
            ),
            transactionConfirmationLink: () => (
              <TransactionConfirmationLink
                balance={props.balance}
                email={transactionData.identifier}
                amount={transactionData.amount}
                memo={transactionData.memo}
                loading={loading.value}
                onSend-transaction={sendTransaction}
                onOn-back={onBack}
              />
            ),
            // After a transfer and after a letter that went out: "Zurück", to where the member
            // came from (E-043), as the form's own button. The link, the errors and the check
            // view keep their way back into the form.
            transactionResultSendSuccess: () => (
              <SuccessMessage
                message={t('form.send_transaction_success')}
                buttonText={t('back')}
                onOn-back={leave}
              />
            ),
            transactionResultSendError: () => (
              <TransactionResultSendError
                error={error.value}
                errorResult={errorResult.value}
                onOn-back={onBack}
              />
            ),
            recipientNotFound: () => (
              <RecipientNotFound
                identifier={transactionData.identifier}
                communityName={transactionData.targetCommunity?.name ?? ''}
                isEmail={isEmailIdentifier(transactionData.identifier)}
                canChooseCommunity={canChooseCommunity.value}
                busy={loading.value}
                onSend-by-email={sendByEmail}
                onChoose-community={changeRecipient}
                onChange-recipient={changeRecipient}
              />
            ),
            sendByEmailReady: () => (
              <ThankYouGreetingDone
                created={madeForEmail.value}
                emailAddress={emailAddress.value}
                onAnother={onBack}
              />
            ),
            transactionResultLink: () => (
              <TransactionResultLink
                link={link.value ?? ''}
                amount={String(amount.value)}
                memo={memo.value}
                validUntil={validUntil.value ?? ''}
                onOn-back={onBack}
              />
            ),
            sendEmailResultSuccess: () => (
              <SuccessMessage
                message={t('form.send_email_success')}
                buttonText={t('back')}
                onOn-back={leave}
              />
            ),
            sendEmailResultError: () => (
              <SendEmailResultError
                error={error.value}
                errorResult={errorResult.value}
                onOn-back={onBack}
              />
            ),
          }}
        </GddSend>
      </div>
    )
  },
})
