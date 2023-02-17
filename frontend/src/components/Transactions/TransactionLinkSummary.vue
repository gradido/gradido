<template>
  <div class="transaction-slot-link">
    <b-row @click="showTransactionLinks()" class="align-items-center">
      <b-col cols="3" lg="2" md="2">
        <b-avatar icon="link" variant="light" :size="42"></b-avatar>
      </b-col>
      <b-col>
        <div>{{ $t('gdd_per_link.links_sum') }}</div>
        <div class="small">{{ transactionLinkCount }} {{ $t('gdd_per_link.links_sum') }}</div>
      </b-col>
      <b-col cols="8" lg="3" md="3" sm="8" offset="3" offset-md="0" offset-lg="0">
        <div class="small mb-2">{{ $t('send_per_link') }}</div>
        <div class="font-weight-bold">{{ amount | GDD }}</div>
      </b-col>
      <b-col cols="12" md="1" lg="1" class="text-right">
        <collapse-icon class="text-right" :visible="visible" />
      </b-col>
    </b-row>
    <b-collapse v-model="visible">
      <collapse-links-list
        v-model="currentPage"
        :pending="pending"
        :pageSize="pageSize"
        :transactionLinkCount="transactionLinkCount"
        :transactionLinks="transactionLinks"
      />
    </b-collapse>
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import CollapseLinksList from '../DecayInformations/CollapseLinksList'
import { listTransactionLinks } from '@/graphql/queries'

export default {
  name: 'TransactionSlotLink',
  components: {
    CollapseIcon,
    CollapseLinksList,
  },
  props: {
    amount: {
      type: String,
      required: true,
    },
    decay: {
      type: Object,
      required: true,
    },
    transactionLinkCount: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      visible: false,
      transactionLinks: [],
      currentPage: 1,
      pageSize: 5,
      pending: false,
    }
  },
  methods: {
    showTransactionLinks() {
      if (this.visible) {
        this.visible = false
      } else {
        this.transactionLinks = []
        if (this.currentPage === 1) {
          this.updateListTransactionLinks()
        } else {
          this.currentPage = 1
        }
        this.visible = true
      }
    },
    async updateListTransactionLinks() {
      if (this.currentPage === 0) {
        this.transactionLinks = []
        this.currentPage = 1
      } else {
        this.pending = true
        this.$apollo
          .query({
            query: listTransactionLinks,
            variables: {
              currentPage: this.currentPage,
            },
            fetchPolicy: 'network-only',
          })
          .then((result) => {
            this.transactionLinks.links = [
              ...this.transactionLinks,
              ...result.data.listTransactionLinks.links,
            ]
            this.$emit('update-transactions')
            this.pending = false
          })
          .catch((err) => {
            this.toastError(err.message)
            this.pending = false
          })
      }
    },
  },
  watch: {
    currentPage() {
      this.updateListTransactionLinks()
    },
  },
}
</script>
