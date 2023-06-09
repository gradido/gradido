<template>
  <div class="decayinformation-long px-2">
    <div class="word-break mb-5 mt-lg-3">
      <div class="font-weight-bold pb-2">{{ $t('form.memo') }}</div>
      <div class="">{{ memo }}</div>
    </div>
    <div class="mb-3">
      <b-icon icon="droplet-half" class="mr-2" />
      <b>{{ $t('decay.calculation_decay') }}</b>
    </div>
    <b-row>
      <b-col>
        <b-row>
          <b-col cols="12" lg="4" md="4">
            <div>{{ $t('decay.last_transaction') }}</div>
          </b-col>
          <b-col offset="1" offset-md="0" offset-lg="0" class="text-right mr-5">
            <div>
              <span>
                {{ $d(new Date(decay.start), 'long') }}
              </span>
            </div>
          </b-col>
        </b-row>
        <duration-row :decayStart="decay.start" :decayEnd="decay.end" />

        <!-- Previous Balance -->
        <b-row class="mt-2">
          <b-col cols="12" lg="6" md="3">
            <div>{{ $t('decay.old_balance') }}</div>
          </b-col>
          <b-col offset="1" offset-md="0" offset-lg="0" class="text-right mr-5">
            {{ previousBalance | GDD }}
          </b-col>
        </b-row>

        <!-- Decay-->
        <b-row class="mt-0">
          <b-col cols="12" lg="3" md="3">
            <div>{{ $t('decay.decay') }}</div>
          </b-col>
          <b-col offset="1" offset-md="0" offset-lg="0" class="text-right mr-5">
            {{ decay.decay | GDD }}
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <!-- Type-->
    <b-row>
      <b-col>
        <b-row class="mb-2">
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <b-col cols="12" lg="3" md="3">{{ $t(`decay.types.${typeId.toLowerCase()}`) }}</b-col>
          <b-col offset="1" offset-md="0" offset-lg="0" class="text-right mr-5">
            {{ amount | GDD }}
          </b-col>
        </b-row>
        <!-- Total-->
        <b-row class="border-top pt-2">
          <b-col cols="12" lg="3" md="3">
            <div>{{ $t('decay.new_balance') }}</div>
          </b-col>
          <b-col offset="1" offset-md="0" offset-lg="0" class="text-right mr-5">
            <b>{{ balance | GDD }}</b>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import DurationRow from '@/components/TransactionRows/DurationRow'

export default {
  name: 'DecayInformation-Long',
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
