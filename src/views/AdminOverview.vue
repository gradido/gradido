<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-gradient-success">
      <!-- Card stats -->
      <b-row>
        <b-col xl="3" md="6">
          <stats-card :title="$t('admin.site.overview.creation')"
                      type="gradient-red"
                      sub-title="350,897"
                      icon="ni ni-active-40"
                      class="mb-4">

            <template slot="footer" >
              <span class="text-success mr-2">3.48%</span>
              <span class="text-nowrap">{{ $t('site.overview.since_last_month') }}</span>
            </template>
          </stats-card>
        </b-col>
        <b-col xl="3" md="6">
          <stats-card :title="$t('admin.site.overview.transience')"
                      type="gradient-orange"
                      sub-title="2,356"
                      icon="ni ni-chart-pie-35"
                      class="mb-4">

            <template slot="footer">
              <span class="text-success mr-2">12.18%</span>
              <span class="text-nowrap">{{ $t('site.overview.since_last_month') }}</span>
            </template>
          </stats-card>
        </b-col>
        <b-col xl="3" md="6">
          <stats-card :title="$t('admin.site.overview.exchanged')"
                      type="gradient-green"
                      sub-title="924"
                      icon="ni ni-money-coins"
                      class="mb-4">

            <template slot="footer">
              <span class="text-danger mr-2">5.72%</span>
              <span class="text-nowrap">{{ $t('site.overview.since_last_month') }}</span>
            </template>
          </stats-card>
        </b-col>
        <b-col xl="3" md="6">
          <stats-card :title="$t('admin.site.overview.members')"
                      type="gradient-info"
                      sub-title="49,65%"
                      icon="ni ni-chart-bar-32"
                      class="mb-4">

            <template slot="footer">
              <span class="text-success mr-2">54.8%</span>
              <span class="text-nowrap">{{ $t('site.overview.since_last_month') }}</span>
            </template>
          </stats-card>
        </b-col>
      </b-row>
    </base-header>
 
    <!--Charts-->
    <b-container fluid class="mt--7">
      <b-row>
        <b-col xl="8" class="mb-5 mb-xl-0">
          <card type="default" header-classes="bg-transparent">
            <b-row align-v="center" slot="header">
              <b-col>
                <h6 class="text-light text-uppercase ls-1 mb-1">Charts</h6>
                <h5 class="h3 text-white mb-0">Geschöpft</h5>
              </b-col>
              <b-col>
                <b-nav class="nav-pills justify-content-end">
                  <b-nav-item
                       class="mr-2 mr-md-0"
                       :active="bigLineChart.activeIndex === 0"
                       link-classes="py-2 px-1"
                       @click.prevent="initBigChart(0)">
                      <span class="d-none d-md-block">geschöpft</span>
                      <span class="d-md-none">M</span>
                  </b-nav-item>
                  <b-nav-item
                    link-classes="py-2 px-1"
                    :active="bigLineChart.activeIndex === 1"
                    @click.prevent="initBigChart(1)"
                  >
                    <span class="d-none d-md-block">geteilt</span>
                    <span class="d-md-none">W</span>
                  </b-nav-item>
                   <b-nav-item
                    link-classes="py-2 px-1"
                    :active="bigLineChart.activeIndex === 2"
                    @click.prevent="initBigChart(2)"
                  >
                    <span class="d-none d-md-block">vergangen</span>
                    <span class="d-md-none">W</span>
                  </b-nav-item>
                   <b-nav-item
                    link-classes="py-2 px-1"
                    :active="bigLineChart.activeIndex === 3"
                    @click.prevent="initBigChart(3)"
                  >
                    <span class="d-none d-md-block">mitglieder</span>
                    <span class="d-md-none">W</span>
                  </b-nav-item>
                </b-nav>
              </b-col>
            </b-row>
            <line-chart
              :height="350"
              ref="bigChart"
              :chart-data="bigLineChart.chartData"
              :extra-options="bigLineChart.extraOptions"
            >
            </line-chart>
          </card>
        </b-col>

        <b-col xl="4" class="mb-5 mb-xl-0">
          <card header-classes="bg-transparent">
            <b-row align-v="center" slot="header">
              <b-col>
                <h6 class="text-uppercase text-muted ls-1 mb-1">Community</h6>
                <h5 class="h3 mb-0">Neue Einträge</h5>
              </b-col>
            </b-row>

            <bar-chart
              :height="350"
              ref="barChart"
              :chart-data="redBarChart.chartData"
            >
            </bar-chart>
          </card>
        </b-col>
      </b-row>
      <!-- End charts-->


 
  <br>
      <br>
      <br>
 
      <!--Tables User Search && New User-->    
      <admin-user-search />

      <br>
      <br>
      <br>
 
      <admin-user-creation/>


    <br> 
       
      <b-card-header> 
     <hr>
    <h3>Admin Participation List</h3>
    <small>/public/json-example/admin_card_statistic.json</small>
    <p>
      {{cardstatistic}}
    </p>

     </b-card-header>
      <b-card-header> 
   <hr>
    <h3>Admin Charts Statistic</h3>
    <small>/public/json-example/admin_charts_statistic.json</small>
    <p>
      {{chartsstatistic}}
    </p>

     </b-card-header>
      <b-card-header> 
       <hr>
    <h3>Admin Community Statistic</h3>
    <small>/public/json-example/admin_community_statistic.json</small>
    <p>
      {{communitystatistic}}
    </p>
     </b-card-header>
      <b-card-header> 
    <hr>
    <h3>Admin User List</h3>
    <small>/public/json-example/admin_userlist.json</small>
    <p>
      {{userlist}}
    </p>
     </b-card-header>
      <b-card-header> 
      <hr>
    <h3>Admin Transaction List</h3>
    <small>/public/json-example/admin_transaction_list.json</small>
    <p>
      {{transactionlist}}
    </p>

      <hr>
       </b-card-header>
      <b-card-header> 
    <h3>Admin Transience List</h3>
    <small>/public/json-example/admin_transience_list.json</small>
    <p>
      {{transiencelist}}
    </p>
    </b-card-header>
      <!--End tables-->
    </b-container>

  </div>
