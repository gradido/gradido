// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BButton, BCol, BListGroup, BListGroupItem, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommunityVisualizeItem } from '@/components/Federation/CommunityVisualizeItem'
import { useAppToast } from '@/composables/useToast'
import { allCommunities } from '@/graphql/allCommunities'
import IBiArrowClockwise from '~icons/bi/arrow-clockwise'

export const FederationVisualize = defineComponent({
  name: 'FederationVisualize',
  setup() {
    const { t } = useI18n()
    const { toastError } = useAppToast()

    const { result, loading, refetch, error } = useQuery(allCommunities, () => ({}), {
      fetchPolicy: 'network-only',
    })

    const communities = computed(() => {
      return result.value?.allCommunities || []
    })

    watch(error, () => {
      if (error.value) {
        toastError(error.value.message)
      }
    })

    const animation = computed(() => (loading.value ? 'spin' : ''))

    return () => (
      <div class='federation-visualize'>
        <div class='d-flex justify-content-between align-items-center mb-3'>
          <span class='h2'>{t('federation.gradidoInstances')}</span>
          <BButton
            // no props of BButton: they land on the element
            {...{ animation: animation.value, 'font-scale': '2' }}
            data-test='federation-communities-refresh-btn'
            // A symbol and nothing else: the name is all a screen reader has of it.
            title={t('refresh')}
            aria-label={t('refresh')}
            // ⚠️ The click event is what refetch receives as its variables, as before.
            onClick={refetch as unknown as (event: MouseEvent) => void}
          >
            <IBiArrowClockwise />
          </BButton>
        </div>
        <BListGroup>
          {/* The heads of the columns, from 992px on. Below that every community is a card whose
              values carry a small name of their own (CommunityVisualizeItem). */}
          <BRow class='d-none d-lg-flex'>
            <BCol cols='1' class='ms-1'>
              {t('federation.verified')}
            </BCol>
            <BCol class='ms-3'>{t('federation.url')}</BCol>
            <BCol class='ms-3'>{t('federation.name')}</BCol>
            <BCol cols='2'>{t('federation.lastAnnouncedAt')}</BCol>
            <BCol cols='2'>{t('federation.createdAt')}</BCol>
          </BRow>
          {communities.value.map((item: { publicKey: string; foreign: boolean }) => (
            <BListGroupItem key={item.publicKey} variant={!item.foreign ? 'primary' : 'warning'}>
              <CommunityVisualizeItem item={item as never} />
            </BListGroupItem>
          ))}
        </BListGroup>
      </div>
    )
  },
})
