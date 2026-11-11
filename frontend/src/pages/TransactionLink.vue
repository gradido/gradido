<template>
  <div class="show-transaction-link-informations">
    <!-- Outside the v-if: the triads stand while the link is still loading and above every
         state it turns out to have. Their own bottom padding is the gap to the cards below,
         as it is to the form on the login and register pages. -->
    <auth-triads />
    <div v-if="isTransactionLinkLoaded">
      <!-- A member's redeem link arrives as a thank-you on a sheet, whatever state it is in --
           of this community or of another one. A contribution link keeps the page below. -->
      <redeem-thanks
        v-if="isThanksLink"
        :link-data="linkData"
        :state="itemType"
        :redeem-code="redeemCode"
        :accepting="accepting"
        :stage="thanksStage"
        :picture="shownThanksPicture"
        @accept="acceptThanks"
        @open-account="openAccount"
      />
      <!-- A contribution link: a guest is asked in; a member's is booked as the page opens. -->
      <transaction-link-item v-else :type="itemTypeExt">
        <template #LOGGED_OUT>
          <redeem-logged-out :link-data="linkData" />
        </template>

        <template #TEXT>
          <redeemed-text-box :text="redeemedBoxText" />
        </template>
      </transaction-link-item>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWalletStore } from '@/store/useWalletStore'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { AuthTriads } from '@/components/Auth/AuthTriads'
import TransactionLinkItem from '@/components/TransactionLinkItem'
import RedeemLoggedOut from '@/components/LinkInformations/RedeemLoggedOut'
import RedeemedTextBox from '@/components/LinkInformations/RedeemedTextBox'
import RedeemThanks from '@/components/LinkInformations/RedeemThanks'
import { useSignIn } from '@/composables/useSignIn'
import { holdAccountWindowsForThisSession } from '@/composables/useFirstLoginWindow'
import { useThankYouLinkPicture } from '@/composables/useThankYouLinkPicture'
import { useAppToast } from '@/composables/useToast'
import { queryTransactionLink } from '@/graphql/queries'
import { createUser, disburseTransactionLink, redeemTransactionLink } from '@/graphql/mutations'
import { useI18n } from 'vue-i18n'
import CONFIG from '@/config'

const { toastError, toastSuccess } = useAppToast()
const router = useRouter()
const { params, meta, query } = useRoute()
const store = useWalletStore()
const { d, t } = useI18n()

const isTransactionLinkLoaded = ref(false)
const linkData = ref({
  __typename: 'TransactionLink',
  validUntil: null,
  amount: 0,
  memo: '',
  senderCommunity: null,
  senderUser: null,
  senderAvatar: null,
  recipientCommunity: null,
  recipientUser: null,
  deletedAt: null,
  redeemedAt: null,
  validLink: false,
  communities: [],
  // ContributionLink fields
  validTo: null,
  validFrom: null,
  name: '',
  cycle: null,
  link: '',
  maxAmountPerMonth: null,
})

const redeemedBoxText = ref('')

// `codeCommunityUuid`: the link is another community's, the switch of its page sent the browser
// here (useRedeemCommunity).
const { result, onResult, error, onError, refetch } = useQuery(queryTransactionLink, {
  code: params.code,
  codeCommunityUuid: query.codeCommunityUuid ?? null,
})

const { mutate: redeemMutate } = useMutation(redeemTransactionLink)
const { mutate: disburseMutate } = useMutation(disburseTransactionLink)
const { mutate: createUserMutate } = useMutation(createUser)
// Signing in as the login page does it, step for step (useSignIn).
const { signIn } = useSignIn()

const isContributionLink = computed(() => {
  return params.code?.search(/^CL-/) === 0
})

const isMemberLink = (answer) =>
  ['TransactionLink', 'ForeignTransactionLink'].includes(answer?.queryTransactionLink?.__typename)

