<template>
  <div>
    <div class="header pb-7 pt-5"></div>

    <b-container fluid class="mt--6">
      <div class="display-4 mb-3">{{ $t('site.profil.activity.chart') }}</div>
      <b-row>
        <b-col>
          <div class="chart">
            <line-chart :height="350" :chart-data="bigLineChart.chartData"></line-chart>
          </div>
        </b-col>
      </b-row>
      <hr />
      <div class="display-4 mt-6">{{ $t('site.profil.activity.new') }}</div>
      <b-row>
        <b-col>
          <gdd-add-work-2 />
        </b-col>
      </b-row>

      <hr />
      <div class="display-4 mb-3">{{ $t('site.profil.activity.list') }}</div>
      <b-row>
        <b-col class="mb-5">
          {{ $t('community') }}
          <gdd-work-table></gdd-work-table>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import GddWorkTable from '../../views/Pages/AccountOverview/GddWorkTable.vue'
import GddAddWork2 from '../../views/Pages/AccountOverview/GddAddWork2.vue'

import * as chartConfigs from '@/components/Charts/config'
import LineChart from '@/components/Charts/LineChart'

export default {
  components: {
    GddWorkTable,
    LineChart,
    GddAddWork2,
  },
  data() {
    return {
      bigLineChart: {
        allData: [
          [0, 20, 10, 30, 15, 40, 20, 60, 60],
          [0, 20, 5, 25, 10, 30, 35, 60, 40],
          [0, 2, 5, 7, 10, 30, 15, 9, 10],
          [0, 2, 5, 7, 10, 14, 29, 78, 120],
        ],
        activeIndex: 0,
        chartData: {
          datasets: [
            {
              label: 'Gemeinschaftsstunden',
              data: [30, 20, 10, 30, 65, 40, 20, 60, 70],
            },
          ],
          labels: ['2020 Aug', 'Sep', 'Okt', 'Nov', 'Dez', 'Jan', 'Feb', 'Mär 2021'],
        },
        extraOptions: chartConfigs.blueChartOptions,
      },
    }
  },
}
</script>
<style></style>
