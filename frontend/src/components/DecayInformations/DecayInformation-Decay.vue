<template>
  <div class="decayinformation-decay">
    <b-row>
      <b-col>
        <div class="text-center pb-3">
          <b-icon icon="droplet-half" class="mr-2" />
          <b>{{ $t('decay.calculation_decay') }}</b>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col offset="1" cols="11">
        <b-row>
          <b-col cols="5" class="text-right">
            <div>{{ $t('decay.decay') }}</div>
          </b-col>
          <b-col cols="7">
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
