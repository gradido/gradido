<template>
  <div class="decayinformation-long">
    <div class="d-flex">
      <div style="width: 100%" class="text-center pb-3">
        <b-icon icon="droplet-half" height="12" class="mb-2" />
        <b>{{ $t('decay.calculation_decay') }}</b>
      </div>
    </div>

    <b-row>
      <b-col cols="6" class="text-right">
        <div>{{ $t('decay.last_transaction') }}</div>
      </b-col>
      <b-col cols="6">
        <div>
          <span>
            {{ $d(new Date(decay.start), 'long') }}
            {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
          </span>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="6" class="text-right">
        <div>{{ $t('decay.past_time') }}</div>
      </b-col>
      <b-col cols="6">
        <span v-if="duration">{{ durationText }}</span>
      </b-col>
    </b-row>

    <!-- Decay-->
    <b-row>
      <b-col cols="6" class="text-right">
        <div>{{ $t('decay.decay') }}</div>
      </b-col>
      <b-col cols="6">{{ decay.decay | GDD }}</b-col>
    </b-row>
    <hr class="mt-2 mb-2" />
    <b-row>
      <b-col class="text-center pt-3 pb-2">
        <b>{{ $t('decay.calculation_total') }}</b>
      </b-col>
    </b-row>
    <!-- Type-->
    <b-row>
      <b-col cols="6" class="text-right">{{ $t(`decay.${typeId.toLowerCase()}`) }}</b-col>
      <b-col cols="6">{{ amount | GDD }}</b-col>
    </b-row>
    <!-- Decay-->
    <b-row>
      <b-col cols="6" class="text-right">{{ $t('decay.decay') }}</b-col>
      <b-col cols="6">{{ decay.decay | GDD }}</b-col>
    </b-row>
    <!-- Total-->
    <b-row>
      <b-col cols="6" class="text-right">
        <div>{{ $t('decay.total') }}</div>
      </b-col>
      <b-col cols="6">
        <b>{{ (Number(amount) + Number(decay.decay)) | GDD }}</b>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-Long',
  props: {
    amount: { type: String, default: '0' },
    typeId: { type: String, default: '' },
    decay: {
      type: Object,
    },
  },
  computed: {
    duration() {
      return this.$moment.duration(new Date(this.decay.end) - new Date(this.decay.start))._data
    },
    durationText() {
      const order = ['years', 'months', 'days', 'hours', 'minutes', 'seconds']
      const result = []
      order.forEach((timeSpan) => {
        if (this.duration[timeSpan] > 0) {
          const locale = this.$t(`decay.${timeSpan}`)
          result.push(`${this.duration[timeSpan]} ${locale}`)
        }
      })
      return result.join(', ')
    },
  },
}
</script>
