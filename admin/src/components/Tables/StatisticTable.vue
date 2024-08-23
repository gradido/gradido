<!-- eslint-disable vue/no-static-inline-styles -->
<template>
  <div class="statistic-table">
    <BTableSimple style="width: auto" class="mt-5" striped stacked="md">
      <BThead>
        <BTr>
          <BTh />
          <BTh class="text-end">{{ $t('statistic.count') }}</BTh>
          <BTh class="text-end">{{ $t('statistic.details') }}</BTh>
        </BTr>
      </BThead>
      <BTbody>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalUsers') }}</b>
          </BTd>
          <BTd class="text-end">
            {{ props.statistics.totalUsers }}
          </BTd>
          <BTd></BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.activeUsers') }}</b>
          </BTd>
          <BTd class="text-end">
            {{ props.statistics.activeUsers }}
          </BTd>
          <BTd></BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.deletedUsers') }}</b>
          </BTd>
          <BTd class="text-end">
            {{ props.statistics.deletedUsers }}
          </BTd>
          <BTd></BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalGradidoCreated') }}</b>
          </BTd>
          <BTd class="text-end">
            <!--            {{ $n(props.statistics.totalGradidoCreated, 'decimal') }} {{ $t('GDD') }}-->
            4500
          </BTd>
          <BTd class="text-end">
            {{ props.statistics.totalGradidoCreated }}
          </BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalGradidoDecayed') }}</b>
          </BTd>
          <BTd class="text-end">
            {{ $n(parseFloat(props.statistics.totalGradidoDecayed), 'decimal') }} {{ $t('GDD') }}
          </BTd>
          <BTd class="text-end">{{ props.statistics.totalGradidoDecayed }}</BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalGradidoAvailable') }}</b>
          </BTd>
          <BTd class="text-end">
            {{ $n(parseFloat(props.statistics.totalGradidoAvailable), 'decimal') }} {{ $t('GDD') }}
          </BTd>
          <BTd class="text-end">
            {{ props.statistics.totalGradidoAvailable }}
          </BTd>
        </BTr>
        <BTr>
          <BTd>
            <b>{{ $t('statistic.totalGradidoUnbookedDecayed') }}</b>
          </BTd>
          <BTd class="text-end">
            {{ $n(parseFloat(props.statistics.totalGradidoUnbookedDecayed), 'decimal') }}
            {{ $t('GDD') }}
          </BTd>
          <BTd class="text-end">{{ props.statistics.totalGradidoUnbookedDecayed }}</BTd>
        </BTr>
      </BTbody>
    </BTableSimple>
  </div>
</template>
<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  statistics: {
    type: Object,
    required: true,
  },
})
</script>
