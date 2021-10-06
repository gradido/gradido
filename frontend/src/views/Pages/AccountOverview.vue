<template>
  <div>
    <b-container fluid>
      <gdd-status
        v-if="showContext"
        :pending="pending"
        :balance="balance"
        :gdt-balance="GdtBalance"
      />
      <br />
      <hr>
      GDD Statistik
     
    <div class="small">
    <line-chart :chart-data="datacollectionGdd"  :options="chartOptions"></line-chart>
    </div>

    <div class="small">
    <bar-chart :chart-data="datacollectionGdd" ></bar-chart>
    </div>

      <hr>
      GDT Statistik
     
    <div class="small">
    <line-chart :chart-data="datacollectionGdt"></line-chart>
    </div>

    <div class="small">
    <bar-chart :chart-data="datacollectionGdt" ></bar-chart>
    </div>

      <template #transaction-form>
        <transaction-form :balance="balance" @set-transaction="setTransaction"></transaction-form>
      </template>

<!--
      <hr />
      <gdd-transaction-list
        v-if="showContext"
        :transactions="transactions"
        :pageSize="5"
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        @update-transactions="updateTransactions"
      />
      <gdd-transaction-list-footer v-if="showContext" :count="transactionCount" />
-->
         <hr>
      UserAccount Statistik
     
    <div class="small">
    <line-chart :chart-data="datacollectionUser" ></line-chart>
    </div>

 <div class="small">
    <bar-chart :chart-data="datacollectionUser" ></bar-chart>
    </div>
    </b-container>
  </div>
</template>
<script>

import GddStatus from './AccountOverview/GddStatus.vue'
import LineChart from '../../components/Charts/LineChart.js'
import BarChart from '../../components/Charts/BarChart.js'
import GddTransactionList from './AccountOverview/GddTransactionList.vue'
import GddTransactionListFooter from './AccountOverview/GddTransactionListFooter.vue'

const EMPTY_TRANSACTION_DATA = {
  email: '',
  amount: 0,
  memo: '',
}

export default {
  name: 'Overview',
  components: {
    GddStatus,
    LineChart,
    BarChart,
    GddTransactionList,
    GddTransactionListFooter,
  },
  data() {
    return {
      timestamp: Date.now(),
      transactionData: { ...EMPTY_TRANSACTION_DATA },
      error: false,
      errorResult: '',
      currentTransactionStep: 0,
      loading: false,
      datacollectionGdd: null,
      datacollectionGdt: null,
    }
  },
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    pending: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    showContext() {
      return this.currentTransactionStep === 0
    },
  },
  methods: {
    setTransaction(data) {
      this.transactionData = { ...data }
      this.currentTransactionStep = 1
    },

    onReset() {
      this.transactionData = { ...EMPTY_TRANSACTION_DATA }
      this.currentTransactionStep = 0
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
     fillData () {
        this.datacollectionGdd = {
          labels:['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [
            {
              label: 'gesendet',
              backgroundColor: '#ffd600',
              data: [345, 490, 218, 2000, 490, 745, 1113]
            }, {
              label: 'empfangen',
              backgroundColor: '#f3a4b5',
               data: [700, 395, 100, 405, 39, 805, 423]
            }, {
              label: 'geschöpft',
              backgroundColor: '#2bffc6',
               data: [400, 1000, 600, 1000, 900, 800, 1000]
            }
          ]
        },
        this.datacollectionGdt = {
          labels:['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [
            {
              label: 'Euro',
              backgroundColor: '#ffd600',
              data: [200, 500, 100, 200, 300, 500, 100]
            }, {
              label: 'GDT',
              backgroundColor: '#2bffc6',
               data: [2000, 5000, 1100, 2200, 3300, 5500, 1500]
            }
          ]
        },
        this.datacollectionUser = {
          labels:['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [
            {
              label: 'Angemeldete User',
              backgroundColor: '#525f7f',
              data: [200, 220, 330, 420, 480, 500, 784]
            }, {
              label: 'User im Schöpfungsprozess',
              backgroundColor: '#2bffc6',
               data: [80, 133, 155, 220, 280, 320, 421]
            }
          ]
        }
      },
  },
  mounted () {
      this.fillData()
    },
}
</script>
