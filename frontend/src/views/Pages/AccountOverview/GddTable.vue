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
