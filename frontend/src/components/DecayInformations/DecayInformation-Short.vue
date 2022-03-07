<template>
  <div class="decayinformation-short">
    <span>− {{ decay ? $n(Number(decay.decay) * -1, 'decimal') : '' }}</span>
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
