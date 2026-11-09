// AI-GENERATED — not an architecture reference
import { BCol, BCollapse, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DecayInformationDecay from '@/components/DecayInformations/DecayInformation-Decay.vue'
import CollapseIcon from '@/components/TransactionRows/CollapseIcon.vue'
import VariantIcon from '@/components/VariantIcon.vue'
import classes from './TransactionDecay.module.scss'

/** The decay of a booking as `transactionList` carries it: the amount and the span it ran over. */
export type Decay = {
  decay: string
  start: string | null
  end: string | null
  duration: number | null
}

/** The virtual first row of the booking list: what decayed since the last booking, opening on the calculation. */
export const TransactionDecay = defineComponent({
  name: 'TransactionDecay',
  props: {
    amount: { type: String, required: true },
    balance: { type: String, required: true },
    decay: { type: Object as PropType<Decay>, required: true },
  },
  setup(props, { expose }) {
    const { t } = useI18n()
    const visible = ref(false)

    const previousBalance = computed(() =>
      String(Number(props.balance) - Number(props.decay.decay)),
    )

    expose({ visible, previousBalance })

    return () => (
      <div
        class={['transaction-slot-decay', classes['transaction-slot-decay']]}
        onClick={() => {
          visible.value = !visible.value
        }}
      >
        <BRow class='text-color-gdd-yellow align-items-center'>
          <BCol cols='1'>
            <VariantIcon icon='droplet-half' variant='gold' />
          </BCol>
          <BCol>{t('decay.decay_since_last_transaction')}</BCol>
          <BCol cols='12' md='1' lg='1' class='text-end'>
            <CollapseIcon class='text-end' visible={visible.value} />
          </BCol>
        </BRow>

        <BCollapse class='pb-4 pt-5' modelValue={visible.value}>
          <DecayInformationDecay
            balance={props.balance}
            decay={props.decay.decay}
            previousBalance={previousBalance.value}
          />
        </BCollapse>
      </div>
    )
  },
})
