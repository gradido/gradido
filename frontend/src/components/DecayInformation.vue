<template>
  <div></div>
</template>
<script>
export default {
  name: 'DecayInformation',
  props: {
    decay: {
      balance: '',
      decay_duration: '',
      decay_start: 0,
      decay_end: 0,
    },
  },
  mounted() {
    console.log(this.decay)
  },
}
</script>
