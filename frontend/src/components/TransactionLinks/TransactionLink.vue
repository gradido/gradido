<template>
  <div class="transaction-link">
    <!-- 
        { "id": "1"
          "amount": "11", 
          "holdAvailableAmount": 
          "11.28840866470862043644", 
          "memo": "asdas das d", 
          "code": "d9cc2a3a685ab17f8cd91d46", 
          "createdAt": "2022-03-15T09:11:53.000Z", 
          "validUntil": "2022-03-29T09:11:53.000Z", 
          "redeemedAt": null,  
    -->
    <b-row class="gradido-custom-background mb-2">
      <b-col cols="2">{{ item.amount | GDD }}</b-col>
      <b-col cols="2">{{ (item.amount - item.holdAvailableAmount) | GDD }}</b-col>
      <b-col cols="4">{{ item.memo }}</b-col>
      <b-col cols="2">{{ $moment(item.validUntil).fromNow() }}</b-col>
      <b-col cols="2">
        <b-button size="sm" variant="primary" @click="copy">kopieren</b-button>
        <b-button size="sm" variant="danger" @click="deleteLink(item.id)">löschen</b-button>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import { deleteTransactionLink } from '@/graphql/mutations'

export default {
  name: 'TransactionLink',
  props: {
    item: { type: Object, required: true },
  },
  methods: {
    async deleteTransactionLink(id) {
      await this.$apollo
        .mutate({
          mutation: deleteTransactionLink,
          variables: {
            id: id,
          },
        })
        .then((result) => {
          this.toastSuccess('Link gelöscht')
          this.$emit('update-list-transaction-links')
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
    copy() {
      const link = `${window.location.origin}/redeem/${this.item.code}`
      navigator.clipboard
        .writeText(link)
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-copied'))
        })
        .catch(() => {
          this.toastError(this.$t('gdd_per_link.not-copied'))
        })
    },
    deleteLink(id) {
      this.$bvModal
        .msgBoxConfirm('Den Link löschen?')
        .then(() => {
          this.deleteTransactionLink(id)
        })
        .catch(() => {})
    },
  },
}
</script>
