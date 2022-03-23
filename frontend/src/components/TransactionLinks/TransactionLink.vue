<template>
  <div class="transaction-link gradido-custom-background">
    <b-row class="mb-2 pt-2 pb-2">
      <b-col cols="2">
        <type-icon color="text-danger" icon="link45deg" class="pt-4 pl-2" />
      </b-col>
      <b-col cols="9">
        <amount-and-name-row :amount="amount" :text="$t('form.amount')" />
        <memo-row :memo="memo" />
        <date-row :date="validUntil" :diffNow="true" />
        <decay-row :decay="decay" />
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
          class="p-2 mt-1"
          size="sm"
          variant="outline-danger"
          @click="deleteLink()"
          :title="$t('delete')"
        >
          <b-icon icon="trash"></b-icon>
        </b-button>
        <br />
        <b-button
          @click="$bvModal.show('modalPopover-' + id)"
          class="p-2 mt-1"
          size="sm"
          variant="outline-success"
        >
          <b-img src="img/svg/qr-code.svg"></b-img>
        </b-button>
      </b-col>
    </b-row>
    <b-modal :id="'modalPopover-' + id" title="QR-Code" ok-only :hideHeaderClose="false">
      <div class="text-center">
        <figure class="qrcode">
          <vue-qrcode :value="link" type="image/png" class="qrbox"></vue-qrcode>
          <img class="qrcode__image" src="img/gdd-coin.png" alt="GDD" />
        </figure>
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
import VueQrcode from 'vue-qrcode'

export default {
  name: 'TransactionLink',
  components: {
    TypeIcon,
    AmountAndNameRow,
    MemoRow,
    DateRow,
    DecayRow,
    VueQrcode,
  },
  props: {
    amount: { type: String, required: true },
    code: { type: String, required: true },
    holdAvailableAmount: { type: String, required: true },
    id: { type: Number, required: true },
    memo: { type: String, required: true },
    validUntil: { type: String, required: true },
  },
  data() {
    return {
      link: `${window.location.origin}/redeem/${this.code}`,
    }
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
  },
}
</script>
<style scoped>
.qrcode {
  display: inline-block;
  font-size: 0;
  margin-bottom: 0;
  position: relative;
}
.qrbox {
  width: 400px;
}
.qrcode__image {
  background-color: #fff;
  border: 0.25rem solid #fff;
  border-radius: 0.25rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.25);
  height: 15%;
  left: 50%;
  overflow: hidden;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 15%;
}
</style>
