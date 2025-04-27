<template>
  <div class="community-page">
    <div>
      <BTabs :model-value="tabIndex" no-nav-style borderless align="center">
        <BTab no-body>
          <open-creations-amount
            :minimal-date="minimalDate"
            :max-gdd-last-month="maxForMonths[0]"
            :max-gdd-this-month="maxForMonths[1]"
          />
          <div class="mb-3"></div>
          <contribution-form
            v-model="form"
            :minimal-date="minimalDate"
            :max-gdd-last-month="maxForMonths[0]"
            :max-gdd-this-month="maxForMonths[1]"
            @set-contribution="handleSaveContribution"
            @update-contribution="handleUpdateContribution"
          />
        </BTab>
        <BTab no-body>
          <div v-if="items.length === 0">
            {{ $t('contribution.noContributions.myContributions') }}
          </div>
          <div v-else>
            <contribution-list
              :items="items"
              :contribution-count="contributionCount"
              :show-pagination="true"
              :page-size="pageSize"
              @close-all-open-collapse="closeAllOpenCollapse"
              @update-list-contributions="handleUpdateListContributions"
              @update-contribution-form="handleUpdateContributionForm"
              @delete-contribution="handleDeleteContribution"
              @update-status="updateStatus"
            />
          </div>
        </BTab>
        <BTab no-body>
          <div v-if="itemsAll.length === 0">
            {{ $t('contribution.noContributions.allContributions') }}
          </div>
          <div v-else>
            <contribution-list
              :items="itemsAll"
              :contribution-count="contributionCountAll"
              :show-pagination="true"
              :page-size="pageSizeAll"
              :all-contribution="true"
              @update-list-contributions="handleUpdateListAllContributions"
              @update-contribution-form="handleUpdateContributionForm"
            />
          </div>
        </BTab>
      </BTabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import OpenCreationsAmount from '@/components/Contributions/OpenCreationsAmount'
import ContributionForm from '@/components/Contributions/ContributionForm'
import ContributionList from '@/components/Contributions/ContributionList'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import { listContributions, listAllContributions, openCreations } from '@/graphql/queries'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { GDD_PER_HOUR } from '../constants'

const COMMUNITY_TABS = ['contribute', 'contributions', 'community']

const emit = defineEmits(['update-transactions'])

const route = useRoute()
const router = useRouter()

const { toastError, toastSuccess, toastInfo } = useAppToast()
const { t } = useI18n()

const tabIndex = ref(0)
const items = ref([])
const itemsAll = ref([])
const currentPage = ref(1)
const pageSize = ref(25)
const currentPageAll = ref(1)
const pageSizeAll = ref(25)
const contributionCount = ref(0)
const contributionCountAll = ref(0)
const form = ref({
  id: null,
  date: undefined,
  memo: '',
  hours: '',
  amount: GDD_PER_HOUR,
})
const originalContributionDate = ref('')
const updateAmount = ref('')
const maximalDate = ref(new Date())
const openCreationsData = ref([])

const minimalDate = computed(() => {
  const date = new Date(maximalDate.value)
  return new Date(date.setMonth(date.getMonth() - 1, 1))
})

const amountToAdd = computed(() => (form.value.id ? parseFloat(updateAmount.value) : 0.0))

const maxForMonths = computed(() => {
  const originalDate = new Date(originalContributionDate.value)
  if (openCreationsData.value && openCreationsData.value.length) {
    return openCreationsData.value.slice(1).map((creation) => {
      if (
        creation.year === originalDate.getFullYear() &&
        creation.month === originalDate.getMonth()
      ) {
        return parseFloat(creation.amount) + amountToAdd.value
      }
      return parseFloat(creation.amount)
    })
  }
  return [0, 0]
})
const { onResult: onOpenCreationsResult, refetch: refetchOpenCreations } = useQuery(
  openCreations,
  () => ({}),
  {
    fetchPolicy: 'network-only',
  },
)
const { onResult: onListAllContributionsResult, refetch: refetchAllContributions } = useQuery(
  listAllContributions,
  () => ({
    currentPage: currentPageAll.value,
    pageSize: pageSizeAll.value,
  }),
  { fetchPolicy: 'no-cache' },
)
const { onResult: onListContributionsResult, refetch: refetchContributions } = useQuery(
  listContributions,
  () => ({
    currentPage: currentPage.value,
    pageSize: pageSize.value,
  }),
  { fetchPolicy: 'network-only' },
)

