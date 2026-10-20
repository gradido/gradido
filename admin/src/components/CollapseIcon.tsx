// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import IBiArrowDownCircle from '~icons/bi/arrow-down-circle'
import IBiArrowUpCircle from '~icons/bi/arrow-up-circle'

export const CollapseIcon = defineComponent({
  name: 'CollapseIcon',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class='collapse-icon'>
        {props.visible ? (
          <IBiArrowUpCircle class='text-black h2' />
        ) : (
          <IBiArrowDownCircle class='text-muted h2' />
        )}
      </div>
    )
  },
})
