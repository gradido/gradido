<template>
  <div class="transaction-link gradido-custom-background">
    <b-row class="mb-2 pt-2 pb-2">
      <b-col cols="2">
        <type-icon color="text-danger" icon="link45deg" class="pt-4 pl-2" />
      </b-col>
      <b-col cols="9">
        <amount-and-name-row :amount="item.amount" :text="$t('form.amount')" />
        <memo-row :memo="item.memo" />
        <date-row :date="item.validUntil" :diffNow="true" />
        <decay-row :decay="decayObject" />
      </b-col>

      <b-col cols="1" class="text-right">
        <b-button
          class="p-2"
          size="sm"
          variant="outline-primary"
          @click="copy"
          :title="$t('gdd_per_link.copy')"
        >
          <b-icon icon="clipboard"></b-icon>
        </b-button>
        <br />
        <b-button
          class="p-2 mt-3"
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
import TypeIcon from '../TransactionRows/TypeIcon'
import AmountAndNameRow from '../TransactionRows/AmountAndNameRow'
import MemoRow from '../TransactionRows/MemoRow'
import DateRow from '../TransactionRows/DateRow'
import DecayRow from '../TransactionRows/DecayRow'

export default {
  name: 'TransactionLink',
  components: {
    TypeIcon,
    AmountAndNameRow,
    MemoRow,
    DateRow,
    DecayRow,
  },
  props: {
    item: { type: Object, required: true },
  },
  methods: {
    copy() {
      const link = `${window.location.origin}/redeem/${this.item.code}`
      navigator.clipboard
        .writeText(link)
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-copied') + '\n' + link)
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
  computed: {
    decayObject() {
      return { decay: this.item.amount - this.item.holdAvailableAmount }
    },
  },
}
</script>
