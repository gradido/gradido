<template>
  <div class="overview">
    <community-news />
    <hello-iota :send="false" />
  </div>
</template>

<script>
import CommunityNews from '@/components/Overview/CommunityNews.vue'
import HelloIota from '@/components/HelloIota.vue'

export default {
  name: 'Overview',
  components: {
    CommunityNews,
    HelloIota,
  },
}
</script>
