<template>
  <div class="transaction-slot-link">
    <div @click="visible = !visible">
      <!-- Collaps Icon  -->
      <collapse-icon class="text-right" :visible="visible" />
      <div>
        <b-row>
          <!-- ICON  -->
          <b-col cols="1">
            <type-icon color="text-danger" icon="link45deg" />
          </b-col>

          <b-col cols="11">
            <!-- Amount / Name || Text -->
            <amount-and-name-row :amount="amount" :text="$t('gdd_per_link.links_sum')" />

            <!-- Count Links -->
            <link-count-row :count="transactionLinkCount" />

            <!-- Decay -->
            <decay-row :decay="decay" />
          </b-col>
        </b-row>
      </div>

      <b-collapse :class="visible ? 'bg-secondary' : ''" class="pb-4 pt-5" v-model="visible">
        <collapse-links-list :transactionLinks="transactionLinks" />
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
    }
  },
  methods: {
    async listTransactionLinks(pagination) {
      this.$apollo
        .query({
          query: listTransactionLinks,
          variables: {
            currentPage: 1,
            pageSize: 5,
          },
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.transactionLinks = result.data
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
  },
  created() {
    this.listTransactionLinks()
  },
}
</script>
