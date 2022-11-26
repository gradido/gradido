<template>
  <div>
    <div class="text-center">
      <b-badge class="position-absolute mt--2 ml--5 px-3" variant="success">
        {{ $t('active') }}
      </b-badge>
    </div>
    <div
      class="community-member bg-white appBoxShadow gradido-border-radius p-4 border border-success"
    >
      <div class="h4">{{ $t('community.communityMember') }}</div>
      <b-row>
        <b-col cols="8">
          <div class="small">{{ $t('community.city') }}</div>
          <div class="small">{{ CONFIG.COMMUNITY_NAME }}</div>
        </b-col>
        <b-col cols="4" class="border-left border-light">
          <b-icon icon="people" class="ml-3 mr-3"></b-icon>
          {{ $t('1234') }}
        </b-col>
      </b-row>
    </div>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'CommunityMember',
  data() {
    return {
      CONFIG,
    }
  },
}
</script>
