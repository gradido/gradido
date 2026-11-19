// AI-GENERATED — not an architecture reference
import { BButton } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { type LinkGreeting, TransactionLink } from '@/components/TransactionLinks/TransactionLink'
import type { TransactionLinkRow } from '@/components/Transactions/TransactionLinkSummary'
import IBiThreeDots from '~icons/bi/three-dots'

/**
 * What a row takes of a link of the member's own. The list above hands its rows on as the
 * server gave them (`TransactionLinkRow`), and each is bound to its row whole, as `v-bind` did.
 */
type TransactionLinkItem = {
  id: number
  holdAvailableAmount: string
  amount: number
  validUntil: string
  link: string
  memo: string
  greeting?: LinkGreeting | null
}

export const CollapseLinksList = defineComponent({
  name: 'CollapseLinksList',
  props: {
    transactionLinks: { type: Array as PropType<TransactionLinkRow[]>, required: true },
    transactionLinkCount: {
      type: Number,
      required: true,
    },
    modelValue: { type: Number, required: true },
    pageSize: { type: Number, default: 5 },
    pending: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const buttonText = computed(() => {
      const i = props.transactionLinkCount - props.transactionLinks.length
      // ONE, not zero: the count is what the sentence is about, and every plural rule
      // reads 1 as the singular. Zero landed on the plural form in every language --
      // "die letzten 0 Links nachladen" -- because zero is not one.
      if (i === 1) {
        return t('link-load', 1)
      }
      if (i <= props.pageSize) {
        return t('link-load', { n: i })
      }
      return t('link-load-more', { n: props.pageSize })
    })

    const resetTransactionLinkList = () => {
      emit('update:modelValue', 0)
    }
    const loadMoreLinks = () => {
      emit('update:modelValue', props.modelValue + 1)
    }

    return () => (
      <div class='collapse-links-list'>
        <div class='d-flex'>
          <div class='w-100'>
            <hr />
            <div>
              {props.transactionLinks.map((item) => (
                <TransactionLink
                  {...(item as TransactionLinkItem)}
                  key={item.id}
                  onReset-transaction-link-list={resetTransactionLinkList}
                />
              ))}
              <div class='mb-3'>
                {!props.pending && props.transactionLinks.length < props.transactionLinkCount ? (
                  <BButton
                    class='test-button-load-more w-100 rounded-5'
                    // Not a prop of the library's button: it falls through, as it did in the template.
                    {...{ block: '' }}
                    variant='outline-primary'
                    onClick={withModifiers(loadMoreLinks, ['stop'])}
                  >
                    {buttonText.value}
                  </BButton>
                ) : null}
                <div class='text-center'>
                  {props.pending ? (
                    <IBiThreeDots
                      // Not attributes an svg knows: they fall through, as they did in the template.
                      {...{ animation: 'cylon', 'font-scale': '4' }}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
})
