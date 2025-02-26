<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-3">
    <div class="ps-3">
      <BRow class="small">
        <BCol>{{ $t('time.months') }}</BCol>
        <BCol class="d-none d-md-inline">{{ $t('status') }}</BCol>
        <BCol class="d-none d-md-inline text-center">{{ $t('submitted') }}</BCol>
        <BCol class="text-center">{{ $t('openHours') }}</BCol>
      </BRow>

      <BRow class="fw-bold pt-3">
        <BCol>{{ $d(new Date(minimalDate), 'monthAndYear') }}</BCol>
        <BCol class="d-none d-md-inline">
          {{ maxGddLastMonth > 0 ? $t('contribution.submit') : $t('maxReached') }}
        </BCol>
        <BCol class="d-none d-md-inline text-gold text-center">
          {{ hoursSubmittedLastMonth }} {{ $t('h') }}
        </BCol>
        <BCol class="text-green text-center">{{ hoursAvailableLastMonth }} {{ $t('h') }}</BCol>
      </BRow>

      <BRow class="fw-bold">
        <BCol>{{ $d(new Date(), 'monthAndYear') }}</BCol>
        <BCol class="d-none d-md-inline">
          {{ maxGddThisMonth > 0 ? $t('contribution.submit') : $t('maxReached') }}
        </BCol>
        <BCol class="d-none d-md-inline text-gold text-center">
          {{ hoursSubmittedThisMonth }} {{ $t('h') }}
        </BCol>
        <BCol class="text-green text-center">{{ hoursAvailableThisMonth }} {{ $t('h') }}</BCol>
      </BRow>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { GDD_PER_HOUR } from '../../constants'

const props = defineProps({
  minimalDate: { type: Date, required: true },
  maxGddLastMonth: { type: Number, required: true },
  maxGddThisMonth: { type: Number, required: true },
})

function afterComma(input) {
  return parseFloat(input.toFixed(2)).toString()
}

const hoursSubmittedThisMonth = computed(() =>
  afterComma((1000 - props.maxGddThisMonth) / GDD_PER_HOUR),
)
const hoursSubmittedLastMonth = computed(() =>
  afterComma((1000 - props.maxGddLastMonth) / GDD_PER_HOUR),
)
const hoursAvailableThisMonth = computed(() => afterComma(props.maxGddThisMonth / GDD_PER_HOUR))
const hoursAvailableLastMonth = computed(() => afterComma(props.maxGddLastMonth / GDD_PER_HOUR))
</script>

<style lang="scss" scoped>
.text-gold {
  color: #c58d38 !important;
}

.text-green {
  color: #047006 !important;
}
</style>
