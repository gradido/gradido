<!-- eslint-disable vue/no-static-inline-styles -->
<template>
  <div class="statistic-table">
    <b-table-simple
      style="width: auto"
      class="mt-5"
      :items="items"
      :fields="fields"
      striped
      stacked="md"
    >
      <b-thead>
        <b-tr>
          <b-th></b-th>
          <b-th class="text-right">{{ $t('statistic.count') }}</b-th>
          <b-th class="text-right">{{ $t('statistic.detail') }}</b-th>
        </b-tr>
      </b-thead>
      <b-tbody>
        <b-tr>
          <b-td>
            <b>{{ $t('statistic.totalUsers') }}</b>
          </b-td>
          <b-td class="text-right">{{ value.totalUsers }}</b-td>
          <b-td></b-td>
        </b-tr>
        <b-tr>
          <b-td>
            <b>{{ $t('statistic.activeUsers') }}</b>
          </b-td>
          <b-td class="text-right">{{ value.activeUsers }}</b-td>
          <b-td></b-td>
        </b-tr>
        <b-tr>
          <b-td>
            <b>{{ $t('statistic.deletedUsers') }}</b>
          </b-td>
          <b-td class="text-right">{{ value.deletedUsers }}</b-td>
          <b-td></b-td>
        </b-tr>
        <b-tr>
          <b-td>
            <b>{{ $t('statistic.totalGradidoCreated') }}</b>
          </b-td>
          <b-td class="text-right">
            {{ $n(value.totalGradidoCreated, 'decimal') }} {{ $t('GDD') }}
          </b-td>
          <b-td class="text-right">{{ value.totalGradidoCreated }}</b-td>
        </b-tr>
        <b-tr>
          <b-td>
            <b>{{ $t('statistic.totalGradidoDecayed') }}</b>
          </b-td>
          <b-td class="text-right">
            {{ $n(value.totalGradidoDecayed, 'decimal') }} {{ $t('GDD') }}
          </b-td>
          <b-td class="text-right">{{ value.totalGradidoDecayed }}</b-td>
        </b-tr>
        <b-tr>
          <b-td>
            <b>{{ $t('statistic.totalGradidoAvailable') }}</b>
          </b-td>
          <b-td class="text-right">
            {{ $n(value.totalGradidoAvailable, 'decimal') }} {{ $t('GDD') }}
          </b-td>
          <b-td class="text-right">{{ value.totalGradidoAvailable }}</b-td>
        </b-tr>
        <b-tr>
          <b-td>
            <b>{{ $t('statistic.totalGradidoUnbookedDecayed') }}</b>
          </b-td>
          <b-td class="text-right">
            {{ $n(value.totalGradidoUnbookedDecayed, 'decimal') }} {{ $t('GDD') }}
          </b-td>
          <b-td class="text-right">{{ value.totalGradidoUnbookedDecayed }}</b-td>
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
      type: Object,
      required: true,
    },
  },
}
</script>
