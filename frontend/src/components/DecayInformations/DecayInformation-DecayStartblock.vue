<template>
  <div class="decayinformation-startblock">
    <b-row>
      <b-col cols="12" class="text-center">
        <div>
          <div class="display-4">{{ $t('decay.Starting_block_decay') }}</div>
          <div>{{ $t('decay.decay_introduced') }}</div>
        </div>
        <div>
          <span v-if="decay.start">
            {{ $d(new Date(decay.start), 'long') }}
          </span>
        </div>
      </b-col>
    </b-row>

    <!-- Decay-->
    <b-row>
      <b-col cols="6" class="text-right">{{ $t('decay.decay') }}</b-col>
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
      <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
      <b-col cols="6" class="text-right">{{ $t(`decay.types.${typeId.toLowerCase()}`) }}</b-col>
      <b-col cols="6">{{ amount | GDD }}</b-col>
    </b-row>
    <!-- Decay-->
    <b-row>
      <b-col cols="6" class="text-right">{{ $t('decay.decay') }}</b-col>
      <b-col cols="6">{{ decay.decay | GDD }}</b-col>
    </b-row>
    <!-- Total-->
    <b-row>
      <b-col cols="6" class="text-right">{{ $t('decay.total') }}</b-col>
      <b-col cols="6">
        <b>{{ (Number(amount) + Number(decay.decay)) | GDD }}</b>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-StartBlock',
  props: {
    balanceDate: { type: String },
    decayStartBlock: { type: Date },
    amount: {
      type: String,
    },
    decay: {
      type: Object,
    },
    typeId: {
      type: String,
    },
  },
}
</script>
