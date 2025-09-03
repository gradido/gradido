<template>
  <div
    :link-data="linkData"
    :redeem-code="redeemCode"
    :is-contribution-link="isContributionLink"
    :is-redeem-jwt-link="isRedeemJwtLink"
    class="redeem-community-selection"
  >
    <BCard bg-variant="muted" text-variant="dark" border-variant="info">
      <h1 v-if="linkData.amount === ''">{{ $t('gdd_per_link.redeemlink-error') }}</h1>
      <h1 v-if="!isContributionLink && linkData.amount !== ''">
        <BCol class="mb-4" cols="12">
          <BRow>
            <BCol v-if="!isRedeemJwtLink">
              {{ $t('gdd_per_link.recipientCommunitySelection') }}
            </BCol>
            <BCol v-else>{{ $t('gdd_per_link.recipientCommunityFix') }}</BCol>
          </BRow>
          <h3>
            <BRow>
              <BCol v-if="!isRedeemJwtLink" class="fw-bold">
                <community-switch
                  :disabled="isRedeemJwtLink"
                  :model-value="currentRecipientCommunity"
                  @update:model-value="setRecipientCommunity"
                />
              </BCol>
              <BCol v-else>
                {{ currentRecipientCommunity.name }}
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
  isRedeemJwtLink: { type: Boolean, default: false },
  recipientCommunity: {
    type: Object,
    required: false,
  },
})

const senderCommunity = computed(() => extractHomeCommunityFromLinkData(props.linkData))
const currentRecipientCommunity = computed(
  () =>
    props.recipientCommunity || {
      uuid: senderCommunity.value.uuid,
      name: senderCommunity.value.name,
      url: senderCommunity.value.url,
      foreign: senderCommunity.value.foreign,
    },
)

const emit = defineEmits(['update:recipientCommunity'])

const isForeignCommunitySelected = computed(() => {
  // console.log(
  //   'RedeemCommunitySelection.isForeignCommunitySelected...recipientCommunity=',
  //   currentRecipientCommunity.value,
  // )
  return currentRecipientCommunity.value.foreign
})

function setRecipientCommunity(community) {
  // console.log('RedeemCommunitySelection.setRecipientCommunity...community=', community)
  emit('update:recipientCommunity', {
    uuid: community.uuid,
    name: community.name,
    url: community.url,
    foreign: community.foreign,
  })
}

function extractHomeCommunityFromLinkData(linkData) {
  // console.log(
  //   'RedeemCommunitySelection.extractHomeCommunityFromLinkData... props.linkData=',
  //   props.linkData,
  // )
  // console.log('RedeemCommunitySelection.extractHomeCommunityFromLinkData...linkData=', linkData)
  // console.log(
  //   'RedeemCommunitySelection.extractHomeCommunityFromLinkData...communities=',
  //   linkData.communities,
  // )
  // console.log(
  //   'RedeemCommunitySelection.extractHomeCommunityFromLinkData...linkData.value=',
  //   linkData.value,
  // )

  if (linkData.communities?.length === 0) {
    return {
      uuid: '',
      name: CONFIG.COMMUNITY_NAME,
      url: CONFIG.COMMUNITY_URL,
      foreign: false,
    }
  }
  const communities = linkData.communities
  // console.log(
  //   'RedeemCommunitySelection.extractHomeCommunityFromLinkData...communities=',
  //   communities,
  // )
  const homeCommunity = communities?.find((c) => c.foreign === false)
  // console.log(
  //   'RedeemCommunitySelection.extractHomeCommunityFromLinkData...homeCommunity=',
  //   homeCommunity,
  // )
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
  // console.log('RedeemCommunitySelection.onSwitch... props=', props)
  if (isForeignCommunitySelected.value) {
    // console.log('RedeemCommunitySelection.onSwitch vor createRedeemJwt params:', {
    //   gradidoId: props.linkData.senderUser?.gradidoID,
    //   senderCommunityUuid: senderCommunity.value.uuid,
    //   senderCommunityName: senderCommunity.value.name,
    //   recipientCommunityUuid: currentRecipientCommunity.value.uuid,
    //   code: props.redeemCode,
    //   amount: props.linkData.amount,
    //   memo: props.linkData.memo,
    //   firstName: props.linkData.senderUser?.firstName,
    //   alias: props.linkData.senderUser?.alias,
    //   validUntil: props.linkData.validUntil,
    // })
    // eslint-disable-next-line no-useless-catch
    try {
      const { data } = await createRedeemJwt({
        gradidoId: props.linkData.senderUser?.gradidoID,
        senderCommunityUuid: senderCommunity.value.uuid,
        senderCommunityName: senderCommunity.value.name,
        recipientCommunityUuid: currentRecipientCommunity.value.uuid,
        code: props.redeemCode,
        amount: props.linkData.amount,
        memo: props.linkData.memo,
        firstName: props.linkData.senderUser?.firstName,
        alias: props.linkData.senderUser?.alias,
        validUntil: props.linkData.validUntil,
      })
      console.log('RedeemCommunitySelection.onSwitch... response=', data)
      if (!data?.createRedeemJwt) {
        throw new Error('Failed to get redeem token')
      }
      const targetUrl = currentRecipientCommunity.value.url.replace(/\/api\/?$/, '')
      console.log('RedeemCommunitySelection.onSwitch... targetUrl=', targetUrl)
      console.log(
        'RedeemCommunitySelection.onSwitch... data.createRedeemJwt=',
        data.createRedeemJwt,
      )
      window.location.href = targetUrl + '/redeem/' + data.createRedeemJwt
    } catch (error) {
      console.error('RedeemCommunitySelection.onSwitch error:', error)
      throw error
    }
  }
}
</script>
