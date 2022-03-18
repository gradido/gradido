<template>
  <div class="decayinformation-decay">
    <div class="d-flex">
      <div class="text-center pb-3 gradido-max-width">
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
          {{ (Number(balance) - Number(decay)) | GDD }}
          {{ decay | GDD }} {{ $t('math.equal') }}
          <b>{{ balance | GDD }}</b>
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
      required: true,
    },
    decay: {
      type: String,
      required: true,
    },
  },
}
</script>
