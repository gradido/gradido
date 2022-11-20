<template>
  <div class="community-member">
    <div>CommunityMember components</div>
    <div>{{ CONFIG.COMMUNITY_NAME }}</div>
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
