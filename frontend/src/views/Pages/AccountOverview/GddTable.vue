<template>
  <div>
    <b-list-group
      horizontal="sm"
      class="w-100 justify-content-between align-content-space-around"      
      v-for="item in transactions.slice(0, max)"
      :key="item.id"
      style="background-color: #ebebeba3 !important"
    >
      <b-list-group-item>
        <b-icon
          v-if="item.type === 'send'"
          icon="arrow-left-circle"
          class="m-1 text-danger"
          font-scale="2"
          style="color: red"
        ></b-icon>
        <b-icon
          v-else-if="item.type === 'receive'"
          icon="arrow-right-circle"
          class="m-1"
          font-scale="2"
          style="color: green"
        ></b-icon>
        <b-icon
          v-else-if="item.type === 'creation'"
          icon="gift"
          class="m-1"
          font-scale="2"
          style="color: orange"
        ></b-icon>
        <b-icon
          v-else
          icon="droplet-half"
          class="m-1"
          font-scale="2"
          style="color: orange"
        ></b-icon>
      </b-list-group-item>
      <b-list-group-item class="w-100 align-items-start pt-4">
        <b class="">
          <span v-if="item.type === 'receive' || item.type === 'creation'">+</span>
          <span v-else>-</span>
          {{ $n(item.balance) }}
        </b>
      </b-list-group-item>
      <b-list-group-item class="w-100 align-items-start">
        <b class="text-muted">{{ item.name }}</b>
        <div>{{ item.memo }}</div>
      </b-list-group-item>
      <b-list-group-item class="w-100 align-items-start">
        {{ $moment(item.date).format('DD.MM.YYYY - HH:mm:ss') }}
      </b-list-group-item>
    </b-list-group>
   
      <b-list-group-item v-show="this.$route.path == '/overview'">
        <b-alert v-if="transactions.length === 0" show variant="secondary">
          <span class="alert-text">{{ $t('transaction.nullTransactions') }}</span>
        </b-alert>
        <router-link
          v-else-if="transactions.length > 5"
          to="/transactions"
          v-html="$t('transaction.show_all', { count: count })"
        ></router-link>
      </b-list-group-item>
  </div>
</template>

<script>
export default {
  name: 'GddTable',
  props: {
    transactions: { default: [] },
    max: { type: Number, default: 25 },
  },
  data() {
    return {
      form: [],
      fields: ['balance', 'date', 'memo', 'name', 'transaction_id', 'type', 'details'],
      items: [],
      count: 0,
    }
  },
  created() {
    this.$emit('change-transactions')

    this.transactions = [
      {
        name: 'Max Mustermann',
        email: 'Maxim@Mustermann',
        type: 'send',
        transaction_id: 2,
        date: '2021-02-19T13:25:38+00:00',
        balance: 1920000,
        memo: 'a piece of cake :)',
        pubkey: '038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7',
      },
      {
        name: 'Bob Bobmann',
        email: 'Bob@Bobmann',
        type: 'receive',
        transaction_id: 3,
        date: '2021-03-19T13:27:36+00:00',
        balance: 1920000,
        memo: 'test text hier eingeben :)',
        pubkey: '038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7',
      },
      {
        name: 'Gradido Akademie',
        email: 'Gradido@Akademie',
        type: 'creation',
        transaction_id: 4,
        date: '2021-03-22T13:25:36+00:00',
        balance: 10000000,
        memo: '1000 Gradidos für das Sammeln von Müll im Wald.',
        pubkey: '038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7',
      },
      {
        name: 'Verfall',
        email: 'Gradido@Akademie',
        type: 'decay',
        transaction_id: 5,
        date: '2021-02-22T13:25:37+00:00',
        balance: 20000,
        memo: 'verfall',
        pubkey: '038a6f93270dc57b91d76bf110ad3863fcb7d1b08e7692e793fcdb4467e5b6a7',
      },
    ]
  },
  computed: {
    filteredItems() {
      return this.ojectToArray(this.items).reverse()
    },
  },
  methods: {
    ojectToArray(obj) {
      let result = new Array(Object.keys(obj).length)
      Object.entries(obj).forEach((entry) => {
        const [key, value] = entry
        result[key] = value
        console.log(result)
      })
      return result
    },
  },
}
</script>
<style>
.list-group-item {
  background-color: #eff0f2;
  border: 1px solid #e9ecef;
}
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
