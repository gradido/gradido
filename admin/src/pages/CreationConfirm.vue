<!-- eslint-disable @intlify/vue-i18n/no-dynamic-keys -->
<template>
  <div class="creation-confirm">
    <user-query v-model="query" class="mb-2 mt-2" :placeholder="$t('user_memo_search')" />
    <p class="mb-2">
      <input v-model="noHashtag" type="checkbox" class="noHashtag" />
      <span v-b-tooltip="$t('no_hashtag_tooltip')" class="ms-2">{{ $t('no_hashtag') }}</span>
    </p>
    <p v-if="showResubmissionCheckbox" class="mb-4">
      <input v-model="hideResubmissionModel" type="checkbox" class="hideResubmission" />
      <span v-b-tooltip="$t('hide_resubmission_tooltip')" class="ms-2">
        {{ $t('hide_resubmission') }}
      </span>
    </p>
    <div>
      <BTabs v-model="tabIndex" content-class="mt-3" fill>
        <BTab active :title-link-attributes="{ 'data-test': 'open' }">
          <template #title>
            <IBiBellFill style="color: #0d6efd" />
            {{ $t('contributions.open') }}
            <BBadge v-if="$store.state.openCreations > 0" variant="danger">
              {{ $store.state.openCreations }}
            </BBadge>
          </template>
        </BTab>
        <BTab :title-link-attributes="{ 'data-test': 'confirmed' }">
          <template #title>
            <IBiCheck style="color: #198754" />
            {{ $t('contributions.confirms') }}
          </template>
        </BTab>
        <BTab :title-link-attributes="{ 'data-test': 'denied' }">
          <template #title>
            <IBiXCircle style="color: #ffc107" />
            {{ $t('contributions.denied') }}
          </template>
        </BTab>
        <BTab :title-link-attributes="{ 'data-test': 'deleted' }">
          <template #title>
            <IBiTrash style="color: #dc3545" />
            {{ $t('contributions.deleted') }}
          </template>
        </BTab>
        <BTab :title-link-attributes="{ 'data-test': 'all' }">
          <template #title>
            <IBiList />
            {{ $t('contributions.all') }}
          </template>
        </BTab>
      </BTabs>
    </div>
    <open-creations-table
      class="mt-4"
      :items="items"
      :fields="fields"
      :hide-resubmission="hideResubmission"
      @show-overlay="showOverlay"
      @update-status="updateStatus"
      @reload-contribution="reloadContribution"
      @update-contributions="refetch"
      @search-for-email="query = $event"
    />

    <BPagination
      v-model="currentPage"
      pills
      size="lg"
      :per-page="pageSize"
      :total-rows="rows"
      align="center"
      :hide-ellipsis="true"
    />
    <ai-chat v-if="CONFIG.OPENAI_ACTIVE && isAiUser" />
    <div v-if="overlay" id="overlay" @dblclick="overlay = false">
      <Overlay :item="item" @overlay-cancel="overlay = false">
        <template #title>
          {{ $t(overlayTitle) }}
        </template>
        <template #text>
          <p>{{ $t(overlayText) }}</p>
        </template>
        <template #question>
          <p>{{ $t(overlayQuestion) }}</p>
        </template>
        <template #submit-btn>
          <BButton size="md" :variant="overlayIcon" class="m-3 text-end" @click="overlayEvent">
            {{ $t(overlayBtnText) }}
          </BButton>
        </template>
      </Overlay>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

import Overlay from '../components/Overlay'
import OpenCreationsTable from '../components/Tables/OpenCreationsTable'
import UserQuery from '../components/UserQuery'
import AiChat from '../components/AiChat'
import { adminListContributions } from '../graphql/adminListContributions.graphql'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { confirmContribution } from '../graphql/confirmContribution'
import { denyContribution } from '../graphql/denyContribution'
import { getContribution } from '../graphql/getContribution'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'

const FILTER_TAB_MAP = [
  ['IN_PROGRESS', 'PENDING'],
  ['CONFIRMED'],
  ['DENIED'],
  ['DELETED'],
  ['IN_PROGRESS', 'PENDING', 'CONFIRMED', 'DENIED', 'DELETED'],
]

