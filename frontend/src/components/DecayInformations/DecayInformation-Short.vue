<template>
  <div class="decayinformation-short">
    <span v-if="decay">{{ decay | GDD }}</span>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-Short',
  props: {
    decay: {
      type: String,
      required: true,
    },
  },
}
</script>
