<template>
  <div>
    <b-list-group>
      <b-list-group-item
        v-for="item in transactions.slice(0, max)"
        :key="item.id"
        style="background-color: #ebebeba3 !important"
      >
        <div class="d-flex w-100 justify-content-between">
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
          <h1 class="">
            <span v-if="item.type === 'receive' || item.type === 'creation'">+</span>
            <span v-else>-</span>
            {{ $n(item.balance) }}
            <small>GDD</small>
          </h1>
          <h2 class="text-muted">{{ item.name }}</h2>
          <b-button v-b-toggle="'a' + item.transaction_id" variant="secondary">
            <b>i</b>
          </b-button>
        </div>
        <b-collapse :id="'a' + item.transaction_id" class="mt-2">
          <b-card>
            <b-list-group>
              <b-list-group-item v-if="item.type === 'send'">
                <b-badge class="mr-4" variant="primary" pill>{{ $t('form.receiver') }}</b-badge>
                {{ item.name }}
              </b-list-group-item>
              <b-list-group-item v-else>
                <b-badge class="mr-4" variant="primary" pill>{{ $t('form.sender') }}</b-badge>
                {{ item.name }}
              </b-list-group-item>

              <b-list-group-item>
                <b-badge class="mr-4" variant="primary" pill>type</b-badge>
                {{ item.type }}
              </b-list-group-item>
              <b-list-group-item>
                <b-badge class="mr-5" variant="primary" pill>id</b-badge>
                {{ item.transaction_id }}
              </b-list-group-item>
              <b-list-group-item>
                <b-badge class="mr-4" variant="primary" pill>{{ $t('form.date') }}</b-badge>
                {{ item.date }}
              </b-list-group-item>
              <b-list-group-item>
                <b-badge class="mr-4" variant="primary" pill>gdd</b-badge>
                {{ item.balance }}
              </b-list-group-item>
              <b-list-group-item>
                <b-badge class="mr-4" variant="primary" pill>{{ $t('form.memo') }}</b-badge>
                {{ item.memo }}
              </b-list-group-item>
            </b-list-group>
            <b-button v-b-toggle="'collapse-1-inner' + item.transaction_id" variant="secondary">
              {{ $t('transaction.more') }}
            </b-button>
            <b-collapse :id="'collapse-1-inner' + item.transaction_id" class="mt-2">
              <b-card>{{ item }}</b-card>
            </b-collapse>
          </b-card>
        </b-collapse>
      </b-list-group-item>
      <b-list-group-item v-show="this.$route.path == '/overview'">
        <b-alert v-if="transactions.length === 0" show variant="secondary">
          <span class="alert-text">{{ $t('transaction.nullTransactions') }}</span>
        </b-alert>
        <router-link
          v-else-if="transactions.length > 5"
          to="/transactions"
          v-html="$t('transaction.show_all', { count: transactionCount })"
        ></router-link>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: 'GddTable',
  props: {
    transactions: { default: [] },
    max: { type: Number, default: 25 },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  data() {
    return {
      form: [],
      fields: ['balance', 'date', 'memo', 'name', 'transaction_id', 'type', 'details'],
      items: [],
    }
  },
  watch: {
    timestamp: {
      immediate: true,
      handler: 'updateTransactions',
    },
  },
  methods: {
    updateTransactions() {
      this.$emit('update-transactions')
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
