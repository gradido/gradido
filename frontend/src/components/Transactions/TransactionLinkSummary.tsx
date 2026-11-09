// AI-GENERATED — not an architecture reference
import type { ApolloQueryResult } from '@apollo/client/core'
import { useQuery } from '@vue/apollo-composable'
import { BAvatar, BCol, BCollapse, BRow } from 'bootstrap-vue-next'
import { defineComponent, type PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CollapseLinksList from '@/components/DecayInformations/CollapseLinksList.vue'
import CollapseIcon from '@/components/TransactionRows/CollapseIcon.vue'
import type { Decay } from '@/components/Transactions/TransactionDecay'
import VariantIcon from '@/components/VariantIcon.vue'
import { useFilters } from '@/composables/useFilters'
import { useAppToast } from '@/composables/useToast'
import { LIST_AVATAR_SIZE } from '@/constants'
import { listTransactionLinks } from '@/graphql/queries'
import classes from './TransactionLinkSummary.module.scss'

/** A link as `listTransactionLinks` carries it; the list beneath reads every field by name. */
export type TransactionLinkRow = { id: number } & Record<string, unknown>

/** The virtual second row of the booking list: the sum of the member's open links, opening on the links themselves. */
export const TransactionLinkSummary = defineComponent({
  name: 'TransactionLinkSummary',
  props: {
    amount: { type: String, required: true },
    decay: { type: Object as PropType<Decay>, required: true },
    // Every link that has not been redeemed, expired ones included - the list below shows
    // them all, so this is what its paging counts against.
    transactionLinkCount: { type: Number, required: true },
    // Only the links that can still be redeemed. Fewer, and the number worth telling.
    openLinkCount: { type: Number, required: true },
  },
  emits: ['update-transactions'],
  setup(props, { emit, expose }) {
    const { t } = useI18n()
    const { GDD } = useFilters()
    const { toastError } = useAppToast()

    const visible = ref(false)
    const transactionLinks = ref<TransactionLinkRow[]>([])
    const currentPage = ref(1)
    const pageSize = ref(5)
    const pending = ref(false)

    const { refetch } = useQuery(listTransactionLinks, {
      currentPage: currentPage.value,
    })

    const updateListTransactionLinks = async () => {
      if (currentPage.value === 0) {
        transactionLinks.value = []
        currentPage.value = 1
      } else {
        pending.value = true
        try {
          // `refetch` answers nothing only while the query is switched off, and this one never is.
          const { data } = (await refetch({
            currentPage: currentPage.value,
          })) as ApolloQueryResult<{
            listTransactionLinks: { links: TransactionLinkRow[] }
          }>
          transactionLinks.value = [...transactionLinks.value, ...data.listTransactionLinks.links]
          emit('update-transactions')
        } catch (err) {
          toastError((err as Error).message)
        } finally {
          pending.value = false
        }
      }
    }

    watch(currentPage, () => {
      updateListTransactionLinks()
    })

    const showTransactionLinks = (evt: MouseEvent) => {
      const targetClassNames = [...(evt.target as HTMLElement).classList]
      if (
        targetClassNames.includes('link-menu-opener') ||
        targetClassNames.includes('btn-secondary')
      ) {
        return
      }
      if (visible.value) {
        visible.value = false
      } else {
        transactionLinks.value = []
        if (currentPage.value === 1) {
          updateListTransactionLinks()
        } else {
          currentPage.value = 1
        }
        visible.value = true
      }
    }

    expose({
      visible,
      transactionLinks,
      currentPage,
      showTransactionLinks,
      updateListTransactionLinks,
    })

    return () => (
      <div
        class={['transaction-slot-link', classes['transaction-slot-link']]}
        onClick={showTransactionLinks}
      >
        <BRow class='align-items-center'>
          <BCol id='transaction-link-summary-avatar' cols='3' lg='2' md='2'>
            {/* It stands where the bookings around it have a face, so at their size. */}
            <BAvatar variant='light' size={LIST_AVATAR_SIZE}>
              <VariantIcon icon='link' />
            </BAvatar>
          </BCol>
          <BCol>
            <div>{t('gdd_per_link.links_sum')}</div>
            <div class='small'>{t('gdd_per_link.links_open', { n: props.openLinkCount })}</div>
          </BCol>
          {/* On the phone the amount and the arrow start a line of their own, together -- this
              break is what makes them one line rather than two. From `md` on it is gone and
              everything stands in one line, as before. Taken from the booking row, which was
              given the same treatment on 11.09.2026 for the same fault: on `cols=12` the arrow
              dropped onto a line of its own at the bottom, where nobody looks for it. */}
          <div class='w-100 d-md-none' />
          {/* ⛔ `col` has to be SAID. bootstrap-vue-next adds the plain `col` class only to a
              column that has no breakpoint sizes at all; with `md`/`lg` given, the phone would
              get no width class and Bootstrap's `.row > *` would make the amount 100% wide
              beside its 25% offset -- past the row's right edge. */}
          <BCol col offset='3' md='3' lg='3' offsetMd='0' offsetLg='0'>
            {/* No heading over the amount. The one that stood here was the label of the send
                button, which describes no sum, and it went wrong unnoticed the moment that
                button was renamed. The amount carries its own sign and unit. */}
            <div class='fw-bold'>{GDD(props.amount)}</div>
          </BCol>
          <BCol cols='auto' class='d-flex justify-content-end align-items-center'>
            <CollapseIcon class='text-end' visible={visible.value} />
          </BCol>
        </BRow>
        <BCollapse modelValue={visible.value}>
          <CollapseLinksList
            modelValue={currentPage.value}
            onUpdate:modelValue={(page: number) => {
              currentPage.value = page
            }}
            pending={pending.value}
            pageSize={pageSize.value}
            transactionLinkCount={props.transactionLinkCount}
            transactionLinks={transactionLinks.value}
          />
        </BCollapse>
      </div>
    )
  },
})
