<template>
  <div
    :link-data="linkData"
    :redeem-code="redeemCode"
    :is-contribution-link="isContributionLink"
    :is-redeem-jwt-link="isRedeemJwtLink"
    class="redeem-community-selection"
  >
    <BRow bg-variant="muted" text-variant="dark">
      <h1 v-if="linkData.amount === ''">{{ $t('gdd_per_link.redeemlink-error') }}</h1>
      <h1 v-if="!isContributionLink && linkData.amount !== ''">
        <template v-if="linkData.senderUser">
          <!-- The sender, as the wallet names a member (NU-018). -->
          {{ memberAlias(linkData.senderUser.alias, linkData.senderUser.gradidoID) }}
          {{ $t('transaction-link.send_you') }} {{ linkData.amount }} {{ $t('GDD-long') }}
        </template>
      </h1>
      <BRow>
        <BCol class="mb-4" cols="12">
          <b>{{ linkData.memo }}</b>
        </BCol>
      </BRow>
      <BRow v-if="!isContributionLink && linkData.amount !== ''">
        <BCol class="mb-4" cols="12">
          <BRow>
            <BCol v-if="!isRedeemJwtLink" class="fw-bold">
              <div v-if="isForeignCommunitySelected">
                {{ $t('gdd_per_link.recipientCommunityRedirection') }}
              </div>
              <div v-else>
                {{ $t('gdd_per_link.recipientCommunitySelection') }}
              </div>
            </BCol>
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
              <BCol v-if="isForeignCommunitySelected" sm="12" md="6" class="mt-4 mt-lg-0">
                <BButton variant="gradido" @click="onSwitch">
                  {{ $t('gdd_per_link.to-switch') }}
                </BButton>
              </BCol>
            </BRow>
          </h3>
        </BCol>
      </BRow>
    </BRow>
  </div>
</template>
<script setup>
import { memberAlias } from '@/utils/gradidoAddress'
import { useRedeemCommunity } from '@/composables/useRedeemCommunity'

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

const emit = defineEmits(['update:recipientCommunity'])

// Which community the link was made in, which one is chosen, and the way there with a token
// for the link: shared with the thank-you view (RedeemThanks), which offers the same choice
// behind "I already have an account".
const { currentRecipientCommunity, isForeignCommunitySelected, forwardToRecipientCommunity } =
  useRedeemCommunity({
    linkData: () => props.linkData,
    redeemCode: () => props.redeemCode,
    recipientCommunity: () => props.recipientCommunity,
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

async function onSwitch(event) {
  event.preventDefault() // Prevent the default navigation
  await forwardToRecipientCommunity()
}
</script>
