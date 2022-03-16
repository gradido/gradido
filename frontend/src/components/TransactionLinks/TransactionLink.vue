<template>
  <div class="transaction-link">
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
      this.$bvModal.msgBoxConfirm('Den Link löschen?').then(async (value) => {
        if (value)
          await this.$apollo
            .mutate({
              mutation: deleteTransactionLink,
              variables: {
                id: id,
              },
            })
            .then((result) => {
              this.toastSuccess('Link gelöscht')
              this.$emit('reset-transaction-link-list')
            })
            .catch((err) => {
              this.toastError(err.message)
            })
      })
    },
  },
}
</script>
