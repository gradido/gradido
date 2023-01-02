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
    <!-- <b-row>
      <b-col offset="">
        <div class="pb-3">
          <b-icon icon="droplet-half" class="mr-2" />
          <b>{{ $t('decay.calculation_decay') }}</b>
        </div>
      </b-col>
    </b-row> -->
    <b-row>
      <b-col>
        <b-row>
          <b-col cols="12" lg="4" md="4">
            <div>{{ $t('decay.last_transaction') }}</div>
          </b-col>
          <b-col offset="1" offset-md="0" offset-lg="0">
            <div>
              <span>
                {{ $d(new Date(decay.start), 'long') }}
              </span>
            </div>
          </b-col>
        </b-row>
        <duration-row :decayStart="decay.start" :decayEnd="decay.end" />

        <!-- Decay-->
        <b-row>
          <b-col cols="12" lg="4" md="4">
            <div>{{ $t('decay.decay') }}</div>
          </b-col>
          <b-col offset="1" offset-md="0" offset-lg="0">{{ decay.decay | GDD }}</b-col>
        </b-row>
      </b-col>
    </b-row>
    <!-- Type-->
    <b-row>
      <b-col>
        <b-row>
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <b-col cols="12" lg="4" md="4">{{ $t(`decay.types.${typeId.toLowerCase()}`) }}</b-col>
          <b-col offset="1" offset-md="0" offset-lg="0">{{ amount | GDD }}</b-col>
        </b-row>
        <!-- Decay-->
        <!-- <b-row>
          <b-col cols="4">{{ $t('decay.decay') }}</b-col>
          <b-col>{{ decay.decay | GDD }}</b-col>
        </b-row> -->
        <!-- Total-->
        <b-row>
          <b-col cols="12" lg="4" md="4">
            <div>{{ $t('decay.total') }}</div>
          </b-col>
          <b-col offset="1" offset-md="0" offset-lg="0">
            <b>{{ (Number(amount) + Number(decay.decay)) | GDD }}</b>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import DurationRow from '@/components/TransactionRows/DurationRow.vue'

export default {
  name: 'DecayInformation-Long',
  components: {
    DurationRow,
  },
  props: {
    amount: { type: String, default: '0' },
    typeId: { type: String, default: '' },
    memo: { type: String, default: '' },
    decay: {
      type: Object,
    },
  },
}
</script>
