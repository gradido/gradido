// AI-GENERATED — not an architecture reference
import { BButton, BModal } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, type SlotsType } from 'vue'
import { useI18n } from 'vue-i18n'

export type DecisionItem = {
  amount: string
  contributionDate: string
  memo: string
  user: { firstName: string; lastName: string; emailContact: { email: string } }
}

/**
 * The question before a contribution is confirmed, denied or deleted: what it is, who it is
 * from, and the button that carries the decision out.
 *
 * A dialog on every width (Bernd, 23.10.2026, AO-004). It replaces an overlay that covered the
 * page and could not be scrolled: on a 320 × 568 phone both of its buttons lay below the edge.
 * Here the body scrolls and the footer stays in the window -- the decision first, on a phone
 * above the way back, at the desk to the right of it.
 *
 * Escape, the × and the backdrop close it through the v-model, as the cancel button does
 * through `overlay-cancel`; none of them sends anything.
 */
export const DecisionModal = defineComponent({
  name: 'DecisionModal',
  props: {
    modelValue: { type: Boolean, default: false },
    item: { type: Object as PropType<DecisionItem>, required: true },
  },
  emits: ['update:modelValue', 'overlay-cancel'],
  slots: Object as SlotsType<{
    title: Record<string, never>
    text: Record<string, never>
    question: Record<string, never>
    'submit-btn': Record<string, never>
  }>,
  setup(props, { emit, slots }) {
    const { t, d } = useI18n()

    // The dialog is drawn while it is closed too, before any contribution was chosen: the page
    // hands it an empty item until then, and an invalid date would throw in the formatter.
    const month = computed(() => {
      const date = new Date(props.item.contributionDate)
      return Number.isNaN(date.getTime()) ? '' : `${d(date, 'month')} ${d(date, 'year')}`
    })

    const line = (label: string, value: unknown, valueClass = '') => (
      <div class='row mb-2'>
        <div class='col-4 text-body-secondary'>{label}</div>
        <div class={['col-8', valueClass]}>{value}</div>
      </div>
    )

    return () => (
      <BModal
        modelValue={props.modelValue}
        onUpdate:modelValue={(value: boolean) => emit('update:modelValue', value)}
        centered
        scrollable
      >
        {{
          title: () => slots.title?.({}),
          default: () => [
            line(
              t('transactionlist.amount'),
              props.item.amount ? `${props.item.amount} ${t('GDD')}` : '',
              'fs-5 fw-bold',
            ),
            line(t('creation_for_month'), month.value, 'fs-5'),
            line(t('transactionlist.memo'), props.item.memo, 'text-break'),
            line(
              t('name'),
              props.item.user
                ? `${props.item.user.firstName ?? ''} ${props.item.user.lastName ?? ''}`.trim()
                : '',
            ),
            line(t('e_mail'), props.item.user?.emailContact?.email, 'text-break'),
            <hr />,
            slots.text?.({}),
            slots.question?.({}),
          ],
          // The decision first: on a phone it stands above the way back, at the desk to the
          // right of it.
          footer: () => (
            <div class='d-flex flex-column flex-sm-row-reverse gap-2 align-items-stretch w-100'>
              {slots['submit-btn']?.({})}
              <BButton variant='outline-secondary' onClick={() => emit('overlay-cancel')}>
                {t('overlay.cancel')}
              </BButton>
            </div>
          ),
        }}
      </BModal>
    )
  },
})
