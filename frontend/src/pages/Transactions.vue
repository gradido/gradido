<template>
  <div class="pb-4">
    <b-tabs content-class="" justified>
      <b-tab
        :title="`Gradido  (${$n(balance, 'decimal')} GDD)`"
        class="px-4"
        @click="showGdtBalance(false)"
      >
        <p class="tab-tex">{{ $t('transaction.gdd-text') }}</p>

        <gdd-transaction-list
          :timestamp="timestamp"
          :transactionCount="transactionCount"
          :transactionLinkCount="transactionLinkCount"
          :transactions="transactions"
          :show-pagination="true"
          :decayStartBlock="decayStartBlock"
          @update-transactions="updateTransactions"
          v-on="$listeners"
        />
      </b-tab>

      <b-tab :title="titel_gdt" class="px-4" @click="showGdtBalance(true)">
        <p class="">{{ $t('transaction.gdt-text') }}</p>

        <gdt-transaction-list />
      </b-tab>
    </b-tabs>
  </div>
</template>
<script>
import GddTransactionList from '@/components/GddTransactionList.vue'
import GdtTransactionList from '@/components/GdtTransactionList.vue'

export default {
  name: 'Transactions',
  components: {
    GddTransactionList,
    GdtTransactionList,
  },
  props: {
    balance: { type: Number, default: 0 },
    GdtBalance: { type: Number, default: 0 },
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
    decayStartBlock: { type: Date },
  },
  data() {
    return {
      timestamp: Date.now(),
      titel_gdt: this.$t('gdt.gdt'),
    }
  },
  methods: {
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
    showGdtBalance(Boolean) {
      if (Boolean) {
        this.titel_gdt += `( ${
          this.GdtBalance === null ? '—' : this.$n(this.GdtBalance, 'decimal')
        } GDT)`
      } else {
        this.titel_gdt = this.$t('gdt.gdt')
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
