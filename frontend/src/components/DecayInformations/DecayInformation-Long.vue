<template>
  <div class="decayinformation-long">
    <b-row>
      <b-col>
        <div>
          <div class="text-center pb-3">
            <b-icon icon="droplet-half" class="mr-2" />
            <b>{{ $t('decay.calculation_decay') }}</b>
          </div>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col offset="1" cols="11">
        <b-row>
          <b-col cols="5" class="text-right">
            <div>{{ $t('decay.last_transaction') }}</div>
          </b-col>
          <b-col cols="7">
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
          <b-col cols="5" class="text-right">
            <div>{{ $t('decay.decay') }}</div>
          </b-col>
          <b-col cols="7">{{ decay.decay | GDD }}</b-col>
        </b-row>
      </b-col>
    </b-row>
    <hr class="mt-3 mb-3" />
    <b-row>
      <b-col class="text-center pb-3">
        <b>{{ $t('decay.calculation_total') }}</b>
      </b-col>
    </b-row>
    <!-- Type-->
    <b-row>
      <b-col offset="1" cols="11">
        <b-row>
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
          <b-col cols="5" class="text-right">{{ $t(`decay.types.${typeId.toLowerCase()}`) }}</b-col>
          <b-col cols="7">{{ amount | GDD }}</b-col>
        </b-row>
        <!-- Decay-->
        <b-row>
          <b-col cols="5" class="text-right">{{ $t('decay.decay') }}</b-col>
          <b-col cols="7">{{ decay.decay | GDD }}</b-col>
        </b-row>
        <!-- Total-->
        <b-row>
          <b-col cols="5" class="text-right">
            <div>{{ $t('decay.total') }}</div>
          </b-col>
          <b-col cols="7">
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
    decay: {
      type: Object,
    },
  },
}
</script>
