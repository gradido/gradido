<template>
  <div class="transaction-link gradido-custom-background">
    <b-row class="mb-2 pt-2 pb-2">
      <b-col lg="2">
        <type-icon color="text-danger" icon="link45deg" class="pt-4 pl-2" />
      </b-col>
      <b-col lg="9" md="9">
        <b-row>
          <b-col lg="11" md="10">
            <amount-and-name-row :amount="amount" :text="$t('form.amount')" />
            <memo-row :memo="memo" />
            <date-row :date="validUntil" :diffNow="true" />
            <decay-row :decay="decay" />
          </b-col>
          <b-col lg="1" md="2" class="text-center text-lg-left qr-button">
            <b-button
              @click="$bvModal.show('modalPopover-' + id)"
              class="p-2 test-qr-code"
              size="sm"
              variant="outline-success"
            >
              <b-img src="img/svg/qr-code.svg" width="60"></b-img>
            </b-button>
          </b-col>
        </b-row>
      </b-col>

      <b-col lg="1" md="1" class="text-center text-lg-right">
        <b-button
          class="p-2 test-copy-link"
          size="sm"
          variant="outline-primary"
          @click="copy"
          :title="$t('gdd_per_link.copy')"
        >
          <b-icon icon="clipboard"></b-icon>
        </b-button>
        <br />
        <b-button
          class="p-2 test-delete-link"
          size="sm"
          variant="outline-danger"
          @click="deleteLink()"
          :title="$t('delete')"
        >
          <b-icon icon="trash"></b-icon>
        </b-button>
      </b-col>
    </b-row>
    <b-modal :id="'modalPopover-' + id" title="QR-Code" ok-only hide-header-close>
      <div class="text-center">
        <figure-qr-code :text="link" />
        <p>{{ link }}</p>
      </div>
    </b-modal>
  </div>
</template>
<script>
import { deleteTransactionLink } from '@/graphql/mutations'
import TypeIcon from '../TransactionRows/TypeIcon'
import AmountAndNameRow from '../TransactionRows/AmountAndNameRow'
import MemoRow from '../TransactionRows/MemoRow'
import DateRow from '../TransactionRows/DateRow'
import DecayRow from '../TransactionRows/DecayRow'
import FigureQrCode from '@/components/QrCode/FigureQrCode.vue'

export default {
  name: 'TransactionLink',
  components: {
    TypeIcon,
    AmountAndNameRow,
    MemoRow,
    DateRow,
    DecayRow,
    FigureQrCode,
  },
  props: {
    amount: { type: String, required: true },
    code: { type: String, required: true },
    holdAvailableAmount: { type: String, required: true },
    id: { type: Number, required: true },
    memo: { type: String, required: true },
    validUntil: { type: String, required: true },
  },
  methods: {
    copy() {
      navigator.clipboard
        .writeText(this.link)
        .then(() => {
          this.toastSuccess(this.$t('gdd_per_link.link-copied'))
        })
        .catch(() => {
          this.toastError(this.$t('gdd_per_link.not-copied'))
        })
    },
    deleteLink() {
      this.$bvModal.msgBoxConfirm(this.$t('gdd_per_link.delete-the-link')).then(async (value) => {
        if (value)
          await this.$apollo
            .mutate({
              mutation: deleteTransactionLink,
              variables: {
                id: this.id,
              },
            })
            .then(() => {
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
    decay() {
      return `${this.amount - this.holdAvailableAmount}`
    },
    link() {
      return `${window.location.origin}/redeem/${this.code}`
    },
  },
}
</script>
<style>
.qr-button {
  position: relative;
  right: 20px;
}
</style>
