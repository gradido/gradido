// AI-GENERATED — not an architecture reference
import { BPagination } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TransactionListItem } from '@/components/TransactionListItem'
import GddTransaction from '@/components/Transactions/GddTransaction.vue'
import { type Decay, TransactionDecay } from '@/components/Transactions/TransactionDecay'
import { TransactionLinkSummary } from '@/components/Transactions/TransactionLinkSummary'
import VariantIcon from '@/components/VariantIcon.vue'
import { usePagerFit } from '@/composables/usePagerFit'
import { PAGE_SIZE } from '@/constants'
import IBiThreeDots from '~icons/bi/three-dots'
import './GddTransactionList.css'

/** The counterparty of a booking, as `transactionList` names them. */
export type LinkedUser = {
  gradidoID: string | null
  alias: string | null
  communityUuid?: string | null
  communityName?: string | null
}

/** A row of `transactionList`: a booking, or one of the two virtual rows (decay, link summary). */
export type TransactionRow = {
  id: number
  typeId: string
  amount: string
  balance: string
  linkedUser: LinkedUser | null
  decay: Decay
  [field: string]: unknown
}

/** The pager's page: what the paginator sends, what the page is asked for. */
export type TransactionsPage = { currentPage: number; pageSize: number }

/** The member's bookings, a page at a time, with the decay and link rows above them. */
export const GddTransactionList = defineComponent({
  name: 'GddTransactionList',
  props: {
    // `false` or `null` is "no list from the server", shown as such further up.
    transactions: {
      type: Array as PropType<TransactionRow[] | false | null>,
      default: () => [],
    },
    /**
     * The page these rows ARE -- decided, fetched and held by the transactions page, which owns
     * the query behind them.
     *
     * ⛔ Not this component's own state. It was until 30.08.2026, and the two drifted apart
     * every time a page number survived a navigation that rebuilt this component. The way
     * to another page is `askForPage`: ask, and the number comes back down here with the
     * rows it belongs to.
     */
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: PAGE_SIZE },
    timestamp: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
    openLinkCount: { type: Number, default: 0 },
    showPagination: { type: Boolean, default: false },
    pending: { type: Boolean },
    /** Whether these rows are the bookings shared with ONE member rather than the account. */
    narrowed: { type: Boolean, default: false },
  },
  // Declared, so that the handler does not also land on the root element as a plain
  // attribute -- and so that the two events this list raises are readable in one place.
  emits: ['update-transactions', 'open-member'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { pagerLimit, pagerNoEnds } = usePagerFit()

    const isPaginationVisible = computed(
      () => props.showPagination && props.pageSize < props.transactionCount,
    )
    const hasDecayRow = computed(
      () =>
        Array.isArray(props.transactions) &&
        props.transactions.some(({ typeId }) => typeId === 'DECAY'),
    )

    const askForPage = (currentPage: number) => {
      emit('update-transactions', {
        currentPage,
        pageSize: props.pageSize,
      })
      window.scrollTo(0, 0)
    }

    // ⚠️ Dead wiring as it stands, and worth knowing before anyone traces it again: nothing
    // ever changes `timestamp`. The transactions page sets it once per mount and never writes
    // to it, and it is the only place this component is used -- so this handler cannot fire in
    // production. Left alone because removing a prop is not this change's business.
    //
    // ⚠️ Wrapped rather than handing `askForPage` over as the callback: a watcher hands its
    // callback the new value, and the new value here would be the timestamp, going out as a
    // page number.
    watch(
      () => props.timestamp,
      () => {
        askForPage(props.currentPage)
      },
    )

    return () => {
      const rows = props.transactions || []
      return (
        <div class='gdd-transaction-list'>
          <div class='list-group'>
            {!props.transactions ? (
              <div class='test-no-transactionlist text-end'>
                <VariantIcon icon='exclamation-triangle' variant='danger' class='me-2' />
                <small>{t('error.no-transactionlist')}</small>
              </div>
            ) : null}
            {props.transactionCount < 0 ? (
              <div class='test-empty-transactionlist text-end'>
                <VariantIcon icon='exclamation-triangle' variant='danger' class='me-2' />
                <small>{t('error.empty-transactionlist')}</small>
              </div>
            ) : null}

            {rows.map((row) => (
              <div key={`l1-${row.id}`}>
                {row.typeId === 'DECAY' ? (
                  <TransactionListItem
                    typeId={row.typeId}
                    class='pointer bg-white app-box-shadow gradido-border-radius px-4 pt-2 test-list-group-item'
                    v-slots={{ DECAY: () => <TransactionDecay {...row} /> }}
                  />
                ) : null}
              </div>
            ))}
            {/* The 16px under the decay row, and only there. Without one -- from page 2, and on a
                list narrowed to one member -- the page above already keeps its distance, and
                this margin doubled it: 32px on the desk, where page 1 has 16. */}
            <div class={{ 'mt-3': hasDecayRow.value }} data-test='transaction-rows'>
              {rows.map((transaction) => (
                <div key={`l2-${transaction.id}`}>
                  {transaction.typeId !== 'DECAY' ? (
                    <TransactionListItem
                      typeId={transaction.typeId}
                      class='pointer mb-3 bg-white app-box-shadow gradido-border-radius p-3 test-list-group-item'
                      v-slots={
                        transaction.typeId !== 'LINK_SUMMARY'
                          ? {
                              // Straight up to whoever owns this list: a tap on the counterparty's
                              // name opens the contact window, and there is ONE of those per list
                              // rather than one per row.
                              item: () => (
                                <GddTransaction
                                  transaction={transaction}
                                  onOpen-member={(member: LinkedUser) =>
                                    emit('open-member', member)
                                  }
                                />
                              ),
                            }
                          : {
                              // Withdrawing a link changes the list, so it asks for the page it is
                              // on to be fetched again. Named explicitly rather than handed the
                              // child's event: the child sends no page, and a later one that did
                              // would silently become the page number.
                              LINK_SUMMARY: () => (
                                <TransactionLinkSummary
                                  {...transaction}
                                  transactionLinkCount={props.transactionLinkCount}
                                  openLinkCount={props.openLinkCount}
                                  onUpdate-transactions={() => askForPage(props.currentPage)}
                                />
                              ),
                            }
                      }
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          {isPaginationVisible.value ? (
            <BPagination
              modelValue={props.currentPage}
              class='mt-3 flex-wrap'
              pills
              size='lg'
              perPage={props.pageSize}
              totalRows={props.transactionCount}
              align='center'
              noEllipsis={true}
              limit={pagerLimit.value}
              noGotoEndButtons={pagerNoEnds.value}
              onUpdate:modelValue={(page: number | string) => askForPage(Number(page))}
            />
          ) : null}
          {/* Exactly zero, not "nothing positive": -1 is the failed request above, and a
              sentence about bookings has no business under an error banner. */}
          {props.transactionCount === 0 ? (
            <div class='mt-4 text-center'>
              {props.pending ? (
                <IBiThreeDots />
              ) : props.narrowed ? (
                // Two kinds of nothing. "You have no transactions yet" is false under a list
                // narrowed to one member -- the member may have hundreds, only none with this
                // person -- and told so they would go looking for their money.
                <div>{t('transaction.noneWithMember')}</div>
              ) : (
                <div>{t('transaction.nullTransactions')}</div>
              )}
            </div>
          ) : null}
        </div>
      )
    }
  },
})
