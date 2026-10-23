// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BPagination, BTable } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { useViewport } from '@/composables/useViewport'
import { DESK_PAGER_LIMIT, PHONE_PAGER_LIMIT } from '@/constants'
import { listTransactionLinksAdmin } from '../graphql/listTransactionLinksAdmin'

type TransactionLink = {
  deletedAt: string | null
  redeemedAt: string | null
  validUntil: string
}

export const TransactionLinkList = defineComponent({
  name: 'TransactionLinkList',
  props: {
    userId: { type: Number, required: true },
  },
  setup(props) {
    const { t, d } = useI18n()
    const { toastError } = useAppToast()
    // The table and the pager of a phone: `unknown` -- no matchMedia -- keeps the desk's.
    const viewport = useViewport()
    const phone = computed(() => viewport.value === 'mobile')

    const items = ref([])
    const rows = ref(0)
    const currentPage = ref(1)
    const perPage = ref(5)

    const fields = computed(() => [
      {
        key: 'createdAt',
        label: t('transactionlink.created'),
        formatter: (value: unknown) => d(new Date(value as string)),
      },
      {
        key: 'amount',
        label: t('transactionlist.amount'),
        formatter: (value: unknown) => `${value} GDD`,
      },
      { key: 'memo', label: t('transactionlist.memo'), class: 'text-break' },
      {
        key: 'validUntil',
        label: t('transactionlink.valid_until'),
        formatter: (value: unknown) => d(new Date(value as string)),
      },
      {
        key: 'contributionStatus',
        // Translated like the other heads; it read `status` in every language. On a phone the
        // stacked cell shows it as its name.
        label: t('transactionlist.status'),
        // BTable always hands the row over; the type only says it might not.
        formatter: (_value: unknown, _key?: unknown, row?: unknown) => {
          const item = row as TransactionLink
          if (item.deletedAt) {
            return `${t('deleted')}: ${d(new Date(item.deletedAt))}`
          }
          if (item.redeemedAt) {
            return `${t('redeemed')}: ${d(new Date(item.redeemedAt))}`
          }
          if (new Date() > new Date(item.validUntil)) {
            return `${t('expired')}: ${d(new Date(item.validUntil))}`
          }
          return t('open')
        },
      },
    ])

    const { result, error, refetch } = useQuery(listTransactionLinksAdmin, () => ({
      currentPage: currentPage.value,
      pageSize: perPage.value,
      userId: props.userId,
    }))

    watch(result, (newResult) => {
      if (newResult && newResult.listTransactionLinksAdmin) {
        rows.value = newResult.listTransactionLinksAdmin.count
        items.value = newResult.listTransactionLinksAdmin.links
      }
    })

    watch(error, (err) => {
      if (err) {
        // ⚠️ Reads `message` off the ref, not off the error, so the toast is empty. Kept as it was.
        toastError((error as unknown as { message: string }).message)
      }
    })

    watch([currentPage, perPage], () => {
      refetch()
    })

    return () => (
      <div class='transaction-link-list'>
        {items.value.length > 0 ? (
          <div>
            <div class='h3'>{t('transactionlink.name')}</div>
            {/* On a phone the cells of a link stand under each other, each under the name of
                its column; at the desk the table it has always been, without the names in its
                cells. */}
            <BTable
              striped
              hover
              stacked='lg'
              labelStacked={phone.value}
              fields={fields.value}
              items={items.value}
            />
          </div>
        ) : null}
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
      </div>
    )
  },
})
