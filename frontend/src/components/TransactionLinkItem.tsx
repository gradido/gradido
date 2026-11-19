// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'

export const TransactionLinkItem = defineComponent({
  name: 'TransactionLinkItem',
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => <div>{slots[props.type]?.()}</div>
  },
})
