<template>
  <div class="community-member mt-3 mt-lg-0 position-relative">
    <div class="text-center bg-gradido-gradient">
      <BBadge class="position-absolute mt--2 ms--5 px-3 bg-gradido-gradient">
        {{ $t('member') }}
      </BBadge>
    </div>
    <div
      class="community-member bg-white app-box-shadow gradido-border-radius p-4 border border-success"
    >
      <BRow>
        <BCol cols="9">
          <div class="h4">{{ $t('community.communityMember') }}</div>
          <div>{{ CONFIG.COMMUNITY_NAME }}</div>
        </BCol>
        <BCol cols="3" align-self="end" class="border-start border-dark">
          <IBiPeople />
          {{ totalUsers }}
        </BCol>
      </BRow>
    </div>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'CommunityMember',
  props: {
    totalUsers: { type: Number, required: true },
  },
  data() {
    return {
      CONFIG,
    }
  },
}
</script>

<style lang="scss" scoped>
span.bg-gradido-gradient.text-bg-secondary {
  color: $white !important;
}
</style>
