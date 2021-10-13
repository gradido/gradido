<template>
  <div class="appChartExample">
    <apexchart width="100%" height="400" type="line" :options="chartOptions" :series="series" />
    <apexchart
      width="100%"
      height="150"
      type="area"
      :options="chartOptionsMinimap"
      :series="series"
    />
    <div></div>
  </div>
</template>

<script>
import { series } from './series.js'

export default {
  data: function () {
    const chartId = 'priceHistoryChart' + Date.now()
    const chartIdMinimap = 'priceHistoryChartMinimap' + Date.now()

    const dateFrom = new Date('2018-09-26')
    const dateTo = new Date('2018-10-01')

    const chartOptions = {
      chart: {
        background: '#efe',
        id: chartId,
        animations: {
          enabled: false,
        },
        toolbar: {
          autoSelected: 'pan',
          show: false,
        },
      },
      legend: {
        position: 'right',
      },
      stroke: {
        curve: 'smooth',
        width: [4],
        dashArray: [10],
      },
      tooltip: {
        followCursor: true,
        x: {
          show: false,
        },
      },
      xaxis: {
        type: 'datetime',
      },
    }

    const chartOptionsMinimap = {
      chart: {
        id: chartIdMinimap,
        animations: {
          enabled: false,
        },
        brush: {
          enabled: true,
          target: chartId,
        },
        selection: {
          xaxis: {
            min: dateFrom.getTime(),
            max: dateTo.getTime(),
          },
        },
        type: 'line',
      },
      fill: {
        gradient: {
          enabled: true,
          opacityFrom: 0.91,
          opacityTo: 0.1,
        },
      },
      legend: {
        show: false,
      },
      xaxis: {
        type: 'datetime',
      },
    }

    return {
      chartOptions,
      chartOptionsMinimap,
      series,
    }
  },
  methods: {
    updateChart() {
      this.chartOptionsMinimap = {
        chart: {
          foreColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
          selection: {
            xaxis: {
              min: new Date('2018-09-28').getTime(),
              max: new Date('2018-09-30').getTime(),
            },
          },
        },
      }
    },
  },
}
</script>
