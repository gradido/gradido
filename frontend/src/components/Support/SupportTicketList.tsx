// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import PaginatorRouteParamsPage from '@/components/PaginatorRouteParamsPage.vue'
import {
  SupportTicketListItem,
  type SupportTicketRow,
} from '@/components/Support/SupportTicketListItem'
import CONFIG from '@/config'
import { PAGE_SIZE } from '@/constants'
import { listSupportTickets } from '@/graphql/supportTickets.graphql'

/**
 * "Meine Anfragen": the member's own requests, the newest first, a page at a time -- without
 * search and group filter (SUA-017). The list carries no threads; a row asks for its own when
 * it is opened.
 */
export const SupportTicketList = defineComponent({
  name: 'SupportTicketList',
  setup() {
    const route = useRoute()
    const { t } = useI18n()

    const currentPage = ref(Number(route.params.page) || 1)
    const openTicketId = ref<number | null>(null)

    const { result, loading, refetch } = useQuery(
      listSupportTickets,
      () => ({ currentPage: currentPage.value, pageSize: PAGE_SIZE }),
      { fetchPolicy: 'cache-and-network', pollInterval: CONFIG.AUTO_POLL_INTERVAL || undefined },
    )

    const count = computed<number>(() => result.value?.listSupportTickets.count ?? 0)
    const tickets = computed<SupportTicketRow[]>(
      () => result.value?.listSupportTickets.tickets ?? [],
    )

    const toggle = (id: number) => {
      openTicketId.value = openTicketId.value === id ? null : id
    }

    return () => (
      <>
        {tickets.value.length === 0 && !loading.value ? (
          <div class='page-text' data-test='support-no-requests'>
            {currentPage.value === 1
              ? t('support.noRequests')
              : t('contribution.noContributions.emptyPage')}
          </div>
        ) : (
          <div class='support-ticket-list'>
            {tickets.value.map((ticket) => (
              <div key={ticket.id} id={`supportTicket-${ticket.id}`} class='mb-3'>
                <SupportTicketListItem
                  {...ticket}
                  messagesVisible={openTicketId.value === ticket.id}
                  onToggle-messages-visible={() => toggle(ticket.id)}
                  onTicket-changed={() => refetch()}
                />
              </div>
            ))}
          </div>
        )}
        <PaginatorRouteParamsPage
          modelValue={currentPage.value}
          pageSize={PAGE_SIZE}
          totalCount={count.value}
          loading={loading.value}
          onUpdate:modelValue={(page: number) => {
            currentPage.value = page
          }}
        />
      </>
    )
  },
})
