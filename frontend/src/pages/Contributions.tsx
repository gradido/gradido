// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BTab, BTabs } from 'bootstrap-vue-next'
import { defineComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ContributionCreate } from '@/components/Contributions/ContributionCreate'
import {
  ContributionEdit,
  type ContributionEditItem,
} from '@/components/Contributions/ContributionEdit'
import { ContributionList } from '@/components/Contributions/ContributionList'
import { ContributionListAll } from '@/components/Contributions/ContributionListAll'
import { NavContributions } from '@/components/Contributions/NavContributions'
import { endFirstLoginHolds } from '@/composables/useFirstLoginWindow'
import { useAppToast } from '@/composables/useToast'
import { countContributionsInProgress } from '@/graphql/contributions.graphql'

const tabRoutes = {
  contribute: 'contribute',
  ownContributions: 'own-contributions',
  allContributions: 'all-contributions',
}

/** "Schöpfen": the form, the member's own contributions and the community's, as three tabs. */
export const Contributions = defineComponent({
  name: 'Contributions',
  setup(_, { expose }) {
    // E-045 (Bernd, 08.11.2026): whoever opens "Schöpfen" wants to create -- the windows about the
    // member that waited for the next start (E-044, KA-015) come now, the name before the first
    // creation (ES-003). Every hold, as a sign-in ends them: the place of use is the place of the
    // change (PS-024).
    onMounted(endFirstLoginHolds)

    const route = useRoute()
    const router = useRouter()

    const tabRouteToIndex = (tab: string) => {
      const index = Object.values(tabRoutes).indexOf(tab)
      if (index > -1) {
        return index
      }
      router.push({ path: `/contributions/${tabRoutes.contribute}` })
      return 0
    }

    const { toastInfo } = useAppToast()
    const { t } = useI18n()

    const tabIndex = ref(0)

    const itemData = ref<ContributionEditItem | null>(null)
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
    const handleContributionUpdated = () => {
      const contributionItemId = itemData.value?.id
      itemData.value = null
      tabIndex.value = tabRouteToIndex(tabRoutes.ownContributions)
      router.push({
        params: { tab: tabRoutes.ownContributions, page: editContributionPage.value },
        hash: `#contributionListItem-${contributionItemId}`,
      })
    }
    // if user clicks on edit contribution in contributions tab, jump to contribute tab and populate form with contribution data
    const handleUpdateContributionForm = (data: { item: ContributionEditItem; page: number }) => {
      itemData.value = data.item
      editContributionPage.value = data.page
      tabIndex.value = tabRouteToIndex(tabRoutes.contribute)
      router.push({ params: { tab: tabRoutes.contribute, page: undefined } })
    }

    watch(
      () => route.params.tab,
      () => {
        tabIndex.value = tabRouteToIndex(route.params.tab as string)
      },
      { immediate: true },
    )

    expose({ tabIndex, itemData, handleUpdateContributionForm })

    // `borderless` is no prop of BTabs: it lands on the tabs as the empty attribute it was.
    const borderless = { borderless: '' } as object

    return () => (
      <div class='contributions-page'>
        <div class='mt--3'>
          <NavContributions {...tabRoutes} routeBase='/contributions/' />
          <BTabs modelValue={tabIndex.value} noNavStyle {...borderless} align='center' class='mt-3'>
            <BTab noBody lazy>
              {itemData.value ? (
                <ContributionEdit
                  modelValue={itemData.value}
                  onContribution-updated={handleContributionUpdated}
                />
              ) : (
                <ContributionCreate />
              )}
            </BTab>
            <BTab noBody lazy>
              <ContributionList onUpdate-contribution-form={handleUpdateContributionForm} />
            </BTab>
            <BTab noBody lazy>
              <ContributionListAll />
            </BTab>
          </BTabs>
        </div>
      </div>
    )
  },
})
