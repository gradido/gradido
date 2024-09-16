<template>
  <div class="decayinformation-startblock">
    <BRow>
      <BCol cols="12">
        <div class="text-center pb-3">
          <IBiDropletHalf class="me-2" />
          <b>{{ $t('decay.Starting_block_decay') }}</b>
        </div>
      </BCol>
    </BRow>
    <BRow>
      <BCol offset="1" cols="11">
        <BRow>
          <BCol cols="5">
            <div class="text-end">
              <div>{{ $t('decay.decay_introduced') }}</div>
            </div>
          </BCol>
          <BCol cols="5">
            <div>
              <span v-if="decay.start">
                {{ $d(new Date(decay.start), 'long') }}
              </span>
            </div>
          </BCol>
        </BRow>
        <duration-row :decay-start="decay.start" :decay-end="decay.end" />

        <!-- Decay-->
        <BRow>
          <BCol cols="5" class="text-end">{{ $t('decay.decay') }}</BCol>
          <BCol cols="7">{{ $filters.GDD(decay.decay) }}</BCol>
        </BRow>
      </BCol>
    </BRow>
    <hr class="mt-3 mb-3" />

    <BRow>
      <BCol class="text-center pb-3">
        <b>{{ $t('decay.calculation_total') }}</b>
      </BCol>
    </BRow>

    <!-- Type-->
    <BRow>
      <BCol offset="1" cols="11">
        <BRow>
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <BCol cols="5" class="text-end">{{ $t(`decay.types.${typeId.toLowerCase()}`) }}</BCol>
          <BCol cols="7">{{ $filters.GDD(amount) }}</BCol>
        </BRow>
        <!-- Decay-->
        <BRow>
          <BCol cols="5" class="text-end">{{ $t('decay.decay') }}</BCol>
          <BCol cols="7">{{ $filters.GDD(decay.decay) }}</BCol>
        </BRow>
        <!-- Total-->
        <BRow>
          <BCol cols="5" class="text-end">{{ $t('decay.total') }}</BCol>
          <BCol cols="7">
            <b>{{ $filters.GDD(Number(amount) + Number(decay.decay)) }}</b>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
  </div>
</template>
<script>
import DurationRow from '@/components/TransactionRows/DurationRow'

export default {
  name: 'DecayInformationStartBlock',
  components: {
    DurationRow,
  },
  props: {
    balanceDate: { type: String },
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
