<template>
  <div class="overview">
    <BCol>
      <!-- Always, and first: showing Gradido to somebody needs no service switched on, and the
           two tiles below hang on HumHub and the old GMS search, which are on their way out. -->
      <BRow>
        <show-friends-tile />
      </BRow>
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
<script setup>
import { computed } from 'vue'
// import CommunityNews from '@/components/Overview/CommunityNews'
import CardCircles from '@/components/Overview/CardCircles'
import CardUserSearch from '@/components/Overview/CardUserSearch'
import ShowFriendsTile from '@/components/Overview/ShowFriendsTile'
import CONFIG from '@/config'

const isGmsActive = computed(() => CONFIG.GMS_LEGACY_ACTIVE === true)
const isHumhubActive = computed(() => CONFIG.HUMHUB_ACTIVE === true)
</script>
