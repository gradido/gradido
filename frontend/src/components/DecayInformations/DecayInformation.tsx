// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType } from 'vue'
import type { Decay } from '@/components/Transactions/TransactionDecay'
import CONFIG from '@/config'
import { DecayInformationBeforeStartblock } from '../DecayInformations/DecayInformation-BeforeStartblock'
import { DecayInformationDecayStartblock } from '../DecayInformations/DecayInformation-DecayStartblock'
import { DecayInformationLong } from '../DecayInformations/DecayInformation-Long'

export const DecayInformation = defineComponent({
  name: 'DecayInformation',
  props: {
    amount: {
      type: String,
      required: true,
    },
    decay: {
      type: Object as PropType<Decay>,
      required: true,
    },
    typeId: {
      type: String,
      required: true,
    },
    balance: {
      type: String,
      required: true,
    },
    previousBalance: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const isStartBlock = computed(
      () =>
        new Date(props.decay.start as string).getTime() ===
        (CONFIG.DECAY_START_TIME as Date).getTime(),
    )

    return () => (
      <div class='decay-information-box'>
        {/* No memo in here any more: it stands in the booking's row, readable before this part
            opens and shown whole in the same place once it does (GddTransaction). */}
        {props.decay.start === null ? (
          <DecayInformationBeforeStartblock />
        ) : isStartBlock.value ? (
          <DecayInformationDecayStartblock
            amount={props.amount}
            decay={props.decay}
            typeId={props.typeId}
          />
        ) : (
          <DecayInformationLong
            amount={props.amount}
            decay={props.decay}
            typeId={props.typeId}
            balance={props.balance}
            previousBalance={props.previousBalance}
          />
        )}
      </div>
    )
  },
})
