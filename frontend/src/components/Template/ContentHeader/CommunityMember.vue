<template>
  <div>
    <div class="text-center">
      <b-badge class="position-absolute mt--2 ml--5 px-3" variant="success">aktiv</b-badge>
    </div>
    <div
      class="community-member bg-white appBoxShadow gradido-border-radius p-4 border border-success"
    >
      <div>CommunityMember components</div>
      <div>{{ CONFIG.COMMUNITY_NAME }}</div>
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
