<template>
  <div class="decayinformation-decay">
    <div class="mb-3">
      <IBiDropletHalf class="me-2" />
      <b>{{ $t('decay.calculation_decay') }}</b>
    </div>
    <BRow>
      <BCol>
        <BRow>
          <BCol cols="12" lg="4" md="4">
            <div>{{ $t('decay.decay') }}</div>
          </BCol>
          <BCol offset="1" offset-md="0" offset-lg="0">
            <div>
              {{ $filters.GDD(previousBalance) }}
              {{ decay === '0' ? $t('math.minus') : '' }}
              {{ $filters.GDD(decay) }} {{ $t('math.equal') }}
              <b>{{ $filters.GDD(balance) }}</b>
            </div>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
  </div>
</template>
<script>
export default {
  name: 'DecayInformationDecay',
  props: {
    balance: {
      type: String,
      required: true,
    },
    decay: {
      type: String,
      required: true,
    },
    previousBalance: {
      type: String,
      required: true,
    },
  },
}
</script>
