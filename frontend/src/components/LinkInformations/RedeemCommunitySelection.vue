<template>
  <div
    :link-data="linkData"
    :redeem-code="redeemCode"
    :is-contribution-link="isContributionLink"
    :is-disbursement-link="isDisbursementLink"
    class="redeem-community-selection"
  >
    <BCard bg-variant="muted" text-variant="dark" border-variant="info">
      <h1 v-if="linkData.amount === ''">{{ $t('gdd_per_link.redeemlink-error') }}</h1>
      <h1 v-if="!isContributionLink && linkData.amount !== ''">
        <BCol class="mb-4" cols="12">
          <BRow>
            <BCol>{{ $t('gdd_per_link.recipientCommunity') }}</BCol>
          </BRow>
          <h3>
            <BRow v-if="!isDisbursementLink">
              <BCol class="fw-bold">
                <community-switch
                  :disabled="isBalanceDisabled"
                  :model-value="currentReceiverCommunity"
                  @update:model-value="setReceiverCommunity"
                />
              </BCol>
              <BCol v-if="isForeignCommunitySelected" sm="12" md="6" class="mt-4 mt-lg-0">
                <p>{{ $t('gdd_per_link.switchCommunity') }}</p>
                <BButton variant="gradido" @click="onSwitch">
                  {{ $t('gdd_per_link.to-switch') }}
                </BButton>
              </BCol>
            </BRow>
          </h3>
        </BCol>
        <template v-if="linkData.senderUser">
          {{ linkData.senderUser.firstName }}
          {{ $t('transaction-link.send_you') }} {{ $filters.GDD(linkData.amount) }}
        </template>
      </h1>
      <b>{{ linkData.memo }}</b>
    </BCard>
  </div>
</template>
<script setup>
import CONFIG from '@/config'
import { computed } from 'vue'
import { createRedeemJwtMutation } from '@/graphql/mutations'
import { useMutation } from '@vue/apollo-composable'

const props = defineProps({
  linkData: { type: Object, required: true },
  redeemCode: { type: String, required: true },
  isContributionLink: { type: Boolean, default: false },
  isDisbursementLink: { type: Boolean, default: false },
  receiverCommunity: {
    type: Object,
    required: false,
  },
})

const senderCommunity = computed(() => extractHomeCommunityFromLinkData(props.linkData))
const currentReceiverCommunity = computed(
  () =>
    props.receiverCommunity || {
      uuid: senderCommunity.value.uuid,
      name: senderCommunity.value.name,
      url: senderCommunity.value.url,
      foreign: senderCommunity.value.foreign,
    },
)

const emit = defineEmits(['update:receiverCommunity'])

const isForeignCommunitySelected = computed(() => {
  console.log(
    'RedeemCommunitySelection.isForeignCommunitySelected...receiverCommunity=',
    currentReceiverCommunity.value,
  )
  return currentReceiverCommunity.value.foreign
})

function setReceiverCommunity(community) {
  console.log('RedeemCommunitySelection.setReceiverCommunity...community=', community)
  emit('update:receiverCommunity', {
    uuid: community.uuid,
    name: community.name,
    url: community.url,
    foreign: community.foreign,
  })
}

function extractHomeCommunityFromLinkData(linkData) {
  console.log('RedeemCommunitySelection.extractHomeCommunityFromLinkData...linkData=', linkData)
  if (linkData.communities.length === 0) {
    return {
      uuid: '',
      name: CONFIG.COMMUNITY_NAME,
      url: CONFIG.COMMUNITY_URL,
      foreign: false,
    }
  }
  const communities = linkData.communities
  console.log(
    'RedeemCommunitySelection.extractHomeCommunityFromLinkData...communities=',
    communities,
  )
  const homeCommunity = communities.find((c) => c.foreign === false)
  console.log(
    'RedeemCommunitySelection.extractHomeCommunityFromLinkData...homeCommunity=',
    homeCommunity,
  )
  return {
    uuid: homeCommunity.uuid,
    name: homeCommunity.name,
    url: homeCommunity.url,
    foreign: homeCommunity.foreign,
  }
}

const { mutate: createRedeemJwt } = useMutation(createRedeemJwtMutation)

async function onSwitch(event) {
  event.preventDefault() // Prevent the default navigation
  console.log('RedeemCommunitySelection.onSwitch... props=', props)
  if (isForeignCommunitySelected.value) {
    console.log('RedeemCommunitySelection.onSwitch vor createRedeemJwt params:', {
      gradidoID: props.linkData.senderUser.gradidoID,
      senderCommunityUuid: senderCommunity.value.uuid,
      senderCommunityName: senderCommunity.value.name,
      receiverCommunityUuid: currentReceiverCommunity.value.uuid,
      code: props.redeemCode,
      amount: props.linkData.amount,
      memo: props.linkData.memo,
      firstName: props.linkData.senderUser.firstName,
      alias: props.linkData.senderUser.alias,
    })
    try {
      const { data } = await createRedeemJwt({
        gradidoID: props.linkData.senderUser.gradidoID,
        senderCommunityUuid: senderCommunity.value.uuid,
        senderCommunityName: senderCommunity.value.name,
        receiverCommunityUuid: currentReceiverCommunity.value.uuid,
        code: props.redeemCode,
        amount: props.linkData.amount,
        memo: props.linkData.memo,
        firstName: props.linkData.senderUser.firstName,
        alias: props.linkData.senderUser.alias,
      })
      console.log('RedeemCommunitySelection.onSwitch... response=', data)
      if (!data?.createRedeemJwt) {
        throw new Error('Failed to get redeem token')
      }
      const targetUrl = currentReceiverCommunity.value.url.replace(/\/api\/?$/, '')
      window.location.href = targetUrl + '/redeem/' + data.createRedeemJwt
    } catch (error) {
      console.error('RedeemCommunitySelection.onSwitch error:', error)
      throw error
    }
  }
}
</script>
