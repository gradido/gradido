<template>
  <div class="duration-row">
    <b-row>
      <b-col cols="5" class="text-right">
        <div>{{ $t('decay.past_time') }}</div>
      </b-col>
      <b-col cols="7">
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
