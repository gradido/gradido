<template>
  <div class="transaction-link gradido-custom-background">
    <b-row :class="validLink ? '' : 'bg-muted text-light'" class="mb-2 pt-2 pb-2">
      <b-col cols="1">
        <type-icon color="text-danger" icon="link45deg" class="pt-4 pl-2" />
      </b-col>
      <b-col cols="11">
        <b-row>
          <b-col>
            <amount-and-name-row :amount="amount" :text="$t('form.amount')" />
            <memo-row :memo="memo" />
            <date-row :date="validUntil" :diffNow="true" :validLink="validLink" />
            <decay-row :decay="decay" />
          </b-col>
          <b-col cols="12" lg="1" md="1" class="text-center text-md-right pr-5 pr-lg-4">
            <b-dropdown no-caret right aria-expanded="false" size="sm">
              <template #button-content>
                <b-icon icon="three-dots-vertical"></b-icon>
              </template>

              <b-dropdown-item v-if="validLink" class="test-copy-link" @click="copyLink">
                <b-icon icon="clipboard"></b-icon>
                {{ $t('gdd_per_link.copy-link') }}
              </b-dropdown-item>
              <b-dropdown-item
                v-if="validLink"
                class="test-copy-text pt-3"
                @click="copyLinkWithText"
              >
                <b-icon icon="clipboard-plus"></b-icon>
                {{ $t('gdd_per_link.copy-link-with-text') }}
              </b-dropdown-item>
              <b-dropdown-item
                v-if="validLink"
                @click="$bvModal.show('modalPopover-' + id)"
                class="pt-3 pb-3 test-qr-code"
              >
                <b-img src="img/svg/qr-code.svg" width="18" class="filter"></b-img>
                {{ $t('qrCode') }}
              </b-dropdown-item>
              <b-dropdown-item class="test-delete-link" @click="deleteLink()">
                <b-icon icon="trash"></b-icon>
                {{ $t('delete') }}
              </b-dropdown-item>
            </b-dropdown>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    <b-modal :id="'modalPopover-' + id" ok-only hide-header-close>
      <b-card header-tag="header" footer-tag="footer">
        <template #header>
          <h6 class="mb-0">{{ $t('qrCode') }}</h6>
        </template>
        <b-card-text><figure-qr-code class="text-center" :link="link" /></b-card-text>
        <template #footer>
          <em>{{ link }}</em>
        </template>
      </b-card>
    </b-modal>
    <b-modal :id="'modalPopoverCopyError' + id" ok-only hide-header-close>
      <b-card header-tag="header" footer-tag="footer">
        <b-card-text>
          <div class="alert-danger p-3">{{ $t('gdd_per_link.not-copied') }}</div>
          <div class="alert-muted h3 p-3">{{ link }}</div>
        </b-card-text>
      </b-card>
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
import FigureQrCode from '@/components/QrCode/FigureQrCode'
import { copyLinks } from '../../mixins/copyLinks'

export default {
  name: 'TransactionLink',
  mixins: [copyLinks],
  components: {
    TypeIcon,
    AmountAndNameRow,
    MemoRow,
    DateRow,
    DecayRow,
    FigureQrCode,
  },
  props: {
    holdAvailableAmount: { type: String, required: true },
    id: { type: Number, required: true },
  },
  methods: {
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
    validLink() {
      return new Date(this.validUntil) > new Date()
    },
  },
}
</script>
<style>
.qr-button {
  position: relative;
  right: 20px;
}
.filter {
  filter: opacity(0.6);
}
</style>
