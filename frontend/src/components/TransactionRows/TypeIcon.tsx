// AI-GENERATED — not an architecture reference
import { defineComponent, h, resolveComponent } from 'vue'

export const TypeIcon = defineComponent({
  name: 'TypeIcon',
  props: {
    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <div class='type-icon'>
        <div class='gdd-transaction-list-item-icon'>
          {/* Looked up by name at render time, as the template did: nothing in this wallet
              registers a `b-icon`, so this renders the unknown element it always rendered. */}
          {h(resolveComponent('b-icon'), {
            icon: props.icon,
            class: [props.color, 'm-mb-1 font2em'],
          })}
        </div>
      </div>
    )
  },
})
