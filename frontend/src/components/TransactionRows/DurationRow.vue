<template>
  <div class="duration-row">
    <b-row>
      <b-col cols="12" lg="4" md="4">
        <div>{{ $t('decay.past_time') }}</div>
      </b-col>
      <b-col offset="1" offset-md="0" offset-lg="0">
        <span v-if="duration">{{ durationText }}</span>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'DurationRow',
  props: {
    decayStart: {
      type: String,
      required: true,
    },
    decayEnd: {
      type: String,
      required: true,
    },
  },
  computed: {
    duration() {
      return this.$moment.duration(new Date(this.decayEnd) - new Date(this.decayStart))._data
    },
    durationText() {
      const order = ['years', 'months', 'days', 'hours', 'minutes', 'seconds']
      const result = []
      order.forEach((timeSpan) => {
        if (this.duration[timeSpan] > 0) {
          // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
          const locale = this.$t(`time.${timeSpan}`)
          result.push(`${this.duration[timeSpan]} ${locale}`)
        }
      })
      return result.join(', ')
    },
  },
}
</script>
