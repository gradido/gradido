<template>
  <div class="collapse-links-list">
    <div class="d-flex">
      <div class="w-100">
        <hr />
        <div>
          <transaction-link
            v-for="item in transactionLinks"
            v-bind="item"
            :key="item.id"
            @reset-transaction-link-list="resetTransactionLinkList"
          />
          <div class="mb-3">
            <BButton
              v-if="!pending && transactionLinks.length < transactionLinkCount"
              class="test-button-load-more w-100 rounded-5"
              block
              variant="outline-primary"
              @click.stop="loadMoreLinks"
            >
              {{ buttonText }}
            </BButton>
            <div class="text-center">
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
      if (i <= this.pageSize) return this.$t('link-load', { n: i })
      return this.$t('link-load-more', { n: this.pageSize })
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
