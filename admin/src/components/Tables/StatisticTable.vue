<!-- eslint-disable vue/no-static-inline-styles -->
<template>
  <div class="statistic-table">
    <BTableSimple style="width: auto" class="mt-5" striped stacked="md">
      <BThead>
        <BTr>
          <BTh />
          <BTh class="text-right">{{ $t('statistic.count') }}</BTh>
          <BTh class="text-right">{{ $t('statistic.details') }}</BTh>
        </BTr>
      </BThead>
      <BTbody>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalUsers') }}</b>
          </BTd>
          <BTd class="text-right">
            {{ value.totalUsers }}
          </BTd>
          <BTd></BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.activeUsers') }}</b>
          </BTd>
          <BTd class="text-right">
            {{ value.activeUsers }}
          </BTd>
          <BTd></BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.deletedUsers') }}</b>
          </BTd>
          <BTd class="text-right">
            {{ value.deletedUsers }}
          </BTd>
          <BTd></BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalGradidoCreated') }}</b>
          </BTd>
          <BTd class="text-right">
            <!--            {{ $n(value.totalGradidoCreated, 'decimal') }} {{ $t('GDD') }}-->
            4500
          </BTd>
          <BTd class="text-right">
            {{ value.totalGradidoCreated }}
          </BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalGradidoDecayed') }}</b>
          </BTd>
          <BTd class="text-right">
            <!--            {{ $n(value.totalGradidoDecayed, 'decimal') }} {{ $t('GDD') }}-->
            100
          </BTd>
          <BTd class="text-right">{{ value.totalGradidoDecayed }}</BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalGradidoAvailable') }}</b>
          </BTd>
          <BTd class="text-right">
            <!--            {{ $n(value.totalGradidoAvailable, 'decimal') }} {{ $t('GDD') }}-->
            500
          </BTd>
          <BTd class="text-right">
            {{ value.totalGradidoAvailable }}
          </BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalGradidoUnbookedDecayed') }}</b>
          </BTd>
          <BTd class="text-right">
            <!--            {{ $n(value.totalGradidoUnbookedDecayed, 'decimal') }} {{ $t('GDD') }}-->
            600
          </BTd>
          <BTd class="text-right">
            {{ value.totalGradidoUnbookedDecayed }}
          </BTd>
        </BTr>
      </BTbody>
    </BTableSimple>
  </div>
</template>
<script setup>
import { defineProps } from 'vue'
import { BTableSimple, BThead, BTr, BTh, BTbody, BTd } from 'bootstrap-vue-next'

const props = defineProps({
  value: {
    type: Object,
    required: true,
  },
})
</script>
