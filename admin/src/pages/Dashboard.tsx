// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BLink } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminOpenCreationCounts } from '@/graphql/adminListContributions.graphql'
import { useAdminStore } from '@/store/useAdminStore'

type OpenCreationCounts = Record<
  'waitingForModeration' | 'waitingForMember' | 'allOpen',
  { contributionCount: number }
>

// The answer as the page reads it. The three counts are three statements, so that a creation
// changing between them could make "the rest" less than nothing.
const openCreationsOf = ({
  waitingForModeration,
  waitingForMember,
  allOpen,
}: OpenCreationCounts) => {
  const forModeration = waitingForModeration.contributionCount
  const forMember = waitingForMember.contributionCount
  const open = forModeration + forMember
  return {
    forModeration,
    forMember,
    open,
    onResubmission: Math.max(allOpen.contributionCount - open, 0),
  }
}

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
    // stays here with its commit. The badge counts what the tab "open" of the creation page shows:
    // what is put off to a resubmission date is not part of it. From the server each time: the
    // client's cache holds the numbers of the last visit, and would put them back on a badge that
    // has counted on since. The server limits all three to the groups of a group moderator.
    const {
      result: creations,
      onResult,
      onError,
    } = useQuery(adminOpenCreationCounts, {}, { fetchPolicy: 'network-only' })

    onResult(({ data }) => {
      if (data) {
        store.setOpenCreations(openCreationsOf(data).open)
      }
    })

    onError((error) => {
      toastError(error.message)
    })

    const counts = computed(() => (creations.value ? openCreationsOf(creations.value) : null))
    const todayText = computed(() => {
      if (!counts.value?.open) {
        return t('dashboard.todayNone')
      }
      if (counts.value.open === 1) {
        return t('dashboard.todayOne')
      }
      return t('dashboard.today', { n: counts.value.open })
    })

    return () => (
      <div class='admin-dashboard'>
        <h2 class='h4 mb-3'>{t('dashboard.welcome')}</h2>
        {counts.value ? (
          <p class='mb-1'>
            <BLink data-test='open-creations' to='/creation-confirm'>
              {todayText.value}
            </BLink>
          </p>
        ) : null}
        {/* The two lines add up to the number above. Both stand, also at 0: "nothing waits for
            the moderation" is what a moderator looks for here. */}
        {counts.value?.open ? (
          <ul class='list-unstyled ms-3 mb-1' data-test='open-creations-waiting'>
            <li data-test='waiting-for-moderation'>
              {t(
                'dashboard.waitingForModeration',
                { n: counts.value.forModeration },
                counts.value.forModeration,
              )}
            </li>
            <li data-test='waiting-for-member'>
              {t(
                'dashboard.waitingForMember',
                { n: counts.value.forMember },
                counts.value.forMember,
              )}
            </li>
          </ul>
        ) : null}
        {/* Not part of the number above, so it says "also". */}
        {counts.value?.onResubmission ? (
          <p class='mb-1' data-test='on-resubmission'>
            {t('dashboard.resubmission', { n: counts.value.onResubmission })}
          </p>
        ) : null}
      </div>
    )
  },
})
