<template>
  <div class="decayinformation-short">
    <span v-if="decay.decay">{{ decay.decay | amount }}</span>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-Short',
  props: {
    decay: {
      type: Object,
    },
  },
}
</script>
