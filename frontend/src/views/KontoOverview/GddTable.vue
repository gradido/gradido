<template>
  <div>
    <b-list-group v-show="showTransactionList">
      <b-list-group-item
        v-for="item in filteredItems"
        :key="item.id"
        style="background-color: #ebebeba3 !important"
      >
        <div class="d-flex w-100 justify-content-between">
          <b-icon
            v-if="item.type === 'send'"
            icon="box-arrow-left"
            class="m-1"
            font-scale="2"
            style="color: red"
          ></b-icon>
          <b-icon
            v-else
            icon="box-arrow-right"
            class="m-1"
            font-scale="2"
            style="color: green"
          ></b-icon>
          <h1 class="mb-1">
            {{ $n(item.balance / 10000) }}
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
        <b-alert v-if="count < 5" show variant="secondary">
          <span class="alert-text" v-html="$t('transaction.show_part', { count: count })"></span>
        </b-alert>
        <router-link
          v-else
          to="/transactions"
          v-html="$t('transaction.show_all', { count: count })"
        ></router-link>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
import axios from 'axios'
import communityAPI from '../../apis/communityAPI'

export default {
  name: 'GddTable',
  props: {
    showTransactionList: { type: Boolean, default: true },
  },
  data() {
    return {
      form: [],
      fields: ['balance', 'date', 'memo', 'name', 'transaction_id', 'type', 'details'],
      items: [],
      count: 0,
    }
  },

  async created() {
    const result = await communityAPI.transactions(this.$store.state.session_id)

    if (result.success) {
      this.items = result.result.data.transactions
      this.count = result.result.data.count
    } else {
      //console.log('error', result)
    }
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
      })
      return result
    },

    rowClass(item, type) {
      if (!item || type !== 'row') return
      if (item.type === 'receive') return 'table-success'
      if (item.type === 'send') return 'table-warning'
      if (item.type === 'creation') return 'table-primary'
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
