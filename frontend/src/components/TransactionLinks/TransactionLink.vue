<template>
  <div class="transaction-link">
    <b-row class="gradido-custom-background mb-2">
      <b-col cols="2">{{ item.amount | GDD }}</b-col>
      <b-col cols="2">{{ (item.amount - item.holdAvailableAmount) | GDD }}</b-col>
      <b-col cols="4">{{ item.memo }}</b-col>
      <b-col cols="2">{{ $moment(item.validUntil).fromNow() }}</b-col>
      <b-col cols="2">
        <b-button class="mr-2" size="sm" variant="outline-primary" @click="copy">
          {{ $t('gdd_per_link.copy') }}
        </b-button>
        <b-button
          size="sm"
          variant="outline-danger"
          @click="deleteLink(item.id)"
          :title="$t('delete')"
        >
          <b-icon icon="trash"></b-icon>
        </b-button>
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
      this.$bvModal.msgBoxConfirm(this.$t('gdd_per_link.delete-the-link')).then(async (value) => {
        if (value)
          await this.$apollo
            .mutate({
              mutation: deleteTransactionLink,
              variables: {
                id: id,
              },
            })
            .then((result) => {
              this.toastSuccess(this.$t('gdd_per_link.deleted'))
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
