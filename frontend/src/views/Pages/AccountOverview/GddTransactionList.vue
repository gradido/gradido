<template>
  <div>
    <b-list-group>
      <b-list-group-item
        v-for="item in transactions.slice(0, max)"
        :key="item.id"
        style="background-color: #ebebeba3 !important"
      >
        <div class="d-flex">
          <div style="width: 10%">
            <b-icon
              v-if="item.type === 'send'"
              icon="arrow-left-circle"
              class="m-mb-1 text-danger font2em"
            ></b-icon>
            <b-icon
              v-else-if="item.type === 'receive'"
              icon="arrow-right-circle"
              class="m-md-1 text-success font2em"
            ></b-icon>
            <b-icon
              v-else-if="item.type === 'creation'"
              icon="gift"
              class="m-md-1 font2em"
              style="color: green"
            ></b-icon>
            <b-icon v-else icon="droplet-half" class="m-md-1 font2em" style="color: gray"></b-icon>
          </div>
          <div class="font1_2em pl-2" style="width: 30%">
            {{ $n(item.balance) }}
            <span v-if="item.type === 'receive' || item.type === 'creation'">+</span>
            <span v-else>-</span>
          </div>
          <div class="font1_2em" style="width: 50%">
            {{ item.name }} -
            <div class="text-sm">{{ $moment(item.date).format('DD.MM.YYYY - HH:mm:ss') }}</div>
          </div>
          <b-button v-b-toggle="'a' + item.transaction_id" class="btn-sm">
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
      <div v-if="transactions.length === 0" class="mt-lg-4 text-center">
        <span>{{ $t('transaction.nullTransactions') }}</span>
      </div>
    </b-list-group>
  </div>
</template>

<script>
export default {
  name: 'gdd-transaction-list',
  props: {
    transactions: { default: [] },
    max: { type: Number, default: 1000 },
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
.font1_2em {
  font-size: 1.2em;
}
.font2em {
  font-size: 1.5em;
}
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
