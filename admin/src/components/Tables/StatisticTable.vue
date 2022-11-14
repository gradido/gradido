<template>
  <div class="statistic-table">

    <b-table-simple class="mt-5" :items="items" :fields="fields" striped stacked="md" responsive>
      <b-thead>
        <b-tr>
          <b-th></b-th>
          <b-th>{{ $t('statistic.count') }}</b-th>
          <b-th>{{ $t('statistic.detail') }}</b-th>
        </b-tr>
      </b-thead>
      <b-tbody>
        <b-tr>
          <b-td><b>{{ $t('statistic.totalUsers') }}</b></b-td>
          <b-td>{{ value.totalUsers }}</b-td>
          <b-td></b-td>
        </b-tr>
        <b-tr>
          <b-td><b>{{ $t('statistic.activeUsers') }}</b></b-td>
          <b-td>{{ value.activeUsers }}</b-td>
          <b-td></b-td>
        </b-tr>
        <b-tr>
          <b-td><b>{{ $t('statistic.deletedUsers') }}</b></b-td>
          <b-td>{{ value.deletedUsers }}</b-td>
          <b-td></b-td>
        </b-tr>
        <b-tr>
          <b-td><b>{{ $t('statistic.totalGradidoCreated') }}</b></b-td>
          <b-td>{{ $n(value.totalGradidoCreated, 'decimal') }} {{ $t('GDD') }}</b-td>
          <b-td>{{ value.totalGradidoCreated }}</b-td>
        </b-tr>
        <b-tr>
          <b-td><b>{{ $t('statistic.totalGradidoDecayed') }}</b></b-td>
          <b-td>{{ $n(value.totalGradidoDecayed, 'decimal') }} {{ $t('GDD') }}</b-td>
          <b-td>{{ value.totalGradidoDecayed }}</b-td>
        </b-tr>
        <b-tr>
          <b-td><b>{{ $t('statistic.totalGradidoAvailable') }}}</b></b-td>
          <b-td>{{ $n(value.totalGradidoAvailable, 'decimal') }} {{ $t('GDD') }}</b-td>
          <b-td>{{ value.totalGradidoAvailable }}</b-td>
        </b-tr>
        <b-tr>
          <b-td><b>{{ $t('statistic.totalGradidoUnbookedDecayed') }}</b></b-td>
          <b-td>{{ $n(value.totalGradidoUnbookedDecayed, 'decimal') }} {{ $t('GDD') }}</b-td>
          <b-td>{{ value.totalGradidoUnbookedDecayed }}</b-td>
        </b-tr>
      </b-tbody>
    </b-table-simple>
  </div>
</template>
<script>
export default {
  name: 'StatisticTable',
  props: {
    value: {
      type: Array,
      required: true,
    },
    fields: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      // CONFIG,
    }
  },
}
</script>
