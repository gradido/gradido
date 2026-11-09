// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'

/** The shell of a row in the booking list: the row itself comes through the `item` slot or the one named after its type. */
export const TransactionListItem = defineComponent({
  name: 'TransactionListItem',
  props: {
    typeId: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () => (
      <div>
        {slots.item?.()}
        {slots[props.typeId]?.()}
      </div>
    )
  },
})
