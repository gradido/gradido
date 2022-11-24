<template>
  <div class="pb-4">
    <!-- <b-tabs v-model="tabIndex" content-class="" justified>
      <b-tab
        :title="`Gradido  (${$n(balance, 'decimal')} GDD)`"
        class="px-4"
        @click="$router.replace('/transactions')"
      >
        <p class="tab-tex">{{ $t('transaction.gdd-text') }}</p>

        <gdd-transaction-list
          :timestamp="timestamp"
          :transactionCount="transactionCount"
          :transactionLinkCount="transactionLinkCount"
          :transactions="transactions"
          :showPagination="true"
          @update-transactions="updateTransactions"
          v-on="$listeners"
        />
      </b-tab>

      <b-tab :title="titleGdt" class="px-4" @click="updateGdt()">
        <b-row class="mb-3">
          <b-col>{{ $t('transaction.gdt-text') }}</b-col>
          <b-col class="text-right">{{ `${$n(GdtBalance, 'decimal')} GDT` }}</b-col>
        </b-row>
        <gdt-transaction-list
          v-model="currentPage"
          :transactionsGdt="transactionsGdt"
          :transactionGdtCount="transactionGdtCount"
          :pageSize="pageSize"
        />
      </b-tab>
    </b-tabs> -->

    <div v-if="gdt">
      <div>{{ titleGdt }}</div>

      <gdt-transaction-list
        v-model="currentPage"
        :transactionsGdt="transactionsGdt"
        :transactionGdtCount="transactionGdtCount"
        :pageSize="pageSize"
      />
    </div>
    <div v-else>
      <gdd-transaction-list
        :timestamp="timestamp"
        :transactionCount="transactionCount"
        :transactionLinkCount="transactionLinkCount"
        :transactions="transactions"
        :showPagination="true"
        @update-transactions="updateTransactions"
        v-on="$listeners"
      />
    </div>
  </div>
</template>
<script>
import GddTransactionList from '@/components/GddTransactionList.vue'
import GdtTransactionList from '@/components/GdtTransactionList.vue'
import { listGDTEntriesQuery } from '@/graphql/queries'

export default {
  name: 'Transactions',
  components: {
    GddTransactionList,
    GdtTransactionList,
  },
  props: {
    gdt: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
  data() {
    return {
      timestamp: Date.now(),
      transactionsGdt: [],
      transactionGdtCount: 0,
      currentPage: 1,
      pageSize: 25,
      tabIndex: 0,
    }
  },
  methods: {
    async updateGdt() {
      this.$apollo
        .query({
          query: listGDTEntriesQuery,
          variables: {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
          },
        })
        .then((result) => {
          const {
            data: { listGDTEntries },
          } = result
          this.transactionsGdt = listGDTEntries.gdtEntries
          this.transactionGdtCount = listGDTEntries.count
          window.scrollTo(0, 0)
          // eslint-disable-next-line no-unused-expressions
          this.$route.path === '/transactions' ? this.$router.replace('/gdt') : ''
        })
        .catch((error) => {
          this.transactionGdtCount = -1
          this.toastError(error.message)
        })
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  computed: {
    titleGdt() {
      if (this.gdt) return `${this.$t('gdt.gdt')} (${this.$n(this.GdtBalance, 'decimal')} GDT)`
      return this.$t('gdt.gdt')
    },
  },
  created() {
    if (this.gdt) {
      this.updateGdt()
    }
  },
  watch: {
    currentPage() {
      this.updateGdt()
    },
    gdt() {
      if (this.gdt) {
        this.updateGdt()
      }
    },
  },
}
</script>
<style>
.nav-tabs > li > a {
  padding-top: 14px;
  margin-bottom: 14px;
}

.nav-tabs .nav-link {
  background-color: rgba(204, 204, 204, 0.185);
}
.nav-tabs .nav-link.active {
  background-color: rgb(248 249 254);
}

.tab-content {
  padding-top: 25px;
  border-left: 1px inset rgba(28, 110, 164, 0.1);
  border-right: 1px inset rgba(28, 110, 164, 0.1);
}
</style>
