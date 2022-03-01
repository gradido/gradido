<template>
  <div class="gdd-transaction-list">
    <div class="list-group">
      <div v-if="!transactions" class="test-no-transactionlist text-right">
        <b-icon icon="exclamation-triangle" class="mr-2" variant="danger"></b-icon>
        <small>
          {{ $t('error.no-transactionlist') }}
        </small>
      </div>
      <div v-if="transactionCount < 0" class="test-empty-transactionlist text-right">
        <b-icon icon="exclamation-triangle" class="mr-2" variant="danger"></b-icon>
        <small>{{ $t('error.empty-transactionlist') }}</small>
      </div>

      <div
        v-for="({ id, typeId }, index) in transactions"
        :key="id"
        :style="typeId === 'DECAY' ? 'background-color:#f1e0ae3d' : ''"
      >
        <transaction-decay
          class="list-group-item gdd-transaction-list-item"
          v-if="typeId === 'DECAY'"
          v-bind="transactions[index]"
          :properties="getProperties(typeId)"
        />

        <transaction-send
          class="list-group-item gdd-transaction-list-item"
          v-if="typeId === 'SEND'"
          v-bind="transactions[index]"
          :decayStartBlock="decayStartBlock"
          :properties="getProperties(typeId)"
        />
        <transaction-receive
          class="list-group-item gdd-transaction-list-item"
          v-if="typeId === 'RECEIVE'"
          v-bind="transactions[index]"
          :decayStartBlock="decayStartBlock"
          :properties="getProperties(typeId)"
        />
        <transaction-creation
          class="list-group-item gdd-transaction-list-item"
          v-if="typeId === 'CREATION'"
          v-bind="transactions[index]"
          :decayStartBlock="decayStartBlock"
          :properties="getProperties(typeId)"
        />
      </div>
    </div>
    <pagination-buttons
      v-if="showPagination"
      v-model="currentPage"
      :per-page="pageSize"
      :total-rows="transactionCount"
    ></pagination-buttons>
    <div v-if="transactionCount < 0" class="mt-4 text-center">
      <span>{{ $t('transaction.nullTransactions') }}</span>
    </div>
  </div>
</template>

<script>
import PaginationButtons from '../../../components/PaginationButtons'
import TransactionDecay from '../../../components/transaction-slots/TransactionDecay'
import TransactionSend from '../../../components/transaction-slots/TransactionSend'
import TransactionReceive from '../../../components/transaction-slots/TransactionReceive'
import TransactionCreation from '../../../components/transaction-slots/TransactionCreation'

const iconsByType = {
  SEND: { icon: 'arrow-left-circle', classes: 'text-danger', operator: '−' },
  RECEIVE: { icon: 'arrow-right-circle', classes: 'gradido-global-color-accent', operator: '+' },
  CREATION: { icon: 'gift', classes: 'gradido-global-color-accent', operator: '+' },
  DECAY: { icon: 'droplet-half', classes: 'gradido-global-color-gray', operator: '−' },
}

export default {
  name: 'gdd-transaction-list',
  components: {
    PaginationButtons,
    TransactionDecay,
    TransactionSend,
    TransactionReceive,
    TransactionCreation,
  },
  data() {
    return {
      currentPage: 1,
      collapseStatus: [],
    }
  },
  props: {
    decayStartBlock: { type: Date },
    transactions: { default: () => [] },
    pageSize: { type: Number, default: 25 },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions', {
        currentPage: this.currentPage,
        pageSize: this.pageSize,
      })
      window.scrollTo(0, 0)
    },
    getProperties(givenType) {
      const type = iconsByType[givenType]
      if (type)
        return {
          icon: type.icon,
          class: type.classes + ' m-mb-1 font2em',
          operator: type.operator,
        }
      this.throwError('no icon to given type')
    },
    throwError(msg) {
      throw new Error(msg)
    },
  },
  watch: {
    currentPage() {
      this.updateTransactions()
    },
    timestamp: {
      immediate: true,
      handler: 'updateTransactions',
    },
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}

.gdd-transaction-list-item {
  outline: none !important;
}
</style>
