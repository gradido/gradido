<template>
  <div class="collapse-links-list">
    <div class="d-flex">
      <div class="text-center pb-3 gradido-max-width">
        <div>
          <b-row class="gradido-custom-background mb-2">
            <b-col cols="2">
              <b>{{ $t('form.amount') }}</b>
            </b-col>
            <b-col cols="2">
              <b>{{ $t('decay.decay') }}</b>
            </b-col>
            <b-col cols="4">
              <b>{{ $t('form.memo') }}</b>
            </b-col>
            <b-col cols="2">
              <b>{{ $t('gdd_per_link.expired') }}</b>
            </b-col>
            <b-col cols="2"></b-col>
          </b-row>
          <transaction-link
            v-for="item in transactionLinks"
            :key="item.id"
            v-bind:item="item"
            @reset-transaction-link-list="resetTransactionLinkList"
          />
          <div class="mt-3 mb-3 text-center">
            <b-button
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
      if (i === 1) return this.$tc('link-reload', i, { n: i })
      if (i < 6) return this.$tc('link-reload', 2, { n: i })
      return this.$tc('link-reload', 3, { n: 5 })
    },
  },
}
</script>
