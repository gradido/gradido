<template>
  <div class="contributions-page">
    <div class="mt--3">
      <nav-contributions v-bind="tabRoutes" route-base="/contributions/" />
      <BTabs :model-value="tabIndex" no-nav-style borderless align="center" class="mt-3">
        <BTab no-body lazy>
          <contribution-edit
            v-if="itemData"
            v-model="itemData"
            @contribution-updated="handleContributionUpdated"
          />
          <contribution-create v-else />
        </BTab>
        <BTab no-body lazy>
          <contribution-list @update-contribution-form="handleUpdateContributionForm" />
        </BTab>
        <BTab no-body lazy>
          <contribution-list-all />
        </BTab>
      </BTabs>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@vue/apollo-composable'
import ContributionEdit from '@/components/Contributions/ContributionEdit'
import ContributionCreate from '@/components/Contributions/ContributionCreate'
import ContributionList from '@/components/Contributions/ContributionList'
import ContributionListAll from '@/components/Contributions/ContributionListAll'
import NavContributions from '@/components/Contributions/NavContributions'
import { countContributionsInProgress } from '@/graphql/contributions.graphql'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const tabRoutes = {
  contribute: 'contribute',
  ownContributions: 'own-contributions',
  allContributions: 'all-contributions',
}

const route = useRoute()
const router = useRouter()

const tabRouteToIndex = (route) => {
  const index = Object.values(tabRoutes).indexOf(route)
  if (index > -1) {
    return index
  }
  router.push({ path: '/contributions/' + tabRoutes.contribute })
  return 0
}

const { toastInfo } = useAppToast()
const { t } = useI18n()

const tabIndex = ref(0)

const itemData = ref(null)
const editContributionPage = ref(1)

const { onResult: handleInProgressContributionFound } = useQuery(
  countContributionsInProgress,
  {},
  {
    fetchPolicy: 'network-only',
  },
)
// jump to my contributions if in progress contribution found
handleInProgressContributionFound(({ data }) => {
  if (data) {
    if (data.countContributionsInProgress > 0) {
      tabIndex.value = tabRouteToIndex(tabRoutes.ownContributions)
      if (route.params.tab !== tabRoutes.ownContributions) {
        router.push({ params: { tab: tabRoutes.ownContributions } })
      }
      toastInfo(t('contribution.alert.answerQuestionToast'))
    }
  }
})

// after a edit contribution was saved, jump to contributions tab
function handleContributionUpdated() {
  const contributionItemId = itemData.value.id
  itemData.value = null
  tabIndex.value = tabRouteToIndex(tabRoutes.ownContributions)
  router.push({
    params: { tab: tabRoutes.ownContributions, page: editContributionPage.value },
    hash: `#contributionListItem-${contributionItemId}`,
  })
}
// if user clicks on edit contribution in contributions tab, jump to contribute tab and populate form with contribution data
const handleUpdateContributionForm = (data) => {
  itemData.value = data.item
  editContributionPage.value = data.page
  tabIndex.value = tabRouteToIndex(tabRoutes.contribute)
  router.push({ params: { tab: tabRoutes.contribute, page: undefined } })
}

watch(
  () => route.params.tab,
  () => {
    tabIndex.value = tabRouteToIndex(route.params.tab)
  },
  { immediate: true },
)
</script>
<style scoped>
.tab-content {
  border-left: none;
  border-right: none;
}
</style>
