<template>
  <div class="community-page">
    <div>
      <BTabs :model-value="tabIndex" no-nav-style borderless align="center">
        <BTab no-body lazy>
          <contribution-edit
            v-if="itemToEdit"
            v-model="itemToEdit"
            @contribution-updated="handleContributionUpdated"
            @reset-form="itemToEdit = null"
          />
          <contribution-create v-else />
        </BTab>
        <BTab no-body lazy>
          <contribution-list
            :empty-text="$t('contribution.noContributions.myContributions')"
            @update-contribution-form="handleUpdateContributionForm"
          />
        </BTab>
        <BTab no-body lazy>
          <contribution-list
            :empty-text="$t('contribution.noContributions.allContributions')"
            :all-contribution="true"
          />
        </BTab>
      </BTabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@vue/apollo-composable'
import OpenCreationsAmount from '@/components/Contributions/OpenCreationsAmount'
import ContributionEdit from '@/components/Contributions/ContributionEdit'
import ContributionCreate from '@/components/Contributions/ContributionCreate'
import ContributionList from '@/components/Contributions/ContributionList'
import { countContributionsInProgress } from '@/graphql/contributions.graphql'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { GDD_PER_HOUR } from '../constants'

const COMMUNITY_TABS = ['contribute', 'contributions', 'community']

const route = useRoute()
const router = useRouter()

const { toastError, toastSuccess, toastInfo } = useAppToast()
const { t } = useI18n()

const tabIndex = ref(0)

const itemToEdit = ref(null)

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
}
// after a edit contribution was saved, jump to contributions tab
function handleContributionUpdated() {
  itemToEdit.value = null
  tabIndex.value = 1
  router.push({ params: { tab: 'contributions' } })
}
// if user clicks on edit contribution in contributions tab, jump to contribute tab and populate form with contribution data
const handleUpdateContributionForm = (item) => {
  itemToEdit.value = item
  tabIndex.value = 0
  router.push({ params: { tab: 'contribute' } })
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
