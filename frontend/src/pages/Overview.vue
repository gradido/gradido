<template>
  <div class="overview">
    <BCol>
      <BRow>
        <card-circles />
      </BRow>
      <BRow>
        <card-user-search />
      </BRow>
    </BCol>
  </div>
</template>
<script>
// import CommunityNews from '@/components/Overview/CommunityNews'
import CardCircles from '@/components/Overview/CardCircles'
import CardUserSearch from '@/components/Overview/CardUserSearch'
export default {
  name: 'Overview',
  components: {
    CardCircles,
    CardUserSearch,
  },
}
</script>
