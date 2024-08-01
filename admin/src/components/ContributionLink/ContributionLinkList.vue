<template>
  <div class="contribution-link-list">
    <BTable :items="props.items" :fields="fields" striped hover stacked="lg">
      <template #cell(delete)="data">
        <BButton
          variant="danger"
          size="md"
          class="mr-2 test-delete-link"
          @click="handleDelete(data)"
        >
          <IBiTrash />
        </BButton>
      </template>
      <template #cell(edit)="data">
        <BButton variant="success" size="md" class="mr-2" @click="editContributionLink(data.item)">
          <IBiPencil />
        </BButton>
      </template>
      <template #cell(show)="data">
        <BButton
          variant="info"
          size="md"
          class="mr-2 test-show"
          @click="showContributionLink(data.item)"
        >
          <IBiEye />
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
import { ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { deleteContributionLink } from '@/graphql/deleteContributionLink.js'
import FigureQrCode from '../FigureQrCode'
import { useModal } from 'bootstrap-vue-next'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})

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

const fields = ref([
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
  'delete',
  'edit',
  'show',
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

defineExpose({
  fields,
  modalData,
  deleteContributionLink,
  editContributionLink,
  showContributionLink,
})
</script>
