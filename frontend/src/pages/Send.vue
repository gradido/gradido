<template>
  <div>
    <gdd-send :current-transaction-step="currentTransactionStep">
      <template #transactionForm>
        <transaction-form
          v-bind="transactionData"
          v-model:picture="picture"
          :balance="balance"
          :checking="checkingRecipient"
          @send-email="sendEmail"
          @set-transaction="setTransaction"
          @set-send-type="handleSendTypeChange"
          @back="leave"
        ></transaction-form>
      </template>
      <template #transactionConfirmationSend>
        <transaction-confirmation-send
          :balance="balance"
          v-bind="transactionData"
          :picture="pictureToSend"
          @send-transaction="sendTransaction"
          @on-back="onBack"
        ></transaction-confirmation-send>
      </template>
      <template #transactionConfirmationLink>
        <transaction-confirmation-link
          :balance="balance"
          :email="transactionData.identifier"
          :amount="transactionData.amount"
          :memo="transactionData.memo"
          :loading="loading"
          @send-transaction="sendTransaction"
          @on-back="onBack"
        ></transaction-confirmation-link>
      </template>
      <!-- After a transfer and after a letter that went out: "Zurück", to where the member came
           from (E-043), as the form's own button. The link, the errors and the check view keep
           their way back into the form. -->
      <template #transactionResultSendSuccess>
        <success-message
          :message="$t('form.send_transaction_success')"
          :button-text="$t('back')"
          @on-back="leave"
        ></success-message>
      </template>
      <template #transactionResultSendError>
        <transaction-result-send-error
          :error="error"
          :error-result="errorResult"
          @on-back="onBack"
        ></transaction-result-send-error>
      </template>
      <template #recipientNotFound>
        <recipient-not-found
          :identifier="transactionData.identifier"
          :community-name="transactionData.targetCommunity?.name ?? ''"
          :is-email="isEmailIdentifier(transactionData.identifier)"
          :can-choose-community="canChooseCommunity"
          :busy="loading"
          @send-by-email="sendByEmail"
          @choose-community="onBack"
          @change-recipient="onBack"
        ></recipient-not-found>
      </template>
      <template #sendByEmailReady>
        <thank-you-greeting-done
          :created="madeForEmail"
          :email-address="emailAddress"
          @another="onBack"
        ></thank-you-greeting-done>
      </template>
      <template #transactionResultLink>
        <transaction-result-link
          :link="link"
          :amount="amount"
          :memo="memo"
          :valid-until="validUntil"
          @on-back="onBack"
        ></transaction-result-link>
      </template>
      <template #sendEmailResultSuccess>
        <success-message
          :message="$t('form.send_email_success')"
          :button-text="$t('back')"
          @on-back="leave"
        ></success-message>
      </template>
      <template #sendEmailResultError>
        <send-email-result-error
          :error="error"
          :error-result="errorResult"
          @on-back="onBack"
        ></send-email-result-error>
      </template>
    </gdd-send>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { computed, ref, reactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import GddSend, { TRANSACTION_STEPS } from '@/components/GddSend'
import TransactionForm from '@/components/GddSend/TransactionForm'
import TransactionConfirmationSend from '@/components/GddSend/TransactionConfirmationSend'
import TransactionConfirmationLink from '@/components/GddSend/TransactionConfirmationLink'
import SuccessMessage from '@/components/SuccessMessage'
import SendEmailResultError from '@/components/GddSend/SendEmailResultError'
import TransactionResultSendError from '@/components/GddSend/TransactionResultSendError'
import TransactionResultLink from '@/components/GddSend/TransactionResultLink'
import RecipientNotFound from '@/components/GddSend/RecipientNotFound.vue'
import ThankYouGreetingDone from '@/components/ThankYouGreeting/ThankYouGreetingDone.vue'
import { linkAmountMax } from '@/constants'
import {
  addThankYouGreetingPicture,
  sendCoins,
  createTransactionLink,
  sendEmail as sendEmailMut,
} from '@/graphql/mutations.js'
import { reachableCommunities } from '@/graphql/communities.graphql'
import { user as userQuery } from '@/graphql/queries'
import { rememberGreetingPicture } from '@/composables/useGreetingPictures'
import { usePassOnDraft } from '@/composables/usePassOnDraft'
import { useSendReturn } from '@/composables/useSendReturn'
import { useAppToast } from '@/composables/useToast'
import { backOrOverviewUnless } from '@/utils/backOrOverview'
import { memberAlias } from '@/utils/gradidoAddress'
import { isRecipientNotFoundError, isUserNotFoundAnswer } from '@/utils/recipientNotFound'
import { SEND_TYPES } from '@/utils/sendTypes'
import { chatImageProblemWords, chatImageRefusal, encodeChatImage } from '@/utils/chatImage'
import { lineFromMemo } from '@/utils/thankYouGreeting'
import {
  encodeThankYouPictures,
  THANK_YOU_PICTURE_SMALL,
  thankYouPictureInput,
} from '@/utils/thankYouPicture'
import { isEmailIdentifier } from '@/validationSchemas'

const { t } = useI18n()
const EMPTY_TRANSACTION_DATA = {
  identifier: '',
  amount: 0,
  subject: '',
  memo: '',
}

const props = defineProps({
  balance: { type: Number, default: 0 },
  GdtBalance: { type: Number, default: 0 },
})

const emit = defineEmits(['set-tunneled-email', 'update-transactions'])

const route = useRoute()
const router = useRouter()
const { client: apolloClient } = useApolloClient()
const { toastError, toastSuccess } = useAppToast()

const transactionData = reactive({ ...EMPTY_TRANSACTION_DATA })

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
 * The form is taken down between the steps: the check view's "Zurück" finds the picture here. A
 * transfer that was sent lets it go, one that failed leaves it; the form's own "Zurück" leaves the
 * page, and the picture with it.
 */
const picture = shallowRef(null)

/**
 * What of it goes with THIS transfer: nothing to a member of another community -- there the
 * form shows a sentence in the field's place, and a picture chosen before waits here untouched
 * -- and nothing with a link.
 */
const pictureToSend = computed(() =>
  transactionData.selected === SEND_TYPES.send && transactionData.targetCommunity?.foreign !== true
    ? picture.value
    : null,
)

/**
 * The received thank-you this visit's transfer passes on, where "Jemandem danken" led here
 * (usePassOnDraft) -- or null. The trail of the thank-you (`passOnOf` of sendCoins); nothing of
 * it is shown.
 *
 * Taken once, when the page is made, and kept HERE, beside `transactionData` as the picture is:
 * the form is taken down between the steps, and the check view's "Zurück" finds it here. A
 * transfer that was sent lets it go, one that failed keeps it. Named with a transfer to a member
 * of this community only -- a link, a letter and a member of another community go without it.
 *
 * ⛔ Never in the store, the device's storage or Apollo's cache (usePassOnDraft says why).
 */
const passOnOf = ref(usePassOnDraft().take())

/**
 * Where "Zurück" leads (E-043): the place one of the three windows named when it opened this form
 * (useSendReturn) -- the conversation, the group, the map -- or null, and then the browser's
 * history decides (`leave`).
 *
 * Taken when the page is made, and again at every change of its address: ⛔ the form beside /send
 * is patched, not rebuilt, when a contact is tapped in the column (TransactionForm says so), and
 * setup does not run again. A way back handed over for the path the page stands on now takes the
 * place of the one held. A new path without one lets it go -- another recipient, with no window
 * that named a place. A change of the query alone (`onBack` takes `?art` out of the address) is
 * the same form for the same recipient, and the way back stays.
 */
const sendReturn = useSendReturn()
const returnTo = shallowRef(sendReturn.take(route.path))
let returnToPath = route.path
watch(
  () => route.fullPath,
  () => {
    const handed = sendReturn.take(route.path)
    if (handed) {
      returnTo.value = handed
    } else if (route.path !== returnToPath) {
      returnTo.value = null
    }
    returnToPath = route.path
  },
)

/**
 * "Zurück" from the form, and after a transfer or a letter that went out: out of the page, to the
 * place the window that opened it named, or else back by the browser's history -- never through
 * the form for the recipient before (backOrOverviewUnless).
 */
function leave() {
  if (returnTo.value) {
    router.push(returnTo.value)
  } else {
    backOrOverviewUnless(router, 'Send')
  }
}

/**
 * The picture as the mutation takes it: `{ motif }`, or `{ picture }` -- the photo in the
 * chat's measure (THANK_YOU_PICTURE_SMALL), encoded now, right before it is sent --, or nothing.
 * Rejects with a ChatImageError where the photo cannot be made small enough.
 */
const pictureArguments = async (chosen) => {
  if (chosen?.motif) return { motif: chosen.motif }
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
const currentTransactionStep = ref(TRANSACTION_STEPS.transactionForm)
const loading = ref(false)
const link = ref(null)
const amount = ref(0)
const memo = ref('')
const validUntil = ref(null)

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
 * The link that was made for a mail (`sendByEmail`), as "Fertig" shows it, and the address the
 * mail is for.
 *
 * ⛔ The wallet keeps the address here, in the memory of this page, and nowhere else: never the
 * store, the device's storage, the link or an event (ZE-037). And BESIDE `transactionData`: that
 * one is bound as a whole onto the form and the check view. It goes when the member leaves this
 * view, or the page with its memory.
 */
const madeForEmail = shallowRef(null)
const emailAddress = ref('')

const handleSendTypeChange = (sendType) => {
  // console.log('handleSendTypeChange', sendType)
  // Update the radioSelected in transactionData
  transactionData.selected = sendType
  // Optionally, you could also update the currentTransactionStep
  // if you want different initial states for each send type
  if (sendType === SEND_TYPES.email) {
    currentTransactionStep.value = TRANSACTION_STEPS.sendEmailForm
  } else {
    currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
  }
  // console.log('currentTransactionStep', currentTransactionStep.value)
}

/**
 * Whether "Jetzt prüfen" can ask the server about this recipient first: a transfer to somebody
 * typed into the form, in this community. `user` knows the members of this community only -- for
 * another one the question stays with "Jetzt senden".
 *
 * ⚠️ Not on /send/<community>/<user>: there the form has asked already, and its recipient is empty
 * until the answer has come.
 */
const canAskFirst = ({ selected, targetCommunity }) =>
  selected === SEND_TYPES.send && targetCommunity?.foreign !== true && !route.params.userIdentifier

/** Nobody has that account: the step that says so, and what can be done about it. */
function showRecipientNotFound() {
  // The list the switch in the form asked for, as it stands in the cache: no second list.
  const communities = apolloClient.readQuery({ query: reachableCommunities })?.reachableCommunities
  canChooseCommunity.value = (communities?.length ?? 0) > 1
  currentTransactionStep.value = TRANSACTION_STEPS.recipientNotFound
}

/**
 * "Jetzt prüfen" for a member of this community (ZE-037): found, and the check view names them by
 * their user name (NU-018: never the real name); not found, and the step for that. Anything else
 * that goes wrong is said as it is, and the form stays. ⛔ Never "no account" because the network
 * was gone (isUserNotFoundAnswer).
 *
 * Asked anew at every press and kept nowhere (`no-cache`): an address without an account a minute
 * ago may have one now, and what was typed has no place in Apollo's cache.
 *
 * ⛔ What was pressed goes over to the page only with the answer: where an error leaves the form
 * standing, `transactionData` holds nothing of a press that did not go through.
 *
 * ⛔ The answer counts on the address it was asked on: a contact tapped in the meantime names
 * another recipient, and this answer must not take that one's form away. A line that gives no answer
 * (RECIPIENT_CHECK_MAX_MS) must not hold the form either: it is the whole of the member's work.
 */
async function checkRecipient(pressed) {
  checkingRecipient.value = true
  const askedOn = route.fullPath
  let giveUp
  const tooLate = new Promise((_resolve, reject) => {
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
        // A press after RECIPIENT_CHECK_MAX_MS has to ask anew: Apollo would hang it on the request
        // that is still open, and that one gives no answer.
        context: { queryDeduplication: false },
      }),
      tooLate,
    ])
    if (route.fullPath !== askedOn) return
    Object.assign(transactionData, pressed, {
      userName: memberAlias(data.user.alias, data.user.gradidoID),
    })
    currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
  } catch (err) {
    if (route.fullPath !== askedOn) return
    if (isUserNotFoundAnswer(err)) {
      Object.assign(transactionData, pressed, { userName: '' })
      showRecipientNotFound()
    } else {
      toastError(err.message)
    }
  } finally {
    clearTimeout(giveUp)
    checkingRecipient.value = false
  }
}