// A member's redeem link, of this community or of another one: no contribution link (`CL-...`).
// This kind is received as a thank-you (RedeemThanks).
const isThanksLink = computed(() => isTransactionLinkLoaded.value && isMemberLink(result.value))

// A link of another community: it is booked there (disburseTransactionLink), and its photo
// comes with it.
const isForeignLink = computed(
  () => result.value?.queryTransactionLink?.__typename === 'ForeignTransactionLink',
)

// "Where is your account?" -- asked on a member's link of this community only: whoever came
// here from another community has named theirs already.
const asksCommunity = computed(
  () => CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE && isThanksLink.value && !isForeignLink.value,
)

// What just happened to the thank-you on this page, for RedeemThanks: 'almost' where the account
// opened here could not be signed in to. It belongs to the moment: it is not in the address and
// not in the store, so a reload shows the link's state. A thank-you booked here has no stage: the
// page leads to the overview (E-045).
const thanksStage = ref(null)

const redeemCode = computed(() => params.code)

const tokenExpiresInSeconds = computed(() => {
  const remainingSecs = Math.floor(
    (new Date(store.tokenTime * 1000).getTime() - new Date().getTime()) / 1000,
  )
  return remainingSecs <= 0 ? 0 : remainingSecs
})

const itemType = computed(() => {
  // console.log('TransactionLink.itemType... isTransactionLinkLoaded=', isTransactionLinkLoaded.value)
  if (isTransactionLinkLoaded.value) {
    // console.log('TransactionLink.itemType... linkData.value=', linkData.value)
    if (linkData.value.deletedAt) {
      // console.log('TransactionLink.itemType... TEXT_DELETED')
      return 'TEXT_DELETED'
    }

    // Taken comes before run out: a thank-you somebody accepted is still an accepted one
    // after its last day. Asked the other way round, the page said of it that it had gone
    // back to its sender. Only a member's link carries `redeemedAt`.
    if (linkData.value.redeemedAt) {
      // console.log('TransactionLink.itemType... TEXT_REDEEMED')
      return 'TEXT_REDEEMED'
    }

    const validUntilDate = new Date(linkData.value.validUntil)
    // console.log('TransactionLink.itemType... validUntilDate=', validUntilDate)
    // console.log('TransactionLink.itemType... new Date()=', new Date())
    // console.log(
    //   'TransactionLink.itemType... validUntilDate.getTime() < new Date().getTime()=',
    //   validUntilDate.getTime() < new Date().getTime(),
    // )
    if (validUntilDate.getTime() < new Date().getTime()) {
      // console.log('TransactionLink.itemType... TEXT_EXPIRED')
      return 'TEXT_EXPIRED'
    }
    if (linkData.value.deletedAt) {
      // console.log('TransactionLink.itemType... TEXT_DELETED')
      return 'TEXT_DELETED'
    }
    if (store.token && store.tokenTime) {
      if (tokenExpiresInSeconds.value < 5) {
        // console.log(
        //   'TransactionLink.itemType... CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE=',
        //   CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE,
        // )
        return asksCommunity.value ? 'REDEEM_SELECT_COMMUNITY' : 'LOGGED_OUT'
      }
    }
    // console.log(
    //   'TransactionLink.itemType... linkData.value.recipientUser=',
    //   linkData.value.recipientUser,
    // )
    // console.log('TransactionLink.itemType... linkData.value=', linkData.value)
    // console.log('TransactionLink.itemType... store.gradidoID=', store.gradidoID)
    // console.log('TransactionLink.itemType... linkData.value.senderUser=', linkData.value.senderUser)
    // console.log(
    //   'TransactionLink.itemType... linkData.value.recipientUser.gradidoID=',
    //   linkData.value.recipientUser?.gradidoID,
    // )
    // console.log(
    //   'TransactionLink.itemType... linkData.value.senderUser.gradidoID=',
    //   linkData.value.senderUser?.gradidoID,
    // )
    if (
      linkData.value.senderUser &&
      linkData.value.recipientUser &&
      linkData.value.senderUser.gradidoID === linkData.value.recipientUser.gradidoID
    ) {
      // console.log('TransactionLink.itemType... SELF_CREATOR')
      return 'SELF_CREATOR'
    }
    if (
      linkData.value.senderUser &&
      linkData.value.recipientUser &&
      linkData.value.senderUser.gradidoID !== linkData.value.recipientUser.gradidoID &&
      store.gradidoID === linkData.value.recipientUser.gradidoID
    ) {
      // console.log('TransactionLink.itemType... VALID')
      // console.log('TransactionLink.itemType... linkData.value=', linkData.value)
      // console.log('TransactionLink.itemType... store.gradidoID=', store.gradidoID)
      // console.log(
      //   'TransactionLink.itemType... linkData.value.recipientUser.gradidoID=',
      //   linkData.value.recipientUser.gradidoID,
      // )
      // console.log(
      //   'TransactionLink.itemType... linkData.value.senderUser.gradidoID=',
      //   linkData.value.senderUser.gradidoID,
      // )
      return 'VALID'
    }
  }
  // console.log(
  //   'TransactionLink.itemType... vor last return CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE=',
  //   CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE,
  // )
  return asksCommunity.value ? 'REDEEM_SELECT_COMMUNITY' : 'LOGGED_OUT'
})

