<template>
  <div class="collapse-links-list">
    <div class="d-flex">
      <div class="text-center pb-3 gradido-max-width">
        <div>
          <b-row class="gradido-custom-background mb-2">
            <b-col cols="2"><b>Betrag</b></b-col>
            <b-col cols="2"><b>Vergänglichkeit</b></b-col>
            <b-col cols="4"><b>Nachricht</b></b-col>
            <b-col cols="2"><b>Abgelaufen</b></b-col>
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
              variant="primary"
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
      if (this.transactionLinkCount - this.value.itemsShown > this.value.pageSize)
        return 'weitere ' + this.value.pageSize + ' Links Nachladen'
      return (
        'die letzten ' + (this.transactionLinkCount - this.value.itemsShown) + ' Links nachladen'
      )
    },
  },
}
</script>
