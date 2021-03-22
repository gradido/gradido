<template>
  <div>
    <div class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center profile-header" style="max-height:200px">
        <b-container fluid>
        <b-container fluid class="d-flex align-items-center">
          <b-row >
            <b-col lg="7" md="10">
              <h1 class="display-2 text-white">{{this.$store.state.email}} </h1>
               
            </b-col>
          </b-row>
        </b-container>
      </b-container>
    </div>
    
    
    
    <b-container fluid class="mt--6">
      <b-row>
        <b-col xl="4" class="order-xl-2 mb-5">
          community
         <gdd-work-table></gdd-work-table>
        </b-col>
        <b-col xl="8" class="order-xl-1">
          transactions
          <gdd-table></gdd-table>
        </b-col>
      </b-row>
        <b-row>
        <b-col xl="6"  S>
          <div class="chart">
            <line-chart
              :height="350"
              :chart-data="bigLineChart.chartData"
            >
            </line-chart>
          </div>
          
        </b-col>
        <b-col xl="6"  >
          <div class="chart">
            <line-chart
              :height="350"
              :chart-data="bigLineChart.chartData"
            >
            </line-chart>
          </div>
           
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
  import GddTable from '../../views/KontoOverview/GddTable.vue';
  import GddWorkTable from '../../views/KontoOverview/GddWorkTable.vue';
   

 import * as chartConfigs from '@/components/Charts/config';
  import LineChart from '@/components/Charts/LineChart';
  import BarChart from '@/components/Charts/BarChart';

  export default {
    components: {
      GddTable,
     GddWorkTable,
    LineChart,
    BarChart
    },
    data(){
      return {
        bigLineChart: {
          allData: [
            [0, 20, 10, 30, 15, 40, 20, 60, 60],
            [0, 20, 5, 25, 10, 30, 35, 60, 40],
            [0, 2, 5, 7, 10, 30, 15, 9, 10],
            [0, 2, 5, 7, 10, 14, 29, 78, 120]
          ],
          activeIndex: 0,
          chartData: {
            datasets: [
              {
                label: 'Performance',
                data: [0, 20, 10, 30, 15, 40, 20, 60, 60],
              }
            ],
            labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          },
          extraOptions: chartConfigs.blueChartOptions,
        },
      }
    }
  };
</script>
<style>
</style>
