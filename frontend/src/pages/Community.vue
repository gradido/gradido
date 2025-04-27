<template>
  <div class="community-page">
    <div>
      <BTabs :model-value="tabIndex" no-nav-style borderless align="center">
        <BTab no-body>
          <contribution-form
            v-model="form"
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
import ContributionForm from '@/components/Contributions/ContributionForm'
import ContributionList from '@/components/Contributions/ContributionList'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import { listContributions, listAllContributions } from '@/graphql/contributions.graphql'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { GDD_PER_HOUR } from '../constants'

const COMMUNITY_TABS = ['contribute', 'contributions', 'community']

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
  refetchAllContributions(pagination)
}

const handleUpdateListContributions = (pagination) => {
  currentPage.value = pagination.currentPage
  pageSize.value = pagination.pageSize
  refetchContributions(pagination)
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
