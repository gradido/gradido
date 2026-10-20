// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { BPagination, BTable } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
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
        label: 'status',
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
            <BTable striped hover fields={fields.value} items={items.value} />
          </div>
        ) : null}
        <BPagination
          v-model={currentPage.value}
          pills
          size='lg'
          perPage={perPage.value}
          totalRows={rows.value}
          align='center'
          // ⚠️ No prop of BPagination: it lands on the element as an attribute, as it did
          hide-ellipsis={true}
        />
      </div>
    )
  },
})
