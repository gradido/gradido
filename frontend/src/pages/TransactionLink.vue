<template>
  <div class="show-transaction-link-informations">
    <div v-if="isTransactionLinkLoaded" class="mt-4">
      <transaction-link-item :type="itemTypeExt">
        <template #LOGGED_OUT>
          <redeem-logged-out :link-data="linkData" :is-contribution-link="isContributionLink" />
        </template>
        <template #REDEEM_SELECT_COMMUNITY>
          <redeem-select-community
            :link-data="linkData"
            :redeem-code="redeemCode"
            :is-transaction-link-loaded="isTransactionLinkLoaded"
            :is-contribution-link="isContributionLink"
            :is-redeem-jwt-link="isRedeemJwtLink"
          />
        </template>

        <template #SELF_CREATOR>
          <redeem-self-creator :link-data="linkData" />
        </template>

        <template #VALID>
          <redeem-valid
            :link-data="linkData"
            :is-contribution-link="isContributionLink"
            :is-redeem-jwt-link="isRedeemJwtLink"
            :valid-link="validLink"
            @mutation-link="mutationLink"
          />
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
import { useStore } from 'vuex'
import { useQuery, useMutation } from '@vue/apollo-composable'
import TransactionLinkItem from '@/components/TransactionLinkItem'
import RedeemLoggedOut from '@/components/LinkInformations/RedeemLoggedOut'
import RedeemSelectCommunity from '@/components/LinkInformations/RedeemSelectCommunity'
import RedeemSelfCreator from '@/components/LinkInformations/RedeemSelfCreator'
import RedeemValid from '@/components/LinkInformations/RedeemValid'
import RedeemedTextBox from '@/components/LinkInformations/RedeemedTextBox'
import { useAppToast } from '@/composables/useToast'
import { queryTransactionLink } from '@/graphql/queries'
import { disburseTransactionLink, redeemTransactionLink } from '@/graphql/mutations'
import { useI18n } from 'vue-i18n'
import CONFIG from '@/config'

const { toastError, toastSuccess } = useAppToast()
const router = useRouter()
const { params, meta } = useRoute()
const store = useStore()
const { d, t } = useI18n()