async function setTransaction(data) {
  // console.log('Send.vue: setTransaction', data)
  // One question for one press: Enter beside a tap, or a second tap while the answer is on its way.
  if (checkingRecipient.value) return
  if (canAskFirst(data)) {
    await checkRecipient(data)
    return
  }
  Object.assign(transactionData, data)
  switch (data.selected) {
    case SEND_TYPES.send:
      // console.log('Send.vue setTransaction: data.selected=' + SEND_TYPES.send)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
      break
    case SEND_TYPES.link:
      // console.log('Send.vue setTransaction: data.selected=' + SEND_TYPES.link)
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationLink
      break
    case SEND_TYPES.email:
      // console.log('Send.vue setTransaction: data.selected=' + SEND_TYPES.email)
      // console.log('ERROR: setTransaction: mit SEND_TYPES=email darf eigentlich nicht vorkommen!!!')

      // currentTransactionStep.value = TRANSACTION_STEPS.sendEmail
      break
    default:
      // console.log('Send.vue setTransaction: data.selected=default')
      currentTransactionStep.value = TRANSACTION_STEPS.transactionConfirmationSend
      break
  }
  // console.log('Send.vue setTransaction: currentTransactionStep', currentTransactionStep.value)
}

async function sendEmail(data) {
  // console.log('Send.vue sendEmail', data)
  Object.assign(transactionData, data)
  loading.value = true
  error.value = false

  try {
    if (data.selected === SEND_TYPES.email) {
      // console.log('Send.vue sendEmail: data.selected=' + data.selected)
      const result = await sendEmailMutation({
        recipientCommunityIdentifier: data.targetCommunity.uuid,
        recipientIdentifier: data.identifier,
        subject: data.subject,
        memo: data.memo,
      })
      if (result) {
        currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultSuccess
        forgetEntries()
        // toastSuccess(t('email-sent-success'))
      } else {
        currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
        // toastError(t('email-sent-error'))
      }
      // console.log('Send.vue sendEmail: result', result)
    }
  } catch (err) {
    if (transactionData.selected === SEND_TYPES.email) {
      errorResult.value = err.message
      error.value = true
      currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
    } else {
      toastError(err.message)
    }
  } finally {
    loading.value = false
  }
}

