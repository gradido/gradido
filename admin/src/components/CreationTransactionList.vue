<template>
  <div class="component-creation-transaction-list">
    <div class="h3">{{ $t('transactionlist.title') }}</div>
    <b-table striped hover :fields="fields" :items="items">
      <template #cell(contributionDate)="data">
        <div class="font-weight-bold">
          {{ $d(new Date(data.item.contributionDate), 'month') }}
        </div>
        <div>{{ $d(new Date(data.item.contributionDate)) }}</div>
      </template>
    </b-table>
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
          {{ $t('transactionlist.period') }} {{ $t('math.equals') }}
          {{ $t('help.transactionlist.periods') }}
        </div>
        <div>
          {{ $t('transactionlist.confirmed') }} {{ $t('math.equals') }}
          {{ $t('help.transactionlist.confirmed') }}
        </div>
        <div>
          {{ $t('transactionlist.state') }} {{ $t('math.equals') }}
          {{ $t('help.transactionlist.state') }}
        </div>
      </b-collapse>
    </div>
  </div>
</template>
<script>
import { adminListContributions } from '../graphql/adminListContributions'
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
      perPage: 10,
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
        { key: 'memo', label: this.$t('transactionlist.memo'), class: 'text-break' },
      ],
    }
  },
  apollo: {
    AdminListContributions: {
      query() {
        return adminListContributions
      },
      variables() {
        return {
          currentPage: this.currentPage,
          pageSize: this.perPage,
          order: 'DESC',
          userId: parseInt(this.userId),
        }
      },
      update({ adminListContributions }) {
        this.rows = adminListContributions.contributionCount
        this.items = adminListContributions.contributionList
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
}
</script>
