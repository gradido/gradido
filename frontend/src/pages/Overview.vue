<template>
  <div class="overview">
    <BCol>
      <!-- Above everything, for as long as it applies: the member is not on the map yet, and
           this is where they land after the first creation. It decides for itself whether it
           shows, and it reads the store, so it is there with the first paint or not at all --
           nothing below it moves later. -->
      <BRow>
        <map-invitation-tile />
      </BRow>
      <!-- Always: showing Gradido to somebody needs no service switched on, and the two tiles
           below hang on HumHub and the old GMS search, which are on their way out. -->
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
import MapInvitationTile from '@/components/Overview/MapInvitationTile'
import ShowFriendsTile from '@/components/Overview/ShowFriendsTile'
import CONFIG from '@/config'

const isGmsActive = computed(() => CONFIG.GMS_LEGACY_ACTIVE === true)
const isHumhubActive = computed(() => CONFIG.HUMHUB_ACTIVE === true)
</script>
