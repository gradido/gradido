<template>
  <div class="overview">
    <BRow>
      <BCol>
        <card-circles />
      </BCol>
      <BCol>
        <card-user-search />
      </BCol>
    </BRow>
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
