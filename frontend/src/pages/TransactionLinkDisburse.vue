<template>
  <div class="show-transaction-link-informations">
    <div class="mt-4">
      <transaction-link-item :type="itemTypeExt">
        <template #LOGGED_OUT>
          <redeem-logged-out :link-data="linkData" :is-contribution-link="isContributionLink" />
        </template>

        <template #SELF_CREATOR>
          <redeem-self-creator :link-data="linkData" />
        </template>

        <template #VALID>
          <redeem-valid
            :link-data="linkData"
            :is-contribution-link="isContributionLink"
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
import RedeemSelfCreator from '@/components/LinkInformations/RedeemSelfCreator'
import RedeemValid from '@/components/LinkInformations/RedeemValid'
import RedeemedTextBox from '@/components/LinkInformations/RedeemedTextBox'
import { useAppToast } from '@/composables/useToast'
import { queryTransactionLink } from '@/graphql/queries'
import { redeemTransactionLink } from '@/graphql/mutations'
import { useI18n } from 'vue-i18n'

const { toastError, toastSuccess } = useAppToast()
const router = useRouter()
const { params } = useRoute()
const store = useStore()
const { d, t } = useI18n()

const linkData = ref({
  __typename: 'TransactionLink',
  amount: '',
  memo: '',
  user: {
    firstName: '',
  },
  deletedAt: null,
  validLink: false,
})

const redeemedBoxText = ref('')

const { result, onResult, loading, error, onError } = useQuery(queryTransactionLink, {
  code: params.code,
})

const {
  mutate: redeemMutate,
  loading: redeemLoading,
  error: redeemError,
} = useMutation(redeemTransactionLink)

const isContributionLink = computed(() => {
  return params.code?.search(/^CL-/) === 0
})

const tokenExpiresInSeconds = computed(() => {
  const remainingSecs = Math.floor(
    (new Date(store.state.tokenTime * 1000).getTime() - new Date().getTime()) / 1000,
  )
  return remainingSecs <= 0 ? 0 : remainingSecs
})

const validLink = computed(() => {
  return new Date(linkData.value.validUntil) > new Date()
})

const itemType = computed(() => {
  if (linkData.value.deletedAt) return 'TEXT_DELETED'
  if (new Date(linkData.value.validUntil) < new Date()) return 'TEXT_EXPIRED'
  if (linkData.value.redeemedAt) return 'TEXT_REDEEMED'

  if (store.state.token && store.state.tokenTime) {
    if (tokenExpiresInSeconds.value < 5) return 'LOGGED_OUT'
    if (linkData.value.user && store.state.gradidoID === linkData.value.user.gradidoID)
      return 'SELF_CREATOR'
    if (!linkData.value.redeemedAt && !linkData.value.deletedAt) return 'VALID'
  }

  return 'LOGGED_OUT'
})

const itemTypeExt = computed(() => {
  if (itemType.value.startsWith('TEXT')) {
    return 'TEXT'
  }
  return itemType.value
})

watch(itemType, (newItemType) => {
  updateRedeemedBoxText(newItemType)
})

function updateRedeemedBoxText(type) {
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
}

const emit = defineEmits(['set-mobile-start'])

onMounted(() => {
  emit('set-mobile-start', false)
})

onResult(() => {
  if (!result || !result.value) return
  setTransactionLinkInformation()
})

onError(() => {
  toastError(t('gdd_per_link.redeemlink-error'))
})

function setTransactionLinkInformation() {
  const { queryTransactionLink } = result.value
  if (queryTransactionLink) {
    linkData.value = queryTransactionLink
    if (linkData.value.__typename === 'ContributionLink' && store.state.token) {
      mutationLink(linkData.value.amount)
    }
  }
}

async function mutationLink(amount) {
  try {
    await redeemMutate({
      code: params.code,
    })
    toastSuccess(t('gdd_per_link.redeemed', { n: amount }))
    await router.push('/overview')
  } catch (err) {
    toastError(err.message)
    await router.push('/overview')
  }
}
</script>