const itemTypeExt = computed(() => {
  // console.log('TransactionLink.itemTypeExt... itemType=', itemType.value)
  if (itemType.value.startsWith('TEXT')) {
    return 'TEXT'
  }
  return itemType.value
})

watch(itemType, (newItemType) => {
  // console.log('TransactionLink.watch... itemType=', itemType.value)
  updateRedeemedBoxText(newItemType)
})

// The photo of a thank-you greeting that carries one, for the sheet (useThankYouLinkPicture):
// asked for once, as soon as the page knows that the link is open and its greeting has a photo
// -- and kept from then on: the sheet and the strip over the account form show the same one.
// A link of another community brought its photo along: this community's address of photos has
// none of it.
const { picture: thanksPicture, load: loadThanksPicture } = useThankYouLinkPicture()
watch(
  () => [
    isThanksLink.value && !isForeignLink.value,
    linkData.value?.greeting?.hasPicture,
    itemType.value,
  ],
  ([thanks, hasPicture, state]) => {
    if (thanks && hasPicture === true && !state.startsWith('TEXT')) {
      loadThanksPicture(redeemCode.value)
    }
  },
  { immediate: true },
)

const shownThanksPicture = computed(() => {
  if (!isForeignLink.value) return thanksPicture.value
  return linkData.value.picture ? `data:image/jpeg;base64,${linkData.value.picture}` : null
})

function updateRedeemedBoxText(type) {
  // console.log('TransactionLink.updateRedeemedBoxText... type=', type)
  switch (type) {
    case 'TEXT_DELETED':
      redeemedBoxText.value = t('gdd_per_link.link-deleted', {
        date: d(new Date(linkData.value.deletedAt), 'long'),
      })
      break
    case 'TEXT_EXPIRED':
      redeemedBoxText.value = t('gdd_per_link.link-expired', {
        date: d(new Date(linkData.value.validUntil), 'long'),
      })
      break
    case 'TEXT_REDEEMED':
      redeemedBoxText.value = t('gdd_per_link.redeemed-at', {
        date: d(new Date(linkData.value.redeemedAt), 'long'),
      })
      break
    default:
      redeemedBoxText.value = ''
  }
  // console.log('TransactionLink.updateRedeemedBoxText... redeemedBoxText=', redeemedBoxText)
}

const emit = defineEmits(['set-mobile-start'])

onMounted(() => {
  // console.log('TransactionLink.onMounted... params=', params)
  emit('set-mobile-start', false)
})

