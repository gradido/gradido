// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BButton, BCollapse, BPagination, BTable, vBToggle } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { useViewport } from '@/composables/useViewport'
import { DESK_PAGER_LIMIT, PHONE_PAGER_LIMIT } from '@/constants'
import { adminListContributionsShort } from '../graphql/adminListContributions.graphql'

type ContributionRow = { item: { contributionDate: string } }

export const CreationTransactionList = defineComponent({
  name: 'CreationTransactionList',
  props: {
    userId: { type: Number, required: true },
  },
  setup(props) {
    const { t, d } = useI18n()
    // The table and the pager of a phone: `unknown` -- no matchMedia -- keeps the desk's.
    const viewport = useViewport()
    const phone = computed(() => viewport.value === 'mobile')

    const items = ref<Record<string, unknown>[]>([])
    const rows = ref(0)
    const currentPage = ref(1)
    const perPage = ref(10)

    const fields = [
      {
        key: 'createdAt',
        label: t('transactionlist.submitted'),
        formatter: (value: unknown) => {
          return new Date(value as string).toLocaleDateString()
        },
      },
      {
        key: 'contributionDate',
        label: t('transactionlist.period'),
      },
      {
        key: 'confirmedAt',
        label: t('transactionlist.confirmed'),
        formatter: (value: unknown) => {
          // null, not '': kept as it was; BTable shows both as an empty cell
          return (value ? new Date(value as string).toLocaleDateString() : null) as string
        },
      },
      {
        key: 'contributionStatus',
        label: t('transactionlist.status'),
      },
      {
        key: 'amount',
        label: t('transactionlist.amount'),
        formatter: (value: unknown) => {
          return `${value} GDD`
        },
      },
      { key: 'memo', label: t('transactionlist.memo'), class: 'text-break' },
    ]

    // ⚠️ Fixed variables: a change of page refetches page 1 again. Kept as it was.
    const { result, refetch } = useQuery(adminListContributionsShort, {
      filter: {
        userId: props.userId,
      },
      paginated: {
        currentPage: currentPage.value,
        pageSize: perPage.value,
        order: 'DESC',
      },
    })

    watch(result, (newResult) => {
      if (newResult && newResult.adminListContributions) {
        rows.value = newResult.adminListContributions.contributionCount
        items.value = newResult.adminListContributions.contributionList
      }
    })

    watch(currentPage, () => {
      refetch()
    })

    return () => (
      <div class='component-creation-transaction-list'>
        <div class='h3'>{t('transactionlist.title')}</div>
        {/* On a phone the cells of a row stand under each other, each under the name of its
            column; at the desk the table it has always been, without the names in its cells. */}
        <BTable
          striped
          hover
          stacked='md'
          labelStacked={phone.value}
          fields={fields}
          items={items.value}
        >
          {{
            'cell(contributionDate)': (data: ContributionRow) => [
              <div class='font-weight-bold'>
                {d(new Date(data.item.contributionDate), 'month')}
              </div>,
              <div>{d(new Date(data.item.contributionDate))}</div>,
            ],
          }}
        </BTable>
        <div>
          {/* As on the pages: three numbers on a phone, five places and « » at the desk. */}
          <BPagination
            v-model={currentPage.value}
            class='phone-pager'
            pills
            size='lg'
            perPage={perPage.value}
            totalRows={rows.value}
            align='center'
            limit={phone.value ? PHONE_PAGER_LIMIT : DESK_PAGER_LIMIT}
            noGotoEndButtons={phone.value}
          />
          {withDirectives(
            <BButton variant='light' size='sm'>
              {t('help.help')}
            </BButton>,
            [[vBToggle, 'collapse-1']],
          )}
          <BCollapse id='collapse-1' class='mt-2'>
            <div>
              {t('transactionlist.submitted')} {t('math.equals')}{' '}
              {t('help.transactionlist.submitted')}
            </div>
            <div>
              {t('transactionlist.period')} {t('math.equals')} {t('help.transactionlist.periods')}
            </div>
            <div>
              {t('transactionlist.confirmed')} {t('math.equals')}{' '}
              {t('help.transactionlist.confirmed')}
            </div>
            <div>
              {t('transactionlist.status')} {t('math.equals')} {t('help.transactionlist.status')}
            </div>
          </BCollapse>
        </div>
      </div>
    )
  },
})
