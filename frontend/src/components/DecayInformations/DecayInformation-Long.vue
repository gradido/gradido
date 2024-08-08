<template>
  <div class="decayinformation-long px-1">
    <div class="word-break mb-5 mt-lg-3">
      <div class="font-weight-bold pb-2">{{ $t('form.memo') }}</div>
      <div class="">{{ memo }}</div>
    </div>
    <div class="mb-3">
      <IBiDropletHalf class="mr-2" />
      <b>{{ $t('decay.calculation_decay') }}</b>
    </div>
    <BRow>
      <BCol>
        <BRow>
          <BCol cols="6" lg="4" md="6" sm="6">
            <div>{{ $t('decay.last_transaction') }}</div>
          </BCol>
          <BCol offset="0" class="text-right mr-0">
            <div>
              <span>
                {{ $d(new Date(decay.start), 'long') }}
              </span>
            </div>
          </BCol>
        </BRow>
        <duration-row :decay-start="decay.start" :decay-end="decay.end" />

        <!-- Previous Balance -->
        <BRow class="mt-2">
          <BCol cols="6" lg="4" md="6" sm="6">
            <div>{{ $t('decay.old_balance') }}</div>
          </BCol>
          <BCol offset="0" class="text-right mr-0">
            {{ $filters.GDD(previousBalance) }}
          </BCol>
        </BRow>

        <!-- Decay-->
        <BRow class="mt-0">
          <BCol cols="6" lg="3" md="6" sm="6">
            <div>{{ $t('decay.decay') }}</div>
          </BCol>
          <BCol offset="0" class="text-right mr-0">
            {{ $filters.GDD(decay.decay) }}
          </BCol>
        </BRow>
      </BCol>
    </BRow>
    <!-- Type-->
    <BRow>
      <BCol>
        <BRow class="mb-2">
          <!-- eslint-disable @intlify/vue-i18n/no-dynamic-keys-->
          <BCol cols="6" lg="3" md="6" sm="6">
            {{ $t(`decay.types.${typeId.toLowerCase()}`) }}
          </BCol>
          <!-- eslint-enable @intlify/vue-i18n/no-dynamic-keys-->
          <BCol offset="0" class="text-right mr-0">
            {{ $filters.GDD(amount) }}
          </BCol>
        </BRow>
        <!-- Total-->
        <BRow class="border-top pt-2">
          <BCol cols="6" lg="3" md="6" sm="6">
            <div>{{ $t('decay.new_balance') }}</div>
          </BCol>
          <BCol offset="0" class="text-right mr-0">
            <b>{{ $filters.GDD(balance) }}</b>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
  </div>
</template>
<script>
import DurationRow from '@/components/TransactionRows/DurationRow'

export default {
  name: 'DecayInformationLong',
  components: {
    DurationRow,
  },
  props: {
    balance: { type: String, default: '0' },
    previousBalance: { type: String, default: '0' },
    amount: { type: String, default: '0' },
    typeId: { type: String, default: '' },
    memo: { type: String, default: '' },
    decay: {
      type: Object,
    },
  },
}
</script>
