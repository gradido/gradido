<template>
  <div class="contribution-link-list">
    <BTable :items="props.items" :fields="fields" striped hover stacked="lg">
      <template #cell(delete)="data">
        <BButton
          variant="danger"
          size="md"
          class="me-2 test-delete-link"
          @click="handleDelete(data)"
        >
          <IBiTrash />
        </BButton>
      </template>
      <template #cell(edit)="data">
        <BButton variant="success" size="md" class="me-2" @click="editContributionLink(data.item)">
          <IBiPencil />
        </BButton>
      </template>
      <template #cell(show)="data">
        <BButton
          variant="info"
          size="md"
          class="me-2 test-show"
          @click="showContributionLink(data.item)"
        >
          <IBiEye />
        </BButton>
      </template>
      <template #cell(cheque)="data">
        <BButton
          variant="secondary"
          size="md"
          class="me-2 test-download-cheque"
          :title="t('thank-you-cheque.download')"
          :aria-label="t('thank-you-cheque.download')"
          @click="downloadCheque(data.item)"
        >
          <IBiDownload />
        </BButton>
      </template>
    </BTable>

    <BModal
      v-if="modalData"
      id="qr-link-modal"
      ref="my-modal"
      v-model="qrLinkModal"
      ok-only
      hide-header-close
    >
      <BCard header-tag="header" footer-tag="footer">
        <template #header>
          <h6 class="mb-0">{{ modalData ? modalData.name : '' }}</h6>
        </template>
        <BCardText>
          {{ modalData.memo ? modalData.memo : '' }}
          <figure-qr-code :link="modalData ? modalData.link : ''" />
        </BCardText>
        <template #footer>
          <em>{{ modalData ? modalData.link : '' }}</em>
        </template>
      </BCard>
    </BModal>
    <BModal id="delete-link-modal" v-model="deleteLinkModal" @ok="executeDelete">
      <template #default>
        {{ t('contributionLink.deleteNow', { name: itemToBeDeleted.name }) }}
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { deleteContributionLink } from '@/graphql/deleteContributionLink.js'
import FigureQrCode from '../FigureQrCode'
import { useModal } from 'bootstrap-vue-next'
import { useI18n } from 'vue-i18n'
import CONFIG from '@/config'
import { useAppToast } from '@/composables/useToast'
import { useIsAdmin } from '@/composables/useIsAdmin'
import { renderQrCodeCanvas } from '@/utils/qrCode'
import { drawCheque, chequeFileName } from '@/utils/thankYouCheque'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const isAdmin = useIsAdmin()

const qrLinkModal = ref(false)
const { show: showQrCodeModal } = useModal('qr-link-modal')

const deleteLinkModal = ref(false)
const { show: showDeleteLinkModal } = useModal('delete-link-modal')

const emit = defineEmits([
  'close-contribution-form',
  'get-contribution-links',
  'edit-contribution-link-data',
])

const { t, d } = useI18n()
const { toastError, toastSuccess } = useAppToast()

const modalData = ref({})

const fields = computed(() => [
  'name',
  'memo',
  'amount',
  { key: 'cycle', label: t('contributionLink.cycle') },
  { key: 'maxPerCycle', label: t('contributionLink.maxPerCycle') },
  {
    key: 'validFrom',
    label: t('contributionLink.validFrom'),
    formatter: (value) => (value ? d(new Date(value)) : ''),
  },
  {
    key: 'validTo',
    label: t('contributionLink.validTo'),
    formatter: (value) => (value ? d(new Date(value)) : ''),
  },
  ...(isAdmin.value ? ['delete', 'edit'] : []),
  'show',
  'cheque',
])

const { mutate: deleteContributionLinkMutation } = useMutation(deleteContributionLink)

const itemToBeDeleted = ref({})

const handleDelete = async (dataPayload) => {
  itemToBeDeleted.value = { ...dataPayload.item }
  showDeleteLinkModal()
}

const executeDelete = async () => {
  try {
    await deleteContributionLinkMutation({ id: parseInt(itemToBeDeleted.value.id) })
    toastSuccess(t('contributionLink.deleted'))
    emit('close-contribution-form')
    emit('get-contribution-links')
    itemToBeDeleted.value = {}
  } catch (err) {
    toastError(err.message)
  }
}

const editContributionLink = (row) => {
  emit('edit-contribution-link-data', row)
}

const showContributionLink = (row) => {
  modalData.value = row
  showQrCodeModal()
}

// The sentence names both ends of the validity, so it can only be printed when both
// dates are set. A link without them runs open ended, and a cheque that says nothing
// about validity is closer to the truth than one that prints half a sentence.
const validLine = ({ validFrom, validTo }) =>
  validFrom && validTo
    ? t('thank-you-cheque.starting-credit-valid', {
        from: d(new Date(validFrom), 'short'),
        to: d(new Date(validTo), 'short'),
      })
    : ''

// Turns a contribution link into the printable starting bonus cheque. The QR code is
// rendered off screen because this button sits in the table row, where the modal with
// the code on it is closed.
const downloadCheque = async (row) => {
  try {
    const image = await drawCheque({
      kind: 'startingBonus',
      community: CONFIG.COMMUNITY_NAME,
      headline: t('thank-you-cheque.starting-credit', { amount: row.amount }),
      memo: row.memo,
      hintLine: t('thank-you-cheque.scan-qr'),
      validLine: validLine(row),
      qrCanvas: await renderQrCodeCanvas(row.link),
    })
    const anchor = document.createElement('a')
    anchor.href = image
    anchor.download = chequeFileName(row.name, row.amount)
    anchor.click()
  } catch (error) {
    // The cheque is drawn on click, from pictures the wallet serves. If one of them
    // fails to load, that must not stay silent.
    toastError(error.message)
  }
}

defineExpose({
  fields,
  modalData,
  deleteContributionLink,
  editContributionLink,
  showContributionLink,
  downloadCheque,
})
</script>
