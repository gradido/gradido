<template>
  <div class="decayinformation-short">
    <span v-if="decay">{{ $filters.GDD(decay) }}</span>
  </div>
</template>
<script>
export default {
  name: 'DecayInformationShort',
  props: {
    decay: {
      type: String,
      required: true,
    },
  },
}
</script>
