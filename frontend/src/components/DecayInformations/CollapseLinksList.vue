<template>
  <div class="collapse-links-list">
    <div class="d-flex">
      <div class="gradido-max-width">
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
              v-if="!value.pending && value.itemsShown < transactionLinkCount"
              block
              variant="outline-primary"
              @click="loadMoreLinks"
            >
              {{ buttonText }}
            </b-button>
            <b-icon
              v-if="value.pending"
              icon="three-dots"
              animation="cylon"
              font-scale="4"
            ></b-icon>
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
    value: { type: Object, required: true },
  },
  methods: {
    resetTransactionLinkList() {
      this.$emit('input', { ...this.value, currentPage: 0 })
    },
    loadMoreLinks() {
      this.$emit('input', { ...this.value, currentPage: this.value.currentPage + 1 })
    },
  },
  computed: {
    buttonText() {
      const i = this.transactionLinkCount - this.value.itemsShown
      if (i === 1) return this.$tc('link-load', 0)
      if (i <= this.value.pageSize) return this.$tc('link-load', 1, { n: i })
      return this.$tc('link-load', 2, { n: this.value.pageSize })
    },
  },
}
</script>
