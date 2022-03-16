<template>
  <div class="decayinformation-short">
    <span v-if="decay.decay">{{ decay.decay | GDD }}</span>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-Short',
  props: {
    decay: {
      type: Object,
      required: true,
    },
  },
}
</script>
