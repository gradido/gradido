<template>
  <div class="transaction-slot-link gradido-shadow-inset">
    <div>
      <div class="transaction-link-details" @click="showTransactionLinks()">
        <!-- Collaps Icon  -->
        <collapse-icon class="text-right" :visible="visible" />
        <div>
          <b-row>
            <b-col cols="1">
              <type-icon color="text-danger" icon="link45deg" />
            </b-col>

            <b-col cols="11">
              <!-- Amount / Name || Text -->
              <amount-and-name-row :amount="amount" :text="$t('gdd_per_link.links_sum')" />

              <!-- Count Links -->
              <link-count-row :count="transactionLinkCount" />

              <!-- Decay -->
              <decay-row :decay="decay.decay" />
            </b-col>
          </b-row>
        </div>
      </div>

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
  </div>
</template>
<script>
import CollapseIcon from '../TransactionRows/CollapseIcon'
import TypeIcon from '../TransactionRows/TypeIcon'
import AmountAndNameRow from '../TransactionRows/AmountAndNameRow'
import LinkCountRow from '../TransactionRows/LinkCountRow'
import DecayRow from '../TransactionRows/DecayRow'
import CollapseLinksList from '../DecayInformations/CollapseLinksList'
import { listTransactionLinks } from '@/graphql/queries'

export default {
  name: 'TransactionSlotLink',
  components: {
    CollapseIcon,
    TypeIcon,
    AmountAndNameRow,
    LinkCountRow,
    DecayRow,
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
            this.transactionLinks = [...this.transactionLinks, ...result.data.listTransactionLinks]
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
