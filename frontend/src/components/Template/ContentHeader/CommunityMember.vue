<template>
  <div>
    <div class="text-center">
      <b-badge class="position-absolute mt--2 ml--5 px-3" variant="success">
        {{ $t('member') }}
      </b-badge>
    </div>
    <div
      class="community-member bg-white appBoxShadow gradido-border-radius p-4 border border-success"
    >
      <b-row>
        <b-col cols="8">
          <div class="h4">{{ $t('community.communityMember') }}</div>
          <div>{{ CONFIG.COMMUNITY_NAME }}</div>
        </b-col>
        <b-col cols="4" class="border-left border-light p-3">
          <b-icon icon="people"></b-icon>
          {{ totalUsers }}
        </b-col>
      </b-row>
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
