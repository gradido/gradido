// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BLink } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { useAdminStore } from '@/store/useAdminStore'

// The first page of all, where a sign-in goes on to and where the coin in the bar leads. It is
// to grow into what is waiting and what is new (Bernd, 30.10.2026), and every moderator opens it
// every time: what stands here has to be cheap for the server. The figures that take it seconds
// have a page of their own (Statistic.tsx).
export const Dashboard = defineComponent({
  name: 'Dashboard',
  setup() {
    const store = useAdminStore()
    const { t } = useI18n()
    const { toastError } = useAppToast()

    // Today's open creations -- the query that also fills the badge in the menu (NavBar), so it
    // stays here with its commit. From the server each time: the client's cache holds the number
    // of the last visit, and would put it back on a badge that has counted on since.
    const {
      result: creations,
      onResult,
      onError,
    } = useQuery(
      adminListContributionsCount,
      {
        filter: {
          statusFilter: ['IN_PROGRESS', 'PENDING'],
          hideResubmission: true,
        },
      },
      { fetchPolicy: 'network-only' },
    )

    onResult(({ data }) => {
      store.setOpenCreations(data?.adminListContributions.contributionCount)
    })

    onError((error) => {
      toastError(error.message)
    })

    const openCreations = computed<number | undefined>(
      () => creations.value?.adminListContributions.contributionCount,
    )
    const todayText = computed(() => {
      if (!openCreations.value) {
        return t('dashboard.todayNone')
      }
      if (openCreations.value === 1) {
        return t('dashboard.todayOne')
      }
      return t('dashboard.today', { n: openCreations.value })
    })

    return () => (
      <div class='admin-dashboard'>
        <h2 class='h4 mb-3'>{t('dashboard.welcome')}</h2>
        {creations.value ? (
          <p>
            <BLink data-test='open-creations' to='/creation-confirm'>
              {todayText.value}
            </BLink>
          </p>
        ) : null}
      </div>
    )
  },
})
