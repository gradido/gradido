<template>
  <div
    :link-data="linkData"
    :redeem-code="redeemCode"
    :is-contribution-link="isContributionLink"
    class="redeem-community-selection"
  >
    <BCard bg-variant="muted" text-variant="dark" border-variant="info">
      <h1 v-if="linkData.amount === ''">{{ $t('gdd_per_link.redeemlink-error') }}</h1>
      <h1 v-if="!isContributionLink && linkData.amount !== ''">
        <BCol class="mb-4" cols="12">
          <BRow>
            <BCol>{{ $t('gdd_per_link.recipientCommunity') }}</BCol>
          </BRow>
          <BRow>
            <BCol class="fw-bold">
              <community-switch
                :disabled="isBalanceDisabled"
                :model-value="targetCommunity"
                @update:model-value="setTargetCommunity"
              />
            </BCol>
            <BCol v-if="isForeignCommunitySelected" sm="12" md="6" class="mt-4 mt-lg-0">
              <p>{{ $t('gdd_per_link.switchCommunity') }}</p>
              <BButton variant="gradido" @click="onSwitch">
                {{ $t('gdd_per_link.to-switch') }}
              </BButton>
            </BCol>
          </BRow>
        </BCol>
        <template v-if="linkData.user">
          {{ linkData.user.firstName }}
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
  targetCommunity: {
    type: Object,
    required: true,
    default: () => ({ uuid: '', name: CONFIG.COMMUNITY_NAME }),
  },
})

const emit = defineEmits(['update:targetCommunity'])

const isForeignCommunitySelected = computed(() => {
  if (props.targetCommunity.name !== CONFIG.COMMUNITY_NAME) {
    return true
  }
  return false
})

function setTargetCommunity(community) {
  console.log('RedeemCommunitySelection.setTargetCommunity...community=', community)
  emit('update:targetCommunity', community)
}

const { mutate: createRedeemJwt } = useMutation(createRedeemJwtMutation)

async function onSwitch(event) {
  event.preventDefault() // Prevent the default navigation
  console.log('RedeemCommunitySelection.onSwitch... props=', props)
  if (isForeignCommunitySelected.value) {
    console.log('RedeemCommunitySelection.onSwitch vor createRedeemJwt params:', {
      gradidoID: props.linkData.user.gradidoID,
      communityUuid: props.targetCommunity.uuid,
      communityName: props.targetCommunity.name,
      code: props.redeemCode,
      amount: props.linkData.amount,
      memo: props.linkData.memo,
      firstName: props.linkData.user.firstName,
      alias: props.linkData.user.alias,
    })
    try {
      const { data } = await createRedeemJwt({
        gradidoID: props.linkData.user.gradidoID,
        communityUuid: props.targetCommunity.uuid,
        communityName: props.targetCommunity.name,
        code: props.redeemCode,
        amount: props.linkData.amount,
        memo: props.linkData.memo,
        firstName: props.linkData.user.firstName,
        alias: props.linkData.user.alias,
      })
      console.log('RedeemCommunitySelection.onSwitch... response=', data)
      if (!data?.createRedeemJwt) {
        throw new Error('Failed to get redeem token')
      }
      const targetUrl = props.targetCommunity.url.replace(/\/api\/?$/, '')
      window.location.href = targetUrl + '/redeem/' + data.createRedeemJwt
    } catch (error) {
      console.error('RedeemCommunitySelection.onSwitch error:', error)
      throw error
    }
  }
}
</script>
