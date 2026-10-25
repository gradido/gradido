// AI-GENERATED — not an architecture reference
import { BCard } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'

export const RowDetails = defineComponent({
  name: 'RowDetails',
  props: {
    slotName: { required: true, type: String },
  },
  setup(props, { slots }) {
    // The card takes its surface from Bootstrap's `--bs-card-bg`, which a dark mode can turn.
    // It had a button of its own at its end, "hide details". The details button of the row closes
    // it now, its arrow turned up while the row is open (Bernd, 24.10.2026), and below the message
    // stand only "cancel" and "save".
    return () => (
      <BCard class='shadow-lg ps-3 pe-3 mb-5 rounded row-details-card'>
        {slots[props.slotName]?.()}
      </BCard>
    )
  },
})