const store = useStore()
const { t } = useI18n()
const { toastError, toastSuccess } = useAppToast()

const tabIndex = ref(0)
const items = ref([])
const overlay = ref(false)
const item = ref({})
const variant = ref('confirm')
const rows = ref(0)
const currentPage = ref(1)
const pageSize = ref(25)
const query = ref('')
const noHashtag = ref(null)
const hideResubmissionModel = ref(true)

const formatDateOrDash = (value) => (value ? new Date(value).toLocaleDateString() : '—')

const baseFields = {
  firstName: { key: 'user.firstName', label: t('firstname'), class: 'no-select' },
  lastName: { key: 'user.lastName', label: t('lastname'), class: 'no-select' },
  amount: { key: 'amount', label: t('creation'), formatter: (value) => value + ' GDD' },
  memo: { key: 'memo', label: t('text'), class: 'text-break' },
  contributionDate: {
    key: 'contributionDate',
    label: t('created'),
    class: 'no-select',
    formatter: formatDateOrDash,
  },
  createdAt: {
    key: 'createdAt',
    label: t('createdAt'),
    class: 'no-select',
    formatter: formatDateOrDash,
  },
  confirmedAt: {
    key: 'confirmedAt',
    label: t('contributions.confirms'),
    class: 'no-select',
    formatter: formatDateOrDash,
  },
  confirmedByUserName: {
    key: 'confirmedByUserName',
    label: t('moderator.who'),
    class: 'no-select',
  },
}

const fields = computed(
  () =>
    [
      // open contributions
      [
        { key: 'bookmark', label: t('delete') },
        { key: 'deny', label: t('deny') },
        baseFields.firstName,
        baseFields.lastName,
        baseFields.amount,
        baseFields.memo,
        baseFields.contributionDate,
        { key: 'moderatorUserName', label: t('moderator.who'), class: 'no-select' },
        { key: 'editCreation', label: t('details') },
        { key: 'confirm', label: t('save') },
      ],
      // confirmed contributions
      [
        baseFields.firstName,
        baseFields.lastName,
        baseFields.amount,
        baseFields.memo,
        baseFields.contributionDate,
        baseFields.createdAt,
        baseFields.confirmedAt,
        baseFields.confirmedByUserName,
        { key: 'chatCreation', label: t('details') },
      ],
      // denied contributions
      [
        baseFields.firstName,
        baseFields.lastName,
        baseFields.amount,
        baseFields.memo,
        baseFields.contributionDate,
        baseFields.createdAt,
        {
          key: 'deniedAt',
          label: t('contributions.denied'),
          formatter: formatDateOrDash,
        },
        { key: 'deniedByUserName', label: t('moderator.who') },
        { key: 'chatCreation', label: t('details') },
      ],
      // deleted contributions
      [
        baseFields.firstName,
        baseFields.lastName,
        baseFields.amount,
        baseFields.memo,
        baseFields.contributionDate,
        baseFields.createdAt,
        {
          key: 'deletedAt',
          label: t('contributions.deleted'),
          formatter: formatDateOrDash,
        },
        { key: 'deletedByUserName', label: t('moderator.who') },
        { key: 'chatCreation', label: t('details') },
      ],
      // all contributions
      [
        { key: 'contributionStatus', label: t('status') },
        baseFields.firstName,
        baseFields.lastName,
        baseFields.amount,
        baseFields.memo,
        baseFields.contributionDate,
        baseFields.createdAt,
        baseFields.confirmedAt,
        baseFields.confirmedByUserName,
        { key: 'chatCreation', label: t('details') },
      ],
    ][tabIndex.value],
)

const statusFilter = computed(() => [...FILTER_TAB_MAP[tabIndex.value]])

const overlayTitle = computed(() => `overlay.${variant.value}.title`)
const overlayText = computed(() => `overlay.${variant.value}.text`)
const overlayQuestion = computed(() => `overlay.${variant.value}.question`)
const overlayBtnText = computed(() => `overlay.${variant.value}.yes`)
const overlayEvent = computed(() => {
  switch (variant.value) {
    case 'confirm':
      return confirmCreation
    case 'deny':
      return denyCreation
    case 'delete':
      return deleteCreation
    default:
      return null
  }
})
const overlayIcon = computed(() => {
  switch (variant.value) {
    case 'confirm':
      return 'success'
    case 'deny':
      return 'warning'
    case 'delete':
      return 'danger'
    default:
      return 'info'
  }
})
const showResubmissionCheckbox = computed(() => tabIndex.value === 0)
const hideResubmission = computed(() =>
  showResubmissionCheckbox.value ? hideResubmissionModel.value : false,
)
const isAiUser = computed(() =>
  store.state.moderator?.roles.some((role) => ['ADMIN', 'MODERATOR_AI'].includes(role)),
)

