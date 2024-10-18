<template>
  <div class="coordinates-display">
    <div class="p-2">
      <BButton class="me-1" size="sm" @click="emit('centerMap', 'USER')"><IBiPinMapFill /></BButton>
      <span>
        {{
          $t('settings.GMS.map.userCoords', {
            lat: userPosition.lat.toFixed(6),
            lng: userPosition.lng.toFixed(6),
          })
        }}
      </span>
    </div>
    <div class="p-2">
      <BButton class="me-1" size="sm" @click="emit('centerMap', 'COMMUNITY')">
        <IBiPinMap />
      </BButton>
      <span>
        {{
          $t('settings.GMS.map.communityCoords', {
            lat: communityPosition.lat.toFixed(6),
            lng: communityPosition.lng.toFixed(6),
          })
        }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { BButton } from 'bootstrap-vue-next'

const emit = defineEmits(['centerMap'])

const props = defineProps({
  userPosition: Object,
  communityPosition: Object,
})
</script>

<style scoped>
.coordinates-display {
  margin-top: 10px;
  font-weight: bold;
}
</style>
