<template>
  <div>
    <b-container fluid>
      <b-row>
        <b-col class="col-6">
          <b-row>
            <b-col class="col-11 bg-gray text-white p-3">
              <gdd-status
                v-if="showContext"
                :pending="pending"
                :balance="balance"
                :gdt-balance="GdtBalance"
                :gdt="false"
              />
            </b-col>
          </b-row>
        </b-col>
        <b-col class="col-6 text-right">
          <b-row>
            <b-col class="bg-white text-gray p-3">
              <gdd-status
                v-if="showContext"
                :pending="pending"
                :balance="balance"
                :gdt-balance="GdtBalance"
                :gdd="false"
              />
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <br />

      <b-row>
        <b-col class="col-12 col-md-6">
          GDD Bar
          <div>
            <apexchart type="bar" :options="chartOptions" :series="series"></apexchart>
          </div>
        </b-col>
        <b-col class="col-12 col-md-6">
          GDD Line
          <div>
            <apexchart type="line" :options="chartOptions" :series="series"></apexchart>
          </div>
        </b-col>
      </b-row>
      <hr />

      <template #transaction-form>
        <transaction-form :balance="balance" @set-transaction="setTransaction"></transaction-form>
      </template>

      <gdd-transaction-list
        v-if="showContext"
        :transactions="transactions"
        :pageSize="5"
        :timestamp="timestamp"
        :transaction-count="transactionCount"
        @update-transactions="updateTransactions"
      />
      <gdd-transaction-list-footer v-if="showContext" :count="transactionCount" />
    </b-container>
    <hr />
    example
    <chart-example />
  </div>
</template>
<script>
import GddStatus from './GddGdtStatus.vue'
import GddTransactionList from './AccountOverview/GddTransactionList.vue'
import GddTransactionListFooter from './AccountOverview/GddTransactionListFooter.vue'
import ChartExample from '../../components/charts/ChartExample.vue'

export default {
  name: 'Overview',
  components: {
    GddStatus,
    GddTransactionList,
    GddTransactionListFooter,
    ChartExample,
  },
  data() {
    return {
      timestamp: Date.now(),
      error: false,
      errorResult: '',
      currentTransactionStep: 0,
      loading: false,
      datacollectionGdd: null,
      datacollectionGdt: null,

      chartOptions: {
        chart: {
          class: 'vuechart',
        },
        xaxis: {
          categories: ['Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt'],
        },
      },
   
      series: [
        {
          name: this.$t('decay.received'),
          data: [30, 40, 35, 50, 49, 60, 70, 91],
        },
        {
          name: this.$t('decay.sent'),
          data: [20, 10, 45, 60, 59, 30, 50, 81],
        },
        {
          name: this.$t('decay.created'),
          data: [1000, 500, 700, 1000, 800, 500, 1000, 810],
        },
      ],
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
      this.currentTransactionStep = 1
    },

    onReset() {
      this.currentTransactionStep = 0
    },

    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
}
</script>
