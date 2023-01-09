<template>
  <div class="overview">
    <community-news />
  </div>
</template>
<script>
import CommunityNews from '@/components/Overview/CommunityNews.vue'

export default {
  name: 'Overview',
  components: {
    CommunityNews,
  },
}
</script>
