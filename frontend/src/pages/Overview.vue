<template>
  <div class="overview">
    <BCol>
      <div v-if="isHumhubActive">
        <BRow>
          <card-circles />
        </BRow>
      </div>
      <div v-if="isGmsActive">
        <BRow>
          <card-user-search />
        </BRow>
      </div>
    </BCol>
  </div>
</template>
<script>
// import CommunityNews from '@/components/Overview/CommunityNews'
import CardCircles from '@/components/Overview/CardCircles'
import CardUserSearch from '@/components/Overview/CardUserSearch'
import CONFIG from '@/config'

export default {
  name: 'Overview',
  components: {
    CardCircles,
    CardUserSearch,
  },
  computed: {
    isGmsActive() {
      console.log('isGmsActive=', CONFIG.GMS_ACTIVE)
      return CONFIG.GMS_ACTIVE === true
    },
    isHumhubActive() {
      console.log('isHumhubActive=', CONFIG.HUMHUB_ACTIVE)
      return CONFIG.HUMHUB_ACTIVE === true
    },
  }
}
</script>
