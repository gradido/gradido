// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { computed, defineComponent, watch } from 'vue'
import { useAppToast } from '@/composables/useToast'
import { listContributionLinks } from '@/graphql/listContributionLinks'
import { ContributionLink } from '../components/ContributionLink/ContributionLink'

export const ContributionLinks = defineComponent({
  name: 'ContributionLinks',
  setup() {
    const { toastError } = useAppToast()

    const { result, error, refetch } = useQuery(listContributionLinks, null, {
      fetchPolicy: 'network-only',
    })

    const items = computed(() => {
      return result.value?.listContributionLinks?.links || []
    })

    const count = computed(() => {
      return result.value?.listContributionLinks?.count || 0
    })

    watch(error, () => {
      toastError('listContributionLinks has no result, use default data')
    })

    return () => (
      <div class='contribution-link'>
        <ContributionLink
          items={items.value}
          count={count.value}
          onGet-contribution-links={refetch}
        />
      </div>
    )
  },
})
