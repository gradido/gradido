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
            @update-list-transaction-links="updateListTransactionLinks"
          />
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
  },
  methods: {
    updateListTransactionLinks() {
      this.$emit('update-list-transaction-links')
    },
  },
}
</script>