onResult(() => {
  // console.log('TransactionLink.onResult... result=', result.value)
  // console.log('TransactionLink.onResult... stringify result=', JSON.stringify(result.value))
  if (isMemberLink(result.value)) {
    isTransactionLinkLoaded.value = true
    setTransactionLinkInformation()
  } else if (result.value?.queryTransactionLink?.__typename === 'ContributionLink') {
    // console.log('TransactionLink.onResult... ContributionLink')
    isTransactionLinkLoaded.value = true
    setContributionLinkInformation()
  } else {
    // console.log('TransactionLink.onResult... unknown type:', result.value)
  }
})

onError(() => {
  // console.log('TransactionLink.onError... error=', error)
  toastError(t('gdd_per_link.redeemlink-error'))
})

// `answer`: what the query answered. The live result, or the answer of a refetch handed in
// directly -- the live result follows a refetch a moment later.
function setTransactionLinkInformation(answer = result.value) {
  // console.log('TransactionLink.setTransactionLinkInformation... result=', result.value)
  // const queryTransactionLink = result.value.queryTransactionLink
  const deepCopy = JSON.parse(JSON.stringify(answer))
  // console.log('TransactionLink.setTransactionLinkInformation... deepCopy=', deepCopy)
  if (isMemberLink(deepCopy)) {
    // console.log('TransactionLink.setTransactionLinkInformation... typename === TransactionLink')
    // recipientUser is only set if the user is logged in
    if (store.gradidoID !== null) {
      // console.log(
      //   'TransactionLink.setTransactionLinkInformation... gradidoID=',
      //   store.gradidoID,
      // )
      deepCopy.queryTransactionLink.recipientUser = {
        __typename: 'User',
        gradidoID: store.gradidoID,
        firstName: store.firstName,
        alias: store.alias,
      }
      // console.log(
      //   'TransactionLink.setTransactionLinkInformation... deepCopy.queryTransactionLink.recipientUser=',
      //   deepCopy.queryTransactionLink.recipientUser,
      // )
    }
    linkData.value = deepCopy.queryTransactionLink
    // console.log('TransactionLink.setTransactionLinkInformation... linkData.value=', linkData.value)
  }
}

function setContributionLinkInformation() {
  linkData.value = result.value.queryTransactionLink
  if (linkData.value.__typename === 'ContributionLink' && store.token) {
    // console.log('TransactionLink.setTransactionLinkInformation... typename === ContributionLink')
    // explicit no await
    mutationLink(linkData.value.amount)
  }
}

// The booking of a thank-you is on its way: the button waits, and a second tap asks nothing.
// Before, a double tap on "redeem" sent the request twice.
const accepting = ref(false)

// The booking of a member's link: a link of another community is paid out from there.
const bookThanks = () =>
  isForeignLink.value
    ? disburseMutate({
        senderCommunityUuid: linkData.value.senderCommunity.uuid,
        code: redeemCode.value,
      })
    : redeemMutate({ code: redeemCode.value })

// A member takes the thank-you with one tap, and stands on the overview once it is booked.
// Where the booking fails, the page says why and leads to the overview, as before.
async function acceptThanks() {
  if (accepting.value) return
  accepting.value = true
  try {
    await bookThanks()
    // E-045 (Bernd, 08.11.2026): the page after the booking said what the overview says anyway --
    // the tile, the answer, the chat mark; so the member lands there. The button stays locked
    // until the overview stands.
    await router.push('/overview')
  } catch (err) {
    toastError(err.message)
    await router.push('/overview')
  } finally {
    accepting.value = false
  }
}

// The server answered, and refused: not the network on the way to it. An answer decides
// something; the network decides nothing, and the same step can be asked again.
const answeredByServer = (err) => (err?.graphQLErrors?.length ?? 0) > 0