async function sendTransaction() {
  // console.log('Send.vue sendTransaction(): transactionData=', JSON.stringify(transactionData))
  // One transfer for one press: the photo is encoded before the mutation goes out, and a second
  // press in that time -- or Enter beside a tap -- must not send a second one.
  if (loading.value) return
  loading.value = true
  error.value = false

  try {
    if (transactionData.selected === SEND_TYPES.send) {
      let withPicture
      try {
        withPicture = await pictureArguments(pictureToSend.value)
      } catch (problem) {
        // The photo cannot be made ready: nothing is sent, the chat's sentence says why, and
        // what the member entered -- the picture too -- stands in the form again.
        toastError(chatImageProblemWords(problem?.problem, t))
        currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
        return
      }
      // Without a picture the mutation carries neither of the two arguments -- and without a
      // thank-you passed on to a member of this community, no `passOnOf` either.
      const passingOn =
        passOnOf.value && transactionData.targetCommunity?.foreign !== true
          ? { passOnOf: passOnOf.value }
          : {}
      await sendCoinsMutation({
        recipientCommunityIdentifier: transactionData.targetCommunity.uuid,
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
      // The photo as decoded is needed no more. Its bytes are not kept either: the wallet does
      // not learn the booking's id from this answer, and the conversation asks the server.
      forgetEntries()
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendSuccess
    } else if (transactionData.selected === SEND_TYPES.link) {
      const result = await createTransactionLinkMutation({
        amount: transactionData.amount.toString(),
        memo: transactionData.memo,
      })

      emit('set-tunneled-email', null)
      const {
        link: newLink,
        amount: newAmount,
        memo: newMemo,
        validUntil: newValidUntil,
      } = result.data.createTransactionLink
      link.value = newLink
      amount.value = newAmount
      memo.value = newMemo
      validUntil.value = newValidUntil
      forgetEntries()
      currentTransactionStep.value = TRANSACTION_STEPS.transactionResultLink
      updateTransactions({})
    } else if (transactionData.selected === SEND_TYPES.email) {
      // console.log('Send.vue sendTransaction(): email transactionData=' + transactionData)
      currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultSuccess
      // throw new Error('Email transaction sending not implemented yet')
    } else {
      throw new Error(`undefined transactionData.selected : ${transactionData.selected}`)
    }
  } catch (err) {
    if (transactionData.selected === SEND_TYPES.send) {
      // Nobody has that account after all -- in another community, whose answer comes only now, or
      // here, where the account is gone since "Jetzt prüfen": the same step, not the dead end.
      // ⚠️ With a recipient to show: on /send/<community>/<user> it stays empty where the form's
      // own question found nobody.
      if (isRecipientNotFoundError(err.message) && transactionData.identifier) {
        showRecipientNotFound()
      } else {
        errorResult.value = err.message
        error.value = true
        currentTransactionStep.value = TRANSACTION_STEPS.transactionResultSendError
      }
    } else if (transactionData.selected === SEND_TYPES.email) {
      errorResult.value = err.message
      error.value = true
      currentTransactionStep.value = TRANSACTION_STEPS.sendEmailResultError
    } else {
      toastError(err.message)
    }
  } finally {
    // ⛔ The address stays as it is (E-043): a `push('/send')` here threw the recipient out of it,
    // and "Zurück" after the success needs the way back and the browser's history untouched.
    loading.value = false
  }
}

/**
 * "Dank per E-Mail schicken": the link is made out of what stands in the form, without another
 * form in between -- as a thank-you greeting where a picture was chosen, as a plain link where
 * none was. The mail itself is the member's own, from the view this leads to.
 *
 * With a photo it is the chain of the greeting's page (pages/ThankYouGreeting.vue says why):
 * both renditions, the link with the small one, the large one in a request of its own, which may
 * fail without a word. A photo that cannot be made small enough makes nothing.
 *
 * ⛔ What is made is what stands at this press: taken before anything waits, and let go only when
 * the link is there. `pictureToSend` and not `picture`: a picture chosen before the member named
 * another community is no part of this any more, the form has said so.
 */
async function sendByEmail() {
  // One link for one press.
  if (loading.value) return
  const { amount: linkAmount, memo: linkMemo, identifier: address } = transactionData
  const chosen = pictureToSend.value
  // A link holds a little more than its amount: the server would refuse this in its own words.
  // The amount is changed in the form, so that is where this leads back to.
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
      ...(pictures ? { picture: thankYouPictureInput(pictures.small) } : { motif: chosen.motif }),
      line: lineFromMemo(linkMemo),
      recipientName: null,
    }
    const result = await createTransactionLinkMutation({
      amount: linkAmount.toString(),
      memo: linkMemo,
      ...(greeting ? { greeting } : {}),
    })
    const made = result.data.createTransactionLink
    // The member's own photo, for their list of links: not asked for again a moment later.
    if (pictures) rememberGreetingPicture(made.id, pictures.small.data)
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
    if (err?.name === 'ChatImageError') {
      toastError(chatImageProblemWords(err.problem, t))
      currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
    } else if (chatImageRefusal(err) === 'IMAGE_NOT_ACCEPTED') {
      toastError(t('chatThread.imageNotAccepted'))
    } else {
      toastError(err.message)
    }
  } finally {
    loading.value = false
  }
}

async function onBack() {
  // `?art` is the command that opened the form, and the member has chosen another tab since. The form
  // is built anew now and would obey it again: "Adresse ändern" would lead to the link tab, which has
  // no address field. So it leaves the address first. (Here and not at the tab: a change of address
  // brings the window to the top of the page, and a member choosing a tab stands further down.)
  if (route.query.art && route.query.art !== transactionData.selected) {
    const { art: _answered, ...query } = route.query
    await router.replace({ path: route.path, query, hash: route.hash })
  }
  emailAddress.value = ''
  madeForEmail.value = null
  currentTransactionStep.value = TRANSACTION_STEPS.transactionForm
}

function updateTransactions(pagination) {
  emit('update-transactions', pagination)
}
</script>
