<template>
  <div class="community-statistic">
    <div>
      <b-jumbotron bg-variant="info" text-variant="white" border-variant="dark">
        <template #header>{{ $t('statistic.name') }}</template>

        <hr class="my-4" />

        <div>
          {{ $t('statistic.totalUsers') }}{{ $t('math.colon') }}
          <b>{{ value.totalUsers }}</b>
        </div>
        <div>
          {{ $t('statistic.activeUsers') }}{{ $t('math.colon') }}
          <b>{{ value.activeUsers }}</b>
        </div>
        <div>
          {{ $t('statistic.deletedUsers') }}{{ $t('math.colon') }}
          <b>{{ value.deletedUsers }}</b>
        </div>
        <div>
          {{ $t('statistic.totalGradidoCreated') }}{{ $t('math.colon') }}
          <b>{{ $n(value.totalGradidoCreated, 'decimal') }} {{ $t('GDD') }}</b>
          <small class="ml-5">{{ value.totalGradidoCreated }}</small>
        </div>
        <div>
          {{ $t('statistic.totalGradidoDecayed') }}{{ $t('math.colon') }}
          <b>{{ $n(value.totalGradidoDecayed, 'decimal') }} {{ $t('GDD') }}</b>
          <small class="ml-5">{{ value.totalGradidoDecayed }}</small>
        </div>
        <div>
          {{ $t('statistic.totalGradidoAvailable') }}{{ $t('math.colon') }}
          <b>{{ $n(value.totalGradidoAvailable, 'decimal') }} {{ $t('GDD') }}</b>
          <small class="ml-5">{{ value.totalGradidoAvailable }}</small>
        </div>
        <div>
          {{ $t('statistic.totalGradidoUnbookedDecayed') }}{{ $t('math.colon') }}
          <b>{{ $n(value.totalGradidoUnbookedDecayed, 'decimal') }} {{ $t('GDD') }}</b>
          <small class="ml-5">{{ value.totalGradidoUnbookedDecayed }}</small>
        </div>
      </b-jumbotron>
    </div>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'CommunityStatistic',
  props: {
    value: { type: Object },
  },
  data() {
    return {
      CONFIG,
    }
  },
}
</script>
