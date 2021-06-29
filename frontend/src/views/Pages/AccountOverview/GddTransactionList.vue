<template>
  <div class="gdd-transaction-list"> 
    <b-list-group>
      <b-list-group-item
        v-for="item in transactions"
        :key="item.id"
        style="background-color: #ebebeba3 !important"
      >
        <div class="d-flex gdd-transaction-list-item" v-b-toggle="'a' + item.date + ''" >
          <div style="width: 8%">
            <b-icon :icon="getProperties(item).icon" :class="getProperties(item).class" />
          </div>
          <div class="font1_2em pr-2 text-right" style="width: 32%">
            <span>{{ getProperties(item).operator }}</span>
            {{ $n(item.balance, 'decimal') }}
          </div>
          <div class="font1_2em text-left pl-2" style="width: 55%">
            {{ item.name ? item.name : $t('decay') }}
            <div v-if="item.date" class="text-sm">{{ $d($moment(item.date), 'long') }}</div>
          </div>
          <div class="text-right" style="width: 5%">
            <b-button class="btn-sm">
              <b>i</b>
            </b-button>
          </div>
        </div>
        <b-collapse :id="'a' + item.date + ''" class="mt-2">
          <b-card>
          <b-card-title>
            <div class="display-4"> {{ item.type === "receive" ? "empfangen:" : "gesendet:" }}</div>
          </b-card-title>
             <b-card-body>
               
              <p class="display-2">   {{ $n(item.balance, 'decimal') }} GDD</p>
              
              <div> <div>am: </div><span class="display-4">{{ $d($moment(item.date), 'long') }}</span></div>
              <div><div >an:</div> <span class="display-4">{{ item.name }}</span></div>
               <div class="display-5"> {{ item.type === "receive" ? "Nachricht vom Absender:" : "Nachricht an Empfänger:" }}</div>
              <div class="display-4">{{ item.memo }}</div>
              <hr>

               <div>Seit deiner letzten Transaction sind </div>
               <div>{{ item.decay.length }} vergangen.</div>
               <div>{{ item.decay }} Verfall.</div>
            </b-card-body>
            
            <b-button v-b-toggle="'collapse-1-inner' + item.date" variant="secondary">
              {{ $t('transaction.more') }}
            </b-button>
            <b-collapse :id="'collapse-1-inner' + item.date" class="mt-2">
              <b-card>{{ item }}</b-card>
            </b-collapse>
           
          </b-card>
        </b-collapse>
      </b-list-group-item>
      <pagination-buttons
        v-if="showPagination && transactionCount > pageSize"
        :has-next="hasNext"
        :has-previous="hasPrevious"
        :total-pages="totalPages"
        :current-page="currentPage"
        @show-next="showNext"
        @show-previous="showPrevious"
      ></pagination-buttons>
      <div v-if="transactions.length === 0" class="mt-4 text-center">
        <span>{{ $t('transaction.nullTransactions') }}</span>
      </div>
    </b-list-group>
  </div>
</template>

<script>
 import PaginationButtons from '../../../components/PaginationButtons'

  const iconsByType = {
    send: { icon: 'arrow-left-circle', classes: 'text-danger', operator: '-' },
    receive: { icon: 'arrow-right-circle', classes: 'gradido-global-color-accent', operator: '+' },
    creation: { icon: 'gift', classes: 'gradido-global-color-accent', operator: '+' },
    decay: { icon: 'droplet-half', classes: 'gradido-global-color-gray', operator: '-' },
  }

export default {
  name: 'gdd-transaction-list',
  components: {
    PaginationButtons,
  },
  data() {
    return {
      currentPage: 1,
    }
  },
  props: {
    transactions: { default: () => [] },
    pageSize: { type: Number, default: 25 },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
  },
  watch: {
    timestamp: {
      immediate: true,
      handler: 'updateTransactions',
    },
  },
  computed: {
    hasNext() {
      return this.currentPage * this.pageSize < this.transactionCount
    },
    hasPrevious() {
      return this.currentPage > 1
    },
    totalPages() {
      return Math.ceil(this.transactionCount / this.pageSize)
    },
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions', {
        firstPage: this.currentPage,
        items: this.pageSize,
      })
    },
    getProperties(item) {
      const type = iconsByType[item.type]
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
    showNext() {
      this.currentPage++
      this.updateTransactions()
    },
    showPrevious() {
      this.currentPage--
      this.updateTransactions()
    },
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