// The link once more, fresh from the server, and with it the state the page shows.
async function refreshLink() {
  const answer = await refetch()
  if (isMemberLink(answer?.data)) {
    setTransactionLinkInformation(answer.data)
  }
}

/**
 * A guest accepts the thank-you: the account is opened right here (ZE-017 F5). One tap, three
 * steps -- open the account, sign in as the login page does, book the thank-you -- and then the
 * overview, where the tile "Dein Dank ist da." stands (E-045).
 *
 * - No step runs twice. The button is locked while the chain runs, and a step that succeeded
 *   is remembered: a second `createUser` for the same address would write the new member the
 *   mail "somebody tried to register with your address".
 * - ⛔ The sign-in fails where the address was taken, and where the server opened the account
 *   the way through the mail (the link did not vouch). The page does not ask which, and does
 *   not tell the answers of the sign-in apart: every one of them is the same neutral view
 *   (E-017) -- unless the link is no longer open, then that is what there is to say.
 * - Signed in but not booked (the link was accepted or ran out in the meantime): the member is
 *   in, and the page shows what became of the link.
 * - Signed in to an account that is not confirmed yet: the name and the first creation wait for
 *   the next start, the thank-you comes first (E-044). The address still comes.
 * - The network failing is no answer: the usual message, the button free again, and the next
 *   tap goes on with the step that is open.
 *
 * ⛔ The password comes from the form with the tap and goes into the two requests. It is kept
 * nowhere: not here, not in the address, not in the store, not in a message.
 */
let accountOpenedFor = null
let signedInAs = null

async function openAccount({ firstName, lastName, email, password }) {
  if (accepting.value) return
  accepting.value = true
  try {
    if (accountOpenedFor !== email) {
      // What the registration form sends, and with it the code of the link and the password.
      await createUserMutate({
        email,
        firstName,
        lastName,
        language: store.language,
        publisherId: store.publisherId,
        redeemCode: redeemCode.value,
        // the link's community, where it is another one: the link is not here
        redeemCodeCommunityUuid: query.codeCommunityUuid ?? null,
        project: store.project,
        password,
      })
      accountOpenedFor = email
    }
    if (signedInAs !== email) {
      try {
        await signIn({ email, password })
      } catch (err) {
        if (!answeredByServer(err)) throw err
        await refreshLink()
        if (!itemType.value.startsWith('TEXT')) {
          thanksStage.value = 'almost'
        }
        return
      }
      signedInAs = email
      // E-044: whoever came for a thank-you meets it first; the name and the first creation wait
      // for the next start (useFirstLoginWindow). Only where the account is not confirmed yet:
      // whether it was opened just now cannot be read here -- `createUser` answers alike for
      // every address, and for one that had an account the server sends the mail about the
      // attempt (EM-013) --, so the confirmation is the mark. An account opened on this page is
      // unconfirmed; a confirmed member who only signs in here meets the windows as ever.
      // ⛔ After `signIn`, never before it: the sign-in ends every hold (store.js, `login`).
      if (store.emailChecked === false) holdAccountWindowsForThisSession()
    }
    try {
      await bookThanks()
    } catch (err) {
      if (!answeredByServer(err)) throw err
      toastError(err.message)
      await refreshLink()
      return
    }
    // E-045 (Bernd, 08.11.2026): the page after the booking said what the overview says anyway --
    // the tile, the answer, the chat mark; so the member lands there. The hold above was said
    // before the booking and lives in a module: the jump does not end it.
    await router.push('/overview')
  } catch (err) {
    // The text ends in its own space, as on the login page.
    toastError(t('error.unknown-error') + err.message)
  } finally {
    accepting.value = false
  }
}

// A contribution link, booked as the page opens for a member.
async function mutationLink(amount) {
  try {
    await redeemMutate({ code: redeemCode.value })
    toastSuccess(t('gdd_per_link.redeemed', { n: amount }))
  } catch (err) {
    toastError(err.message)
  }
  await router.push('/overview')
}
</script>
