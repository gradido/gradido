<template>
  <div>
    <div
      class="contribution-list-item bg-white app-box-shadow gradido-border-radius pt-3 px-3"
      :class="status === 'IN_PROGRESS' && !allContribution ? 'pulse border border-205' : ''"
    >
      <BRow>
        <BCol cols="3" lg="2" md="2">
          <avatar
            v-if="firstName"
            :username="username.username"
            :initials="username.initials"
            color="#fff"
            class="fw-bold"
          ></avatar>
          <BAvatar v-else rounded="lg" :variant="variant" size="4.55em">
            <variant-icon :icon="icon" variant="white" />
          </BAvatar>
        </BCol>
        <BCol>
          <div v-if="firstName" class="me-3 fw-bold">
            {{ firstName }} {{ lastName }}
            <variant-icon :icon="icon" :variant="variant" />
          </div>
          <div class="small">
            {{ $d(new Date(contributionDate), 'short') }}
          </div>
          <div class="mt-3 fw-bold">{{ $t('contributionText') }}</div>
          <div class="mb-3 text-break word-break">{{ memo }}</div>
          <div v-if="updatedBy > 0" class="mt-2 mb-2 small">
            {{ $t('moderatorChangedMemo') }}
          </div>
          <div
            v-if="status === 'IN_PROGRESS' && !allContribution"
            class="text-danger pointer hover-font-bold"
            @click="visible = !visible"
          >
            {{ $t('contribution.alert.answerQuestion') }}
          </div>
        </BCol>
        <BCol cols="9" lg="3" offset="3" offset-md="0" offset-lg="0">
          <div class="small">
            {{ $t('creation') }} {{ $t('(') }}{{ amount / 20 }} {{ $t('h') }}{{ $t(')') }}
          </div>
          <div v-if="status === 'DENIED' && allContribution" class="fw-bold">
            <variant-icon icon="x-circle" variant="danger" />
            {{ $t('contribution.alert.denied') }}
          </div>
          <div v-if="status === 'DELETED'" class="small">
            {{ $t('contribution.deleted') }}
          </div>
          <div v-else class="fw-bold">{{ $filters.GDD(amount) }}</div>
        </BCol>
        <BCol cols="12" md="1" lg="1" class="text-end align-items-center">
          <div v-if="messagesCount > 0 && !moderatorId" @click="visible = !visible">
            <collapse-icon class="text-end" :visible="visible" />
          </div>
        </BCol>
      </BRow>
      <BRow
        v-if="(!['CONFIRMED', 'DELETED'].includes(status) && !allContribution) || messagesCount > 0"
        class="p-2"
      >
        <BCol cols="3" class="me-auto text-center">
          <div
            v-if="!['CONFIRMED', 'DELETED'].includes(status) && !allContribution && !moderatorId"
            class="test-delete-contribution pointer me-3"
            @click="deleteContribution({ id })"
          >
            <IBiTrash />

            <div>{{ $t('delete') }}</div>
          </div>
        </BCol>
        <BCol cols="3" class="text-center">
          <div
            v-if="!['CONFIRMED', 'DELETED'].includes(status) && !allContribution && !moderatorId"
            class="test-edit-contribution pointer me-3"
            @click="
              $emit('update-contribution-form', {
                id: id,
                contributionDate: contributionDate,
                memo: memo,
                amount: amount,
              })
            "
          >
            <IBiPencil />
            <div>{{ $t('edit') }}</div>
          </div>
        </BCol>
        <BCol cols="6" class="text-center">
          <div v-if="messagesCount > 0 && !moderatorId" class="pointer" @click="visible = !visible">
            <IBiChatDots />
            <div>{{ $t('moderatorChat') }}</div>
          </div>
        </BCol>
      </BRow>
      <div v-else class="pb-3"></div>
      <BCollapse :id="collapseId" :model-value="visible" class="mt-2">
        <contribution-messages-list
          :messages="messagesGet"
          :status="status"
          :contribution-id="contributionId"
          @get-list-contribution-messages="getListContributionMessages"
          @update-status="updateStatus"
        />
      </BCollapse>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Avatar from 'vue-avatar'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import ContributionMessagesList from '@/components/ContributionMessages/ContributionMessagesList'
import { listContributionMessages } from '@/graphql/queries'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { useLazyQuery, useQuery } from '@vue/apollo-composable'

const props = defineProps({
  id: {
    type: Number,
  },
  amount: {
    type: String,
  },
  memo: {
    type: String,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  createdAt: {
    type: String,
  },
  contributionDate: {
    type: String,
  },
  deletedAt: {
    type: String,
    required: false,
  },
  confirmedBy: {
    type: Number,
    required: false,
  },
  confirmedAt: {
    type: String,
    required: false,
  },
  deniedBy: {
    type: Number,
    required: false,
  },
  deniedAt: {
    type: String,
    required: false,
  },
  updatedBy: {
    type: Number,
    required: false,
  },
  status: {
    type: String,
    required: false,
    default: '',
  },
  messagesCount: {
    type: Number,
    required: false,
  },
  contributionId: {
    type: Number,
    required: true,
  },
  allContribution: {
    type: Boolean,
    required: false,
    default: false,
  },
  moderatorId: {
    type: Number,
    required: false,
    default: 0,
  },
})

const { toastError, toastSuccess } = useAppToast()
const { t } = useI18n()

const inProcess = ref(true)
const messagesGet = ref([])
const visible = ref(false)

const variant = computed(() => {
  if (props.deletedAt) return 'danger'
  if (props.deniedAt) return 'warning'
  if (props.confirmedAt) return 'success'
  if (props.status === 'IN_PROGRESS') return '205'
  return 'primary'
})

const icon = computed(() => {
  if (props.deletedAt) return 'trash'
  if (props.deniedAt) return 'x-circle'
  if (props.confirmedAt) return 'check'
  if (props.status === 'IN_PROGRESS') return 'question'
  return 'bell-fill'
})

const date = computed(() => props.createdAt)

const collapseId = computed(() => 'collapse' + String(props.id))

const username = computed(() => ({
  username: `${props.firstName} ${props.lastName}`,
  initials: `${props.firstName[0]}${props.lastName[0]}`,
}))

watch(
  () => visible.value,
  () => {
    if (visible.value) getListContributionMessages()
  },
)

function deleteContribution(item) {
  if (window.confirm(t('contribution.delete'))) {
    emit('delete-contribution', item)
  }
}

const { onResult, onError, load } = useLazyQuery(listContributionMessages, {
  contributionId: props.contributionId,
})

function getListContributionMessages(closeCollapse = true) {
  if (closeCollapse) {
    emit('close-all-open-collapse')
  }
  load(listContributionMessages, {
    contributionId: props.contributionId,
  })
}

onResult((resultValue) => {
  if (resultValue.data) {
    messagesGet.value.length = 0
    resultValue.data.listContributionMessages.messages.forEach((message) => {
      messagesGet.value.push(message)
    })
  }
})

onError((err) => {
  toastError(err.message)
})

watch(
  () => visible.value,
  () => {
    if (visible.value) {
      getListContributionMessages()
    }
  },
)

function updateStatus(id) {
  emit('update-status', id)
}

const emit = defineEmits(['delete-contribution', 'close-all-open-collapse', 'update-status'])
</script>

<style lang="scss" scoped>
:deep(.b-avatar-custom > svg) {
  width: 2.5em;
  height: 2.5em;
}
</style>
