<template>
  <div class="transaction-link gradido-custom-background">
    <BRow :class="validLink ? '' : 'bg-muted text-light'" class="mb-2 pt-2 pb-2">
      <BCol cols="1">
        <type-icon color="text-danger" icon="link45deg" class="pt-4 pl-2" />
      </BCol>
      <BCol cols="11">
        <BRow>
          <BCol>
            <amount-and-name-row :amount="amount" :text="$t('form.amount')" />
            <memo-row :memo="memo" />
            <date-row :date="validUntil" :diff-now="true" :valid-link="validLink" />
            <decay-row :decay="decay" />
          </BCol>
          <BCol cols="12" lg="1" md="1" class="text-center text-md-right pr-5 pr-lg-4">
            <BDropdown no-caret right aria-expanded="false" size="sm">
              <template #button-content>
                <IBiThreeDotsVertical />
              </template>

              <BDropdownItem v-if="validLink" class="test-copy-link" @click="copyToClipboard">
                <IBiClipboard />
                {{ $t('gdd_per_link.copy-link') }}
              </BDropdownItem>
              <BDropdownItem v-if="validLink" class="test-copy-text pt-3" @click="copyLinkWithText">
                <IBiClipboardPlus />
                {{ $t('gdd_per_link.copy-link-with-text') }}
              </BDropdownItem>
              <BDropdownItem
                v-if="validLink"
                class="pt-3 pb-3 test-qr-code"
                @click="$bvModal.show('modalPopover-' + id)"
              >
                <BImg src="img/svg/qr-code.svg" width="18" class="filter"></BImg>
                {{ $t('qrCode') }}
              </BDropdownItem>
              <BDropdownItem class="test-delete-link" @click="deleteLink()">
                <IBiTrash />
                {{ $t('delete') }}
              </BDropdownItem>
            </BDropdown>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
    <BModal :id="'modalPopover-' + id" ok-only hide-header-close>
      <BCard header-tag="header" footer-tag="footer">
        <template #header>
          <h6 class="mb-0">{{ $t('qrCode') }}</h6>
        </template>
        <BCardText><figure-qr-code class="text-center" :link="link" /></BCardText>
        <template #footer>
          <em>{{ link }}</em>
        </template>
      </BCard>
    </BModal>
    <BModal :id="'modalPopoverCopyError' + id" ok-only hide-header-close>
      <BCard header-tag="header" footer-tag="footer">
        <BCardText>
          <div class="alert-danger p-3">{{ $t('gdd_per_link.not-copied') }}</div>
          <div class="alert-muted h3 p-3">{{ link }}</div>
        </BCardText>
      </BCard>
    </BModal>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { useCopyLinks } from '@/composables/useCopyLinks'
import { deleteTransactionLink } from '@/graphql/mutations'
import TypeIcon from '../TransactionRows/TypeIcon'
import AmountAndNameRow from '../TransactionRows/AmountAndNameRow'
import MemoRow from '../TransactionRows/MemoRow'
import DateRow from '../TransactionRows/DateRow'
import DecayRow from '../TransactionRows/DecayRow'
import FigureQrCode from '@/components/QrCode/FigureQrCode'
import { useModal } from 'bootstrap-vue-next'

const props = defineProps({
  holdAvailableAmount: { type: String, required: true },
  id: { type: Number, required: true },
  amount: { type: Number, required: true },
  validUntil: { type: String, required: true },
  link: { type: String, required: true },
  memo: { type: String, required: true },
})

const emit = defineEmits(['reset-transaction-link-list'])

const { t } = useI18n()
const { toastSuccess, toastError } = useAppToast()
const { copyToClipboard, copyLinkWithText } = useCopyLinks({
  amount: props.amount,
  validUntil: props.validUntil,
  link: props.link,
  memo: props.memo,
})
const { showConfirmModal } = useModal()

const { mutate: deleteTransactionLinkMutation } = useMutation(deleteTransactionLink)

const decay = computed(() => `${props.amount - props.holdAvailableAmount}`)
const validLink = computed(() => new Date(props.validUntil) > new Date())

async function deleteLink() {
  const confirmed = await showConfirmModal(t('gdd_per_link.delete-the-link'))
  if (confirmed) {
    try {
      await deleteTransactionLinkMutation({ id: props.id })
      toastSuccess(t('gdd_per_link.deleted'))
      emit('reset-transaction-link-list')
    } catch (err) {
      toastError(err.message)
    }
  }
}

// Expose necessary methods and computed properties
// defineExpose({
//   deleteLink,
//   decay,
//   validLink,
//   copyToClipboard,
// })
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