</template>
<script>
  // Charts
  import * as chartConfigs from '@/components/Charts/config';
  import LineChart from '@/components/Charts/LineChart';
  import BarChart from '@/components/Charts/BarChart';

  // Components
  import BaseProgress from '@/components/BaseProgress';
  import StatsCard from '@/components/Cards/StatsCard';
  import SearchUser from '@/components/SearchUser';

  // Tables

  import PageVisitsTable from './Dashboard/PageVisitsTable';
  import AdminUserSearch from './AdminOverview/AdminUserSearch';
  import AdminUserCreation from './AdminOverview/AdminUserCreation';
  import axios from 'axios';


  export default {
    components: {
      LineChart,
      BarChart,
      BaseProgress,
      StatsCard,
      PageVisitsTable,
      AdminUserSearch,
      AdminUserCreation,
      SearchUser
    },
    data() {
      return {
        statisticdata: [],
        cardstatistic:[], 
        chartsstatistic: [],
        communitystatistic: [],
        userlist: [],
        transactionlist: [],
        transiencelist: [],
        filter: '',
        items: [
          { id: 1, first_name: "Mikkel", last_name: "Hansen", age: 54 },
          { id: 2, first_name: "Kasper", last_name: "Hvidt", age: 42 },
          { id: 3, first_name: "Lasse", last_name: "Boesen", age: 39 },
          { id: 4, first_name: "Kasper", last_name: "Hansen", age: 62 },
          { id: 5, first_name: "Mads", last_name: "Mikkelsen", age: 31 },
        ],
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
        redBarChart: {
          chartData: {
            labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
              label: 'Sales',
              data: [25, 20, 30, 22, 17, 29]
            }]
          },
          extraOptions: chartConfigs.blueChartOptions
        }
      };
    },
    methods: {
     TransienceList() {
          axios.get("/json-example/admin_transience_list.json").then((d) => {
          console.log(d);
          this.transiencelist = d.data;
          
        }, (error) => {
          console.log(error);
        });
        },
     TransactionList() {
          axios.get("/json-example/admin_transaction_list.json").then((d) => {
          console.log(d);
          this.transactionlist = d.data;
          
        }, (error) => {
          console.log(error);
        });
        },
      UserList() {
          axios.get("/json-example/admin_userlist.json").then((d) => {
          console.log(d);
          this.userlist = d.data;
          
        }, (error) => {
          console.log(error);
        });
        },
      CommunityStatistic() {
          axios.get("/json-example/admin_community_statistic.json").then((d) => {
          console.log(d);
          this.communitystatistic = d.data;
          
        }, (error) => {
          console.log(error);
        });
        },
      ChartsStatistic() {
          axios.get("/json-example/admin_charts_statistic.json").then((d) => {
          console.log(d);
          this.chartsstatistic = d.data;
          
        }, (error) => {
          console.log(error);
        });
        },
      CardStatistic() {
          axios.get("/json-example/admin_card_statistic.json").then((d) => {
          console.log(d);
          this.cardstatistic = d.data;
          
        }, (error) => {
          console.log(error);
        });
        },
       StatisticDatas() {
          axios.get("/json-example/admin_statisticdatas.json").then((d) => {
          console.log(d);
          this.userdata = d.data;
          
        }, (error) => {
          console.log(error);
        });
        },
      initBigChart(index) {
        let chartData = {
          datasets: [
            {
              label: 'Performance',
              data: this.bigLineChart.allData[index]
            }
          ],
          labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        };
        this.bigLineChart.chartData = chartData;
        this.bigLineChart.activeIndex = index;
      }
    },
    mounted() {
      this.initBigChart(0);
      this.TransienceList();
      this.TransactionList(); 
      this.UserList(); 
      this.CommunityStatistic();
      this.ChartsStatistic();
      this.CardStatistic();
    }
 
  }
</script>
<style>
.el-table .cell{
  padding-left: 0px;
  padding-right: 0px;
}
</style>
