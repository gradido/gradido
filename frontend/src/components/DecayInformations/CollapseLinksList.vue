<template>
  <div class="collapse-links-list">
    <div class="d-flex">
      <div class="w-100">
        <hr />
        <div>
          <transaction-link
            v-for="item in transactionLinks"
            :key="item.id"
            v-bind="item"
            @reset-transaction-link-list="resetTransactionLinkList"
          />
          <div class="mb-3">
            <BButton
              v-if="!pending && transactionLinks.length < transactionLinkCount"
              class="test-button-load-more"
              block
              variant="outline-primary"
              @click="loadMoreLinks"
            >
              {{ buttonText }}
            </BButton>
            <div class="text-center">
              <!--              <b-icon v-if="pending" icon="three-dots" animation="cylon" font-scale="4"></b-icon>-->
              <IBiThreeDots v-if="pending" animation="cylon" font-scale="4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import TransactionLink from '@/components/TransactionLinks/TransactionLink'
export default {
  name: 'CollapseLinksList',
  components: {
    TransactionLink,
  },
  props: {
    transactionLinks: { type: Array, required: true },
    transactionLinkCount: {
      type: Number,
      required: true,
    },
    value: { type: Number, required: true },
    pageSize: { type: Number, default: 5 },
    pending: { type: Boolean, default: false },
  },
  computed: {
    buttonText() {
      const i = this.transactionLinkCount - this.transactionLinks.length
      if (i === 1) return this.$t('link-load', 0)
      if (i <= this.pageSize) return this.$t('link-load', 1, { n: i })
      return this.$t('link-load', 2, { n: this.pageSize })
    },
  },
  methods: {
    resetTransactionLinkList() {
      this.$emit('input', 0)
    },
    loadMoreLinks() {
      this.$emit('input', this.value + 1)
    },
  },
}
</script>
