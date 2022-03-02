<template>
  <div class="decayinformation-short">
    <span>
      {{ decay ? $n(decay.decay, 'decimal') : '' }}
    </span>
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