const { mutate: createContributionMutation } = useMutation(createContribution)
const { mutate: updateContributionMutation } = useMutation(updateContribution)
const { mutate: deleteContributionMutation } = useMutation(deleteContribution)

onOpenCreationsResult(({ data }) => {
  if (data) {
    openCreationsData.value = data.openCreations
  }
})

onListAllContributionsResult(({ data }) => {
  if (data) {
    contributionCountAll.value = data.listAllContributions.contributionCount
    itemsAll.value.length = 0
    data.listAllContributions.contributionList.forEach((entry) => {
      itemsAll.value.push(entry)
    })
  }
})

onListContributionsResult(({ data }) => {
  if (data) {
    contributionCount.value = data.listContributions.contributionCount
    items.value.length = 0
    data.listContributions.contributionList.forEach((entry) => {
      items.value.push({ ...entry })
    })
    if (items.value.find((item) => item.status === 'IN_PROGRESS')) {
      tabIndex.value = 1
      if (route.params.tab !== 'contributions') {
        router.push({ params: { tab: 'contributions' } })
      }
      toastInfo(t('contribution.alert.answerQuestionToast'))
    }
  }
})

const updateTabIndex = () => {
  const index = COMMUNITY_TABS.indexOf(route.params.tab)
  tabIndex.value = index > -1 ? index : 0
  closeAllOpenCollapse()
}

const closeAllOpenCollapse = () => {
  document.querySelectorAll('.collapse.show').forEach((el) => {
    el.classList.remove('show')
  })
}

const refetchData = () => {
  refetchAllContributions()
  refetchContributions()
  refetchOpenCreations()
}

const handleSaveContribution = async (data) => {
  try {
    await createContributionMutation({
      creationDate: data.date,
      memo: data.memo,
      amount: data.amount,
    })
    toastSuccess(t('contribution.submitted'))
    refetchData()
  } catch (err) {
    toastError(err.message)
  }
}

const handleUpdateContribution = async (data) => {
  try {
    await updateContributionMutation({
      contributionId: data.id,
      creationDate: data.date,
      memo: data.memo,
      amount: data.amount,
    })
    toastSuccess(t('contribution.updated'))
    refetchData()
  } catch (err) {
    toastError(err.message)
  }
}

const handleDeleteContribution = async (data) => {
  try {
    await deleteContributionMutation({
      id: data.id,
    })
    toastSuccess(t('contribution.deleted'))
    refetchData()
  } catch (err) {
    toastError(err.message)
  }
}

const handleUpdateListAllContributions = (pagination) => {
  currentPageAll.value = pagination.currentPage
  pageSizeAll.value = pagination.pageSize
  refetchAllContributions({
    currentPage: currentPage.value,
    pageSize: pageSize.value,
  })
}

const handleUpdateListContributions = (pagination) => {
  currentPage.value = pagination.currentPage
  pageSize.value = pagination.pageSize
  refetchContributions()
}

const handleUpdateContributionForm = (item) => {
  form.value = {
    id: item.id,
    date: new Date(item.contributionDate).toISOString().slice(0, 10),
    memo: item.memo,
    amount: item.amount,
    hours: item.amount / 20,
  } //* /
  originalContributionDate.value = item.contributionDate
  updateAmount.value = item.amount
  tabIndex.value = 0
  router.push({ params: { tab: 'contribute' } })
}

const updateTransactions = (pagination) => {
  emit('update-transactions', pagination)
}

const updateStatus = (id) => {
  const item = items.value.find((item) => item.id === id)
  if (item) {
    item.status = 'PENDING'
  }
}

watch(() => route.params.tab, updateTabIndex)

onMounted(updateTabIndex)
</script>
<style scoped>
.tab-content {
  border-left: none;
  border-right: none;
}
</style>
