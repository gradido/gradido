<template>
  <div class="decayinformation-decay">
    <div class="mb-3">
      <b-icon icon="droplet-half" class="mr-2" />
      <b>{{ $t('decay.calculation_decay') }}</b>
    </div>
    <b-row>
      <b-col>
        <b-row>
          <b-col cols="12" lg="4" md="4">
            <div>{{ $t('decay.decay') }}</div>
          </b-col>
          <b-col offset="1" offset-md="0" offset-lg="0">
            <div>
              {{ previousBookedBalance | GDD }}
              {{ decay === '0' ? $t('math.minus') : '' }}
              {{ decay | GDD }} {{ $t('math.equal') }}
              <b>{{ balance | GDD }}</b>
            </div>
          </b-col>
        </b-row>
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
      required: true,
    },
    decay: {
      type: String,
      required: true,
    },
    previousBookedBalance: {
      type: String,
      required: true,
    },
  },
}
</script>
