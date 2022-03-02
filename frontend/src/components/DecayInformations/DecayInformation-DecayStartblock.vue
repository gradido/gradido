<template>
  <div class="decayinformation-startblock">
    <div class="d-flex">
      <div style="width: 100%" class="text-center pb-3">
        <b-icon icon="droplet-half" height="12" class="mb-2" />
        <b>{{ $t('decay.calculation_decay') }}</b>
      </div>
    </div>

    <b-row>
      <b-col cols="6">
        <div>
          <div class="display-4">{{ $t('decay.Starting_block_decay') }}</div>
          <div>{{ $t('decay.decay_introduced') }} :</div>
        </div>
        <div>
          <span v-if="decay.start">
            {{ $d(new Date(decay.start * 1000), 'long') }}
            {{ $i18n.locale === 'de' ? 'Uhr' : '' }}
          </span>
        </div>
      </b-col>
    </b-row>

    <!-- Decay-->
    <b-row>
      <b-col cols="6" class="text-right">
        <div>{{ $t('decay.decay') }}</div>
      </b-col>
      <b-col cols="6">
        <div>- {{ $n(decay.decay, 'decimal') }}</div>
      </b-col>
    </b-row>
    <hr class="mt-2 mb-2" />
    <b-row>
      <b-col class="text-center pt-3 pb-2">
        <b>{{ $t('decay.calculation_total') }}</b>
      </b-col>
    </b-row>
    <!-- Type-->
    <b-row>
      <b-col cols="6" class="text-right">
        <div v-if="typeId === 'SEND'">{{ $t('decay.sent') }}</div>
        <div v-if="typeId === 'RECEIVE'">{{ $t('decay.received') }}</div>
      </b-col>
      <b-col cols="6">
        <div v-if="typeId === 'SEND'">{{ $n(amount, 'decimal') }}</div>
        <div v-if="typeId === 'RECEIVE'">{{ $n(amount, 'decimal') }}</div>
      </b-col>
    </b-row>
    <!-- Decay-->
    <b-row>
      <b-col cols="5">
        <div class="text-right">
          <b-icon icon="droplet-half" height="15" class="mb-1" />
        </div>
      </b-col>
      <b-col cols="7">
        <div class="gdd-transaction-list-item-decay">
          <b>{{ $t('decay.Starting_block_decay') }}</b>
        </div>
      </b-col>
    </b-row>

    <!-- Total-->
    <b-row>
      <b-col cols="6" class="text-right">
        <div>{{ $t('decay.total') }}</div>
      </b-col>
      <b-col cols="6">
        <div v-if="typeId === 'SEND'">
          <b>{{ $n(Number(amount) - Number(decay.decay), 'decimal') }}</b>
        </div>
        <div v-if="typeId === 'RECEIVE'">
          <b>{{ $n(Number(amount) + Number(decay.decay), 'decimal') }}</b>
        </div>
        <div v-if="typeId === 'CREATION'">
          <b>{{ $n(Number(amount) + Number(decay.decay), 'decimal') }}</b>
        </div>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'DecayInformation-StartBlock',
  props: {
    balanceDate: { type: String },
    decayStartBlock: { type: String },
  },
}
</script>
