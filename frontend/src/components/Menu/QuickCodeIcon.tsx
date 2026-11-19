// AI-GENERATED — not an architecture reference
import { defineComponent, type PropType } from 'vue'
import IMdiArrowDownThick from '~icons/mdi/arrow-down-thick'
import IMdiArrowUpThick from '~icons/mdi/arrow-up-thick'
import IMdiQrcode from '~icons/mdi/qrcode'
import classes from './QuickCodeIcon.module.scss'

/**
 * A QR symbol with a small arrow, for the two shortcuts that show a member's OWN code.
 *
 * The two codes look the same to the eye -- both are "hold up my square" -- and what
 * separates them is which way the Gradido move afterwards. So that is what the symbol
 * says, and it is the only thing it says:
 *
 *   out  the thank-you card: somebody takes payment from me
 *   in   the Gradido card:   somebody sends to me
 *
 * A component rather than markup repeated in both menus, and not because of the two
 * copies. `DashboardLayout`'s style block is GLOBAL, so a shared class name there styles
 * across components -- which is why the scanner and the calculator carry two class names
 * for one look. A component brings its own style module and ends that whole question.
 *
 * No ready-made glyph exists: mdi, tabler, bi and ion each offer `qrcode` and
 * `qrcode-scan` and nothing with a direction, so the two parts are composed here.
 */
export const QuickCodeIcon = defineComponent({
  name: 'QuickCodeIcon',
  props: {
    // 'out' -- Gradido leave me; 'in' -- Gradido come to me.
    direction: {
      type: String as PropType<'in' | 'out'>,
      required: true,
      validator: (value: string) => ['in', 'out'].includes(value),
    },
  },
  setup(props) {
    return () => (
      <span class={['quick-code-icon', classes['quick-code-icon']]}>
        <IMdiQrcode class='quick-code-icon-code' />
        {props.direction === 'out' ? (
          <IMdiArrowUpThick class='quick-code-icon-arrow' data-test='quick-code-arrow-out' />
        ) : (
          <IMdiArrowDownThick class='quick-code-icon-arrow' data-test='quick-code-arrow-in' />
        )}
      </span>
    )
  },
})
