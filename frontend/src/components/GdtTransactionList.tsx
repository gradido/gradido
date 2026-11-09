// AI-GENERATED — not an architecture reference
import { BButton, BPagination } from 'bootstrap-vue-next'
import { defineComponent, type PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Transaction } from '@/components/Transaction'
import { usePagerFit } from '@/composables/usePagerFit'
import { useWalletStore } from '@/store/useWalletStore'
import './GdtTransactionList.css'

/** A GDT entry as `listGDTEntries` carries it. */
export type GdtEntry = {
  id: number
  amount: number
  date: string
  comment: string
  gdtEntryType: string
  factor: number
  gdt: number
}

/** The member's GDT entries, a page at a time; a word about funding where there are none. */
export const GdtTransactionList = defineComponent({
  name: 'GdtTransactionList',
  props: {
    transactionsGdt: { type: Array as PropType<GdtEntry[]>, required: true },
    transactionGdtCount: { type: Number, required: true },
    pageSize: { type: Number, required: true },
    modelValue: { type: Number, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useWalletStore()
    const { pagerLimit, pagerNoEnds } = usePagerFit()

    const currentPage = ref(props.modelValue)
    const link = `https://gradido.net/${store.language}/memberships/`

    watch(
      () => props.modelValue,
      (newValue) => {
        currentPage.value = newValue
      },
    )
    watch(currentPage, (newValue) => {
      if (props.modelValue !== newValue) {
        emit('update:modelValue', newValue)
      }
    })

    return () => (
      <div class='gdt-transaction-list'>
        <div class='list-group'>
          {props.transactionGdtCount === 0 ? (
            <div class='text-center'>
              {t('gdt.no-transactions')} <hr />
              <BButton class='gdt-funding' href={link} target='_blank'>
                {t('gdt.funding')}
              </BButton>
            </div>
          ) : props.transactionGdtCount === -1 ? (
            <div class='text-center'>{t('gdt.not-reachable')}</div>
          ) : (
            props.transactionsGdt.map(
              ({ id, amount, date, comment, gdtEntryType, factor, gdt }) => (
                <div key={id}>
                  <Transaction
                    id={id}
                    amount={amount}
                    date={date}
                    comment={comment}
                    gdtEntryType={gdtEntryType}
                    factor={factor}
                    gdt={gdt}
                  />
                </div>
              ),
            )
          )}
        </div>
        {props.transactionGdtCount > props.pageSize ? (
          <BPagination
            modelValue={currentPage.value}
            onUpdate:modelValue={(page: number | string) => {
              currentPage.value = Number(page)
            }}
            class='mt-3 flex-wrap'
            pills
            size='lg'
            perPage={props.pageSize}
            totalRows={props.transactionGdtCount}
            align='center'
            noEllipsis={true}
            limit={pagerLimit.value}
            noGotoEndButtons={pagerNoEnds.value}
          />
        ) : null}
      </div>
    )
  },
})
