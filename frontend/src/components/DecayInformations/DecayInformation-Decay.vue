<template>
  <div class="decayinformation-decay">
    <div class="d-flex">
      <div style="width: 100%" class="text-center pb-3">
        <b-icon icon="droplet-half" height="12" class="mb-2" />
        <b>{{ $t('decay.calculation_decay') }}</b>
      </div>
    </div>

    <b-row>
      <b-col cols="6" class="text-right">
        <div>{{ $t('decay.decay') }}</div>
      </b-col>
      <b-col cols="6">
        <div>
          {{ $n(Number(balance) - Number(decay.decay), 'decimal') }}
          GDD - {{ $n(Number(decay.decay) * -1, 'decimal') }} GDD =
          <b>{{ $n(Number(balance), 'decimal') }} GDD</b>
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-Decay',
  props: {
    balance: {
      type: String,
    },
    decay: {
      type: Object,
    },
  },
}
</script>