const isTransactionLinkLoaded = ref(false)
const linkData = ref({
  __typename: 'TransactionLink',
  validUntil: null,
  amount: 0,
  memo: '',
  senderCommunity: null,
  senderUser: null,
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

const { result, onResult, error, onError } = useQuery(queryTransactionLink, {
  code: params.code,
})

const { mutate: redeemMutate } = useMutation(redeemTransactionLink)
const { mutate: disburseMutate } = useMutation(disburseTransactionLink)

const isContributionLink = computed(() => {
  return params.code?.search(/^CL-/) === 0
})

const isRedeemJwtLink = computed(() => {
  if (
    isTransactionLinkLoaded.value &&
    result.value?.queryTransactionLink?.__typename === 'RedeemJwtLink'
  ) {
    return true
  }
  return false
})

const redeemCode = computed(() => params.code)

const tokenExpiresInSeconds = computed(() => {
  const remainingSecs = Math.floor(
    (new Date(store.state.tokenTime * 1000).getTime() - new Date().getTime()) / 1000,
  )
  return remainingSecs <= 0 ? 0 : remainingSecs
})

const validLink = computed(() => {
  // console.log('TransactionLink.validLink... linkData.value.validUntil=', linkData.value.validUntil)
  // console.log('TransactionLink.validLink... new Date()=', new Date())
  if (!isTransactionLinkLoaded.value) {
    return false
  }
  if (!linkData.value.validUntil) {
    return false
  }
  const validUntilDate = new Date(linkData.value.validUntil)
  // console.log('TransactionLink.validLink... validUntilDate=', validUntilDate)
  // console.log('TransactionLink.validLink... new Date()=', new Date())
  // console.log(
  //   'TransactionLink.validLink... validUntilDate.getTime() >= new Date().getTime()=',
  //   validUntilDate.getTime() >= new Date().getTime(),
  // )
  return validUntilDate.getTime() >= new Date().getTime()
})

const itemType = computed(() => {
  // console.log('TransactionLink.itemType... isTransactionLinkLoaded=', isTransactionLinkLoaded.value)
  if (isTransactionLinkLoaded.value) {
    // console.log('TransactionLink.itemType... linkData.value=', linkData.value)
    if (linkData.value.deletedAt) {
      // console.log('TransactionLink.itemType... TEXT_DELETED')
      return 'TEXT_DELETED'
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
    if (linkData.value.redeemedAt) {
      // console.log('TransactionLink.itemType... TEXT_REDEEMED')
      return 'TEXT_REDEEMED'
    }
    if (linkData.value.deletedAt) {
      // console.log('TransactionLink.itemType... TEXT_DELETED')
      return 'TEXT_DELETED'
    }
    if (store.state.token && store.state.tokenTime) {
      if (tokenExpiresInSeconds.value < 5) {
        // console.log(
        //   'TransactionLink.itemType... CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE=',
        //   CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE,
        // )
        if (CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE) {
          // console.log('TransactionLink.itemType... REDEEM_SELECT_COMMUNITY')
          return 'REDEEM_SELECT_COMMUNITY'
        } else {
          // console.log('TransactionLink.itemType... LOGGED_OUT')
          return 'LOGGED_OUT'
        }
      }
    }
    // console.log(
    //   'TransactionLink.itemType... linkData.value.recipientUser=',
    //   linkData.value.recipientUser,
    // )
    // console.log('TransactionLink.itemType... linkData.value=', linkData.value)
    // console.log('TransactionLink.itemType... store.state.gradidoID=', store.state.gradidoID)
    // console.log('TransactionLink.itemType... isRedeemJwtLink=', isRedeemJwtLink.value)
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
      store.state.gradidoID === linkData.value.recipientUser.gradidoID
    ) {
      // console.log('TransactionLink.itemType... VALID')
      // console.log('TransactionLink.itemType... linkData.value=', linkData.value)
      // console.log('TransactionLink.itemType... store.state.gradidoID=', store.state.gradidoID)
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
  if (CONFIG.CROSS_TX_REDEEM_LINK_ACTIVE) {
    // console.log('TransactionLink.itemType...last return= REDEEM_SELECT_COMMUNITY')
    return 'REDEEM_SELECT_COMMUNITY'
  } else {
    // console.log('TransactionLink.itemType... last return= LOGGED_OUT')
    return 'LOGGED_OUT'
  }
})

const itemTypeExt = computed(() => {
  // console.log('TransactionLink.itemTypeExt... itemType=', itemType.value)
  // console.log('TransactionLink.itemTypeExt... validLink=', validLink.value)
  if (itemType.value.startsWith('TEXT')) {
    return 'TEXT'
  }
  return itemType.value
})

watch(itemType, (newItemType) => {
  // console.log('TransactionLink.watch... itemType=', itemType.value)
  // console.log('TransactionLink.watch... validLink=', validLink.value)
  updateRedeemedBoxText(newItemType)
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
  if (result.value?.queryTransactionLink?.__typename === 'TransactionLink') {
    // console.log('TransactionLink.onResult... TransactionLink')
    isTransactionLinkLoaded.value = true
    setTransactionLinkInformation()
  } else if (result.value?.queryTransactionLink?.__typename === 'ContributionLink') {
    // console.log('TransactionLink.onResult... ContributionLink')
    isTransactionLinkLoaded.value = true
    setContributionLinkInformation()
  } else if (result.value?.queryTransactionLink?.__typename === 'RedeemJwtLink') {
    // console.log('TransactionLink.onResult... RedeemJwtLink')
    isTransactionLinkLoaded.value = true
    setRedeemJwtLinkInformation()
  } else {
    // console.log('TransactionLink.onResult... unknown type:', result.value)
  }
})

onError(() => {
  // console.log('TransactionLink.onError... error=', error)
  toastError(t('gdd_per_link.redeemlink-error'))
})

function setTransactionLinkInformation() {
  // console.log('TransactionLink.setTransactionLinkInformation... result=', result.value)
  // const queryTransactionLink = result.value.queryTransactionLink
  const deepCopy = JSON.parse(JSON.stringify(result.value))
  // console.log('TransactionLink.setTransactionLinkInformation... deepCopy=', deepCopy)
  if (deepCopy && deepCopy.queryTransactionLink.__typename === 'TransactionLink') {
    // console.log('TransactionLink.setTransactionLinkInformation... typename === TransactionLink')
    // recipientUser is only set if the user is logged in
    if (store.state.gradidoID !== null) {
      // console.log(
      //   'TransactionLink.setTransactionLinkInformation... gradidoID=',
      //   store.state.gradidoID,
      // )
      deepCopy.queryTransactionLink.recipientUser = {
        __typename: 'User',
        gradidoID: store.state.gradidoID,
        firstName: store.state.firstName,
        alias: store.state.alias,
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
  if (linkData.value.__typename === 'ContributionLink' && store.state.token) {
    // console.log('TransactionLink.setTransactionLinkInformation... typename === ContributionLink')
    // explicit no await
    mutationLink(linkData.value.amount)
  }
}

function setRedeemJwtLinkInformation() {
  // console.log('TransactionLink.setRedeemJwtLinkInformation... result=', result.value)
  const deepCopy = JSON.parse(JSON.stringify(result.value))
  // console.log('TransactionLink.setRedeemJwtLinkInformation... deepCopy=', deepCopy)
  if (deepCopy) {
    // console.log('TransactionLink.setRedeemJwtLinkInformation... recipientUser is only set if the user is logged in')
    if (store.state.gradidoID !== null) {
      // console.log('TransactionLink.setRedeemJwtLinkInformation... gradidoID=', store.state.gradidoID)
      deepCopy.queryTransactionLink.recipientUser = {
        __typename: 'User',
        gradidoID: store.state.gradidoID,
        firstName: store.state.firstName,
        alias: store.state.alias,
      }
    }
    // console.log(
    //   'TransactionLink.setRedeemJwtLinkInformation... deepCopy.queryTransactionLink.recipientUser=',
    //   deepCopy.queryTransactionLink.recipientUser,
    // )
    linkData.value = deepCopy.queryTransactionLink
    // console.log('TransactionLink.setRedeemJwtLinkInformation... linkData.value=', linkData.value)
  }
}

async function mutationLink(amount) {
  // console.log('TransactionLink.mutationLink... params=', params)
  // console.log('TransactionLink.mutationLink... linkData.value=', linkData.value)
  // console.log('TransactionLink.mutationLink... linkData=', linkData)
  if (isRedeemJwtLink.value) {
    // console.log('TransactionLink.mutationLink... trigger disbursement from recipient-community')
    try {
      await disburseMutate({
        senderCommunityUuid: linkData.value.senderCommunity.uuid,
        senderGradidoId: linkData.value.senderUser.gradidoID,
        recipientCommunityUuid: linkData.value.recipientCommunity.uuid,
        recipientCommunityName: linkData.value.recipientCommunity.name,
        recipientGradidoId: linkData.value.recipientUser.gradidoID,
        recipientFirstName: linkData.value.recipientUser.firstName,
        code: linkData.value.code,
        amount: linkData.value.amount,
        memo: linkData.value.memo,
        validUntil: linkData.value.validUntil,
        recipientAlias: linkData.value.recipientUser.alias,
      })
      toastSuccess(t('gdd_per_link.disbured', { n: amount }))
      await router.push('/overview')
    } catch (err) {
      toastError(err.message)
      await router.push('/overview')
    }
  } else {
    // console.log('TransactionLink.mutationLink... local transaction or contribution')
    try {
      await redeemMutate({
        code: redeemCode.value,
      })
      toastSuccess(t('gdd_per_link.redeemed', { n: amount }))
      await router.push('/overview')
    } catch (err) {
      toastError(err.message)
      await router.push('/overview')
    }
  }
}
</script>