watch(tabIndex, () => {
  currentPage.value = 1
  items.value = []
})

const { onResult, onError, result, refetch } = useQuery(
  adminListContributions,
  {
    filter: {
      statusFilter: statusFilter.value,
      query: query.value,
      noHashtag: noHashtag.value,
      hideResubmission: hideResubmission.value,
    },
    paginated: {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      order: 'DESC',
    },
  },
  {
    fetchPolicy: 'no-cache',
  },
)

watch([statusFilter, query, noHashtag, hideResubmission, currentPage], () => {
  refetch({
    filter: {
      statusFilter: statusFilter.value,
      query: query.value,
      noHashtag: noHashtag.value,
      hideResubmission: hideResubmission.value,
    },
    paginated: {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
    },
  })
})

onError((error) => {
  toastError(error.message)
})

onResult(() => {
  rows.value = result.value.adminListContributions.contributionCount
  items.value = result.value.adminListContributions.contributionList
  if (statusFilter.value.toString() === FILTER_TAB_MAP[0].toString()) {
    store.commit('setOpenCreations', result.value.adminListContributions.contributionCount)
  }
})

const {
  mutate: deleteMutation,
  onDone: onDeleteDone,
  onError: onDeleteError,
} = useMutation(adminDeleteContribution)

onDeleteDone(() => {
  overlay.value = false
  updatePendingCreations(item.value.id)
  toastSuccess(t('creation_form.toasted_delete'))
})

onDeleteError((error) => {
  overlay.value = false
  toastError(error.message)
})

const {
  mutate: denyMutation,
  onDone: onDenayDone,
  onError: onDenayError,
} = useMutation(denyContribution)

onDenayDone(() => {
  overlay.value = false
  updatePendingCreations(item.value.id)
  toastSuccess(t('creation_form.toasted_denied'))
})

onDenayError((error) => {
  overlay.value = false
  toastError(error.message)
})

const {
  mutate: confirmMutation,
  onDone: onConfirmationDone,
  onError: onConfirmationError,
} = useMutation(confirmContribution)

onConfirmationDone(() => {
  overlay.value = false
  updatePendingCreations(item.value.id)
  toastSuccess(t('creation_form.toasted_created'))
})

onConfirmationError((error) => {
  overlay.value = false
  toastError(error.message)
})

const reloadContribution = (id) => {
  useQuery(getContribution, { id })
    .onResult((result) => {
      const contribution = result.data.contribution
      const index = items.value.findIndex((obj) => obj.id === contribution.id)
      items.value[index] = contribution
    })
    .onError((error) => {
      overlay.value = false
      toastError(error.message)
    })
}

const deleteCreation = () => {
  deleteMutation({
    id: item.value.id,
  })
}

const denyCreation = () => {
  denyMutation({
    id: item.value.id,
  })
}

const confirmCreation = () => {
  confirmMutation({
    id: item.value.id,
  })
}

const updatePendingCreations = (id) => {
  items.value = items.value.filter((obj) => obj.id !== id)
  store.commit('openCreationsMinus', 1)
}

const showOverlay = (selectedItem, selectedVariant) => {
  overlay.value = true
  item.value = selectedItem
  variant.value = selectedVariant
}

const updateStatus = (id) => {
  const target = items.value.find((obj) => obj.id === id)
  if (target) {
    target.messagesCount++
    target.contributionStatus = 'IN_PROGRESS'
  }
}
</script>

<style>
#overlay {
  position: fixed;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  inset: 0;
  padding-left: 5%;
  background-color: rgb(12 11 11 / 78.1%);
  z-index: 1000000;
  cursor: pointer;
}

.no-select {
  user-select: none;
}
</style>
