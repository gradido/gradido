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
            :model-value="form"
            :key="computedKeyFromForm"
            :is-this-month="isThisMonth"
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
              @update-list-contributions="updateListAllContributions"
              @update-contribution-form="updateContributionForm"
            />
          </div>
        </BTab>
      </BTabs>
    </div>
  </div>
</template>
<!--<script>-->
<!--import OpenCreationsAmount from '@/components/Contributions/OpenCreationsAmount'-->
<!--import ContributionForm from '@/components/Contributions/ContributionForm'-->
<!--import ContributionList from '@/components/Contributions/ContributionList'-->
<!--import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'-->
<!--import { listContributions, listAllContributions, openCreations } from '@/graphql/queries'-->

<!--const COMMUNITY_TABS = ['contribute', 'contributions', 'community']-->

<!--export default {-->
<!--  name: 'Community',-->
<!--  components: {-->
<!--    ContributionForm,-->
<!--    ContributionList,-->
<!--    OpenCreationsAmount,-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      tabIndex: 0,-->
<!--      items: [],-->
<!--      itemsAll: [],-->
<!--      currentPage: 1,-->
<!--      pageSize: 25,-->
<!--      currentPageAll: 1,-->
<!--      pageSizeAll: 25,-->
<!--      contributionCount: 0,-->
<!--      contributionCountAll: 0,-->
<!--      form: {-->
<!--        id: null,-->
<!--        date: '',-->
<!--        memo: '',-->
<!--        hours: 0,-->
<!--        amount: '',-->
<!--      },-->
<!--      originalContributionDate: '',-->
<!--      updateAmount: '',-->
<!--      maximalDate: new Date(),-->
<!--      openCreations: [],-->
<!--    }-->
<!--  },-->
<!--  mounted() {-->
<!--    this.updateTabIndex()-->
<!--  },-->
<!--  apollo: {-->
<!--    OpenCreations: {-->
<!--      query() {-->
<!--        return openCreations-->
<!--      },-->
<!--      fetchPolicy: 'network-only',-->
<!--      variables() {-->
<!--        return {}-->
<!--      },-->
<!--      update({ openCreations }) {-->
<!--        this.openCreations = openCreations-->
<!--      },-->
<!--      error({ message }) {-->
<!--        this.toastError(message)-->
<!--      },-->
<!--    },-->
<!--    ListAllContributions: {-->
<!--      query() {-->
<!--        return listAllContributions-->
<!--      },-->
<!--      variables() {-->
<!--        return {-->
<!--          currentPage: this.currentPageAll,-->
<!--          pageSize: this.pageSizeAll,-->
<!--        }-->
<!--      },-->
<!--      fetchPolicy: 'no-cache',-->
<!--      update({ listAllContributions }) {-->
<!--        this.contributionCountAll = listAllContributions.contributionCount-->
<!--        this.itemsAll = listAllContributions.contributionList-->
<!--      },-->
<!--      error({ message }) {-->
<!--        this.toastError(message)-->
<!--      },-->
<!--    },-->
<!--    ListContributions: {-->
<!--      query() {-->
<!--        return listContributions-->
<!--      },-->
<!--      fetchPolicy: 'network-only',-->
<!--      variables() {-->
<!--        return {-->
<!--          currentPage: this.currentPage,-->
<!--          pageSize: this.pageSize,-->
<!--        }-->
<!--      },-->
<!--      update({ listContributions }) {-->
<!--        this.contributionCount = listContributions.contributionCount-->
<!--        this.items = listContributions.contributionList-->
<!--        if (this.items.find((item) => item.status === 'IN_PROGRESS')) {-->
<!--          this.tabIndex = 1-->
<!--          if (this.$route.params.tab !== 'contributions')-->
<!--            this.$router.push({ params: { tab: 'contributions' } })-->
<!--          this.toastInfo(this.$t('contribution.alert.answerQuestionToast'))-->
<!--        }-->
<!--      },-->
<!--      error({ message }) {-->
<!--        this.toastError(message)-->
<!--      },-->
<!--    },-->
<!--  },-->
<!--  watch: {-->
<!--    '$route.params.tab'() {-->
<!--      this.updateTabIndex()-->
<!--    },-->
<!--  },-->
<!--  computed: {-->
<!--    minimalDate() {-->
<!--      const date = new Date(this.maximalDate)-->
<!--      return new Date(date.setMonth(date.getMonth() - 1, 1))-->
<!--    },-->
<!--    isThisMonth() {-->
<!--      const formDate = new Date(this.form.date)-->
<!--      return (-->
<!--        formDate.getFullYear() === this.maximalDate.getFullYear() &&-->
<!--        formDate.getMonth() === this.maximalDate.getMonth()-->
<!--      )-->
<!--    },-->
<!--    amountToAdd() {-->
<!--      // when existing contribution is edited, the amount is added back on top of the amount-->
<!--      if (this.form.id) return parseInt(this.updateAmount)-->
<!--      return 0-->
<!--    },-->
<!--    maxForMonths() {-->
<!--      const originalContributionDate = new Date(this.originalContributionDate)-->
<!--      if (this.openCreations && this.openCreations.length)-->
<!--        return this.openCreations.slice(1).map((creation) => {-->
<!--          if (-->
<!--            creation.year === originalContributionDate.getFullYear() &&-->
<!--            creation.month === originalContributionDate.getMonth()-->
<!--          )-->
<!--            return parseInt(creation.amount) + this.amountToAdd-->
<!--          return parseInt(creation.amount)-->
<!--        })-->
<!--      return [0, 0]-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    updateTabIndex() {-->
<!--      const index = COMMUNITY_TABS.indexOf(this.$route.params.tab)-->
<!--      this.$nextTick(() => {-->
<!--        this.tabIndex = index > -1 ? index : 0-->
<!--      })-->
<!--      this.closeAllOpenCollapse()-->
<!--    },-->
<!--    closeAllOpenCollapse() {-->
<!--      this.$el.querySelectorAll('.collapse.show').forEach((value) => {-->
<!--        this.$root.$emit('bv::toggle::collapse', value.id)-->
<!--      })-->
<!--    },-->
<!--    refetchData() {-->
<!--      this.$apollo.queries.ListAllContributions.refetch()-->
<!--      this.$apollo.queries.ListContributions.refetch()-->
<!--      this.$apollo.queries.OpenCreations.refetch()-->
<!--    },-->
<!--    saveContribution(data) {-->
<!--      this.$apollo-->
<!--        .mutate({-->
<!--          fetchPolicy: 'no-cache',-->
<!--          mutation: createContribution,-->
<!--          variables: {-->
<!--            creationDate: data.date,-->
<!--            memo: data.memo,-->
<!--            amount: data.amount,-->
<!--          },-->
<!--        })-->
<!--        .then((result) => {-->
<!--          this.toastSuccess(this.$t('contribution.submitted'))-->
<!--          this.refetchData()-->
<!--        })-->
<!--        .catch((err) => {-->
<!--          this.toastError(err.message)-->
<!--        })-->
<!--    },-->
<!--    updateContribution(data) {-->
<!--      this.$apollo-->
<!--        .mutate({-->
<!--          fetchPolicy: 'no-cache',-->
<!--          mutation: updateContribution,-->
<!--          variables: {-->
<!--            contributionId: data.id,-->
<!--            creationDate: data.date,-->
<!--            memo: data.memo,-->
<!--            amount: data.amount,-->
<!--          },-->
<!--        })-->
<!--        .then((result) => {-->
<!--          this.toastSuccess(this.$t('contribution.updated'))-->
<!--          this.refetchData()-->
<!--        })-->
<!--        .catch((err) => {-->
<!--          this.toastError(err.message)-->
<!--        })-->
<!--    },-->
<!--    deleteContribution(data) {-->
<!--      this.$apollo-->
<!--        .mutate({-->
<!--          fetchPolicy: 'no-cache',-->
<!--          mutation: deleteContribution,-->
<!--          variables: {-->
<!--            id: data.id,-->
<!--          },-->
<!--        })-->
<!--        .then((result) => {-->
<!--          this.toastSuccess(this.$t('contribution.deleted'))-->
<!--          this.refetchData()-->
<!--        })-->
<!--        .catch((err) => {-->
<!--          this.toastError(err.message)-->
<!--        })-->
<!--    },-->
<!--    updateListAllContributions(pagination) {-->
<!--      this.currentPageAll = pagination.currentPage-->
<!--      this.pageSizeAll = pagination.pageSize-->
<!--      this.$apollo.queries.ListAllContributions.refetch()-->
<!--    },-->
<!--    updateListContributions(pagination) {-->
<!--      this.currentPage = pagination.currentPage-->
<!--      this.pageSize = pagination.pageSize-->
<!--      this.$apollo.queries.ListContributions.refetch()-->
<!--    },-->
<!--    updateContributionForm(item) {-->
<!--      this.form.id = item.id-->
<!--      this.form.date = item.contributionDate-->
<!--      this.originalContributionDate = item.contributionDate-->
<!--      this.form.memo = item.memo-->
<!--      this.form.amount = item.amount-->
<!--      this.form.hours = item.amount / 20-->
<!--      this.updateAmount = item.amount-->
<!--      this.tabIndex = 0-->
<!--      this.$router.push({ params: { tab: 'contribute' } })-->
<!--    },-->
<!--    updateTransactions(pagination) {-->
<!--      this.$emit('update-transactions', pagination)-->
<!--    },-->
<!--    updateStatus(id) {-->
<!--      this.items.find((item) => item.id === id).status = 'PENDING'-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->

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

const COMMUNITY_TABS = ['contribute', 'contributions', 'community']

const emit = defineEmits(['update-transactions'])

const route = useRoute()
const router = useRouter()

const { toastError, toastSuccess, toastInfo } = useAppToast()
const { t } = useI18n()

// Reactive state
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
  date: '',
  memo: '',
  hours: 0,
  amount: '',
})
const originalContributionDate = ref('')
const updateAmount = ref('')
const maximalDate = ref(new Date())
const openCreationsData = ref([])

// Computed properties
const minimalDate = computed(() => {
  const date = new Date(maximalDate.value)
  return new Date(date.setMonth(date.getMonth() - 1, 1))
})

const isThisMonth = computed(() => {
  const formDate = new Date(form.value.date)
  return (
    formDate.getFullYear() === maximalDate.value.getFullYear() &&
    formDate.getMonth() === maximalDate.value.getMonth()
  )
})

const amountToAdd = computed(() => (form.value.id ? parseInt(updateAmount.value) : 0))

const maxForMonths = computed(() => {
  const originalDate = new Date(originalContributionDate.value)
  if (openCreationsData.value && openCreationsData.value.length) {
    return openCreationsData.value.slice(1).map((creation) => {
      if (
        creation.year === originalDate.getFullYear() &&
        creation.month === originalDate.getMonth()
      ) {
        return parseInt(creation.amount) + amountToAdd.value
      }
      return parseInt(creation.amount)
    })
  }
  return [0, 0]
})

const computedKeyFromForm = computed(() => {
  return `${form.value.id}_${form.value.date}_${form.value.memo}_${form.value.amount}_${form.value.hours}`
})

// Queries
const { onResult: onOpenCreationsResult, refetch: refetchOpenCreations } = useQuery(openCreations)
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

// Mutations
const { mutate: createContributionMutation } = useMutation(createContribution)
const { mutate: updateContributionMutation } = useMutation(updateContribution)
const { mutate: deleteContributionMutation } = useMutation(deleteContribution)

// Query results
onOpenCreationsResult(({ data }) => {
  if (data) {
    openCreationsData.value = data.openCreations
  }
})

onListAllContributionsResult(({ data }) => {
  console.count('RESULT?!')
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

// Methods
const updateTabIndex = () => {
  const index = COMMUNITY_TABS.indexOf(route.params.tab)
  tabIndex.value = index > -1 ? index : 0
  closeAllOpenCollapse()
}

const closeAllOpenCollapse = () => {
  document.querySelectorAll('.collapse.show').forEach((el) => {
    // Assuming you're using bootstrap-vue, adjust if using a different library
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
  refetchAllContributions()
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
  }
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

// Watchers
watch(() => route.params.tab, updateTabIndex)

// Lifecycle hooks
onMounted(updateTabIndex)
</script>
<style scoped>
.tab-content {
  border-left: none;
  border-right: none;
}
</style>
