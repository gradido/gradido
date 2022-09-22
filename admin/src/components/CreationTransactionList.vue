<template>
  <div class="component-creation-transaction-list">
    <div class="h3">{{ $t('transactionlist.title') }}</div>
    <b-table striped hover :fields="fields" :items="items"></b-table>
    <div>
      <b-pagination
        pills
        size="lg"
        v-model="currentPage"
        :per-page="perPage"
        :total-rows="rows"
        align="center"
        :hide-ellipsis="true"
      ></b-pagination>
      <b-button v-b-toggle.collapse-1 variant="light" size="sm">{{ $t('help.help') }}</b-button>
      <b-collapse id="collapse-1" class="mt-2">
        <div>
          {{ $t('transactionlist.submitted') }} {{ $t('math.equals') }}
          {{ $t('help.transactionlist.submitted') }}
        </div>
        <div>
          {{ $t('transactionlist.confirmed') }} {{ $t('math.equals') }}
          {{ $t('help.transactionlist.confirmed') }}
        </div>
      </b-collapse>
    </div>
  </div>
</template>
<script>
import { creationTransactionList } from '../graphql/creationTransactionList'
export default {
  name: 'CreationTransactionList',
  props: {
    userId: { type: Number, required: true },
  },
  data() {
    return {
      items: [],
      rows: 0,
      currentPage: 1,
      perPage: 25,
      fields: [
        {
          key: 'createdAt',
          label: this.$t('transactionlist.submitted'),
          formatter: (value, key, item) => {
            return this.$d(new Date(value))
          },
        },
        {
          key: 'contributionDate',
          label: this.$t('transactionlist.period'),
          formatter: (value, key, item) => {
            return this.$d(new Date(value))
          },
        },
        {
          key: 'confirmedAt',
          label: this.$t('transactionlist.confirmed'),
          formatter: (value, key, item) => {
            if (value) {
              return this.$d(new Date(value))
            } else {
              return null
            }
          },
        },
        {
          key: 'state',
          label: this.$t('transactionlist.state'),
        },
        {
          key: 'amount',
          label: this.$t('transactionlist.amount'),
          formatter: (value, key, item) => {
            return `${value} GDD`
          },
        },
        { key: 'memo', label: this.$t('transactionlist.memo') },
      ],
    }
  },
  methods: {
    getTransactions() {
      this.$apollo
        .query({
          query: creationTransactionList,
          variables: {
            currentPage: this.currentPage,
            pageSize: this.perPage,
            order: 'DESC',
            userId: parseInt(this.userId),
          },
        })
        .then((result) => {
          this.rows = result.data.creationTransactionList.contributionCount
          this.items = result.data.creationTransactionList.contributionList
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
  },
  created() {
    this.getTransactions()
  },
  watch: {
    currentPage() {
      this.getTransactions()
    },
  },
}
</script>
