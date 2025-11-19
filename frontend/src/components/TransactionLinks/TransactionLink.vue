<template>
  <div class="transaction-link gradido-custom-background">
    <BRow :class="{ 'light-gray-text': !validLink }" class="mb-2 pt-2 pb-2">
      <BCol cols="1">
        <variant-icon icon="link45deg" variant="danger" />
      </BCol>
      <BCol cols="11">
        <BRow>
          <BCol>
            <amount-and-name-row :amount="amount" :text="$t('form.amount')" />
            <memo-row :memo="memo" />
            <date-row :date="validUntil" :diff-now="true" :valid-link="validLink" />
            <decay-row :decay="decay" />
          </BCol>
          <BCol cols="12" lg="1" md="1" class="text-center text-md-right pe-5 pe-lg-4">
            <BDropdown no-caret right aria-expanded="false" size="sm">
              <template #button-content>
                <IBiThreeDotsVertical class="link-menu-opener" />
              </template>

              <BDropdownItem v-if="validLink" class="test-copy-text" @click.stop="copyLinkWithText">
                <IBiClipboardPlus />
                {{ $t('gdd_per_link.copy-link-with-text') }}
              </BDropdownItem>
              <BDropdownItem v-if="validLink" class="test-copy-link pt-3" @click.stop="copyLink">
                <IBiClipboard />
                {{ $t('gdd_per_link.copy-link') }}
              </BDropdownItem>
              <BDropdownItem
                v-if="validLink"
                class="pt-3 pb-3 test-qr-code"
                @click.stop="toggleQrModal"
              >
                <IBiQrCode class="filter"></IBiQrCode>
                {{ $t('qrCode') }}
              </BDropdownItem>
              <BDropdownItem class="test-delete-link" @click.stop="toggleDeleteModal">
                <IBiTrash />
                {{ $t('delete') }}
              </BDropdownItem>
            </BDropdown>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
    <app-modal :model-value="showQrModal" @update:model-value="toggleQrModal">
      <BCard header-tag="header" footer-tag="footer">
        <template #header>
          <h6 class="mb-0">{{ $t('qrCode') }}</h6>
        </template>
        <BCardText><figure-qr-code class="text-center" :link="link" /></BCardText>
        <template #footer>
          <em>{{ link }}</em>
        </template>
      </BCard>
    </app-modal>
    <app-modal
      id="delete-link-modal"
      :model-value="showDeleteLinkModal"
      ok-only
      @update:model-value="toggleDeleteModal"
      @on-ok="deleteLink"
    >
      <BCard header-tag="header" footer-tag="footer">
        <h6 class="mb-0">{{ $t('gdd_per_link.delete-the-link') }}</h6>
        <br />
        <em>{{ link }}</em>
      </BCard>
    </app-modal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
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
import AppModal from '@/components/AppModal'
import FigureQrCode from '@/components/QrCode/FigureQrCode'
import VariantIcon from '@/components/VariantIcon.vue'

const props = defineProps({
  holdAvailableAmount: { type: String, required: true },
  id: { type: Number, required: true },
  amount: { type: Number, required: true },
  validUntil: { type: String, required: true },
  link: { type: String, required: true },
  memo: { type: String, required: true },
})

const showQrModal = ref(false)
const showDeleteLinkModal = ref(false)

const emit = defineEmits(['reset-transaction-link-list'])

const { t } = useI18n()
const { toastSuccess, toastError } = useAppToast()
const { copyLink, copyLinkWithText } = useCopyLinks({
  amount: props.amount,
  validUntil: props.validUntil,
  link: props.link,
  memo: props.memo,
})

const { mutate: deleteTransactionLinkMutation } = useMutation(deleteTransactionLink)

const decay = computed(() => `${props.amount - props.holdAvailableAmount}`)
const validLink = computed(() => new Date(props.validUntil) > new Date())

async function deleteLink() {
  try {
    await deleteTransactionLinkMutation({ id: props.id })
    toastSuccess(t('gdd_per_link.deleted'))
    emit('reset-transaction-link-list')
  } catch (err) {
    toastError(err.message)
  }
}

const toggleDeleteModal = () => {
  showDeleteLinkModal.value = !showDeleteLinkModal.value
}

const toggleQrModal = () => {
  showQrModal.value = !showQrModal.value
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
<style scoped>
:deep(.col-1 .icon-variant) {
  margin-top: 1.5rem;
  margin-left: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
}

.light-gray-text {
  color: #adb5bd !important;
}
</style>
