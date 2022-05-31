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
            <b-button
              class="test-button-load-more"
              v-if="!pending && transactionLinks.length < transactionLinkCount"
              block
              variant="outline-primary"
              @click="loadMoreLinks"
            >
              {{ buttonText }}
            </b-button>
            <div class="text-center">
              <b-icon v-if="pending" icon="three-dots" animation="cylon" font-scale="4"></b-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import TransactionLink from '@/components/TransactionLinks/TransactionLink.vue'
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
  methods: {
    resetTransactionLinkList() {
      this.$emit('input', 0)
    },
    loadMoreLinks() {
      this.$emit('input', this.value + 1)
    },
  },
  computed: {
    buttonText() {
      const i = this.transactionLinkCount - this.transactionLinks.length
      if (i === 1) return this.$tc('link-load', 0)
      if (i <= this.pageSize) return this.$tc('link-load', 1, { n: i })
      return this.$tc('link-load', 2, { n: this.pageSize })
    },
  },
}
</script>
