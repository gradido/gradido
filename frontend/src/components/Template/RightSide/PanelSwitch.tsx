// AI-GENERATED — not an architecture reference
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import classes from './PanelSwitch.module.scss'

export interface PanelSwitchOption {
  value: string
  label: string
  share?: number
}

/**
 * The switch over the right-hand column: the newest bookings or the contacts (KF-009). The
 * two words themselves come from `transaction.lastTransactions` / `rightSide.contacts`.
 *
 * It knows nothing about either panel -- it is handed the positions and says which one was
 * picked. What the positions mean, and which one a route starts on, is the layout's
 * business, and remembering the answer is `useRightSidePref`.
 *
 * ⛔ It also carries the column's heading, and that is the whole point of the shape below.
 * The panels used to print their own `h3` under this control, so the answer was written
 * twice -- once quietly in the active segment, once loudly right beneath it -- and the two
 * together ate the top of a column that is three grid columns wide. The active tab IS the
 * heading now, which is why it is set at heading weight rather than at control size.
 * (Bernd, 03.09.2026: "anstatt der Überschrift eben diese beiden Buttons".)
 */
export const PanelSwitch = defineComponent({
  name: 'PanelSwitch',
  props: {
    /** The position in force. */
    modelValue: { type: String, required: true },
    /**
     * `[{ value, label, share }]` -- the label is the FINISHED word, not a key.
     *
     * `share` is how much of the row that position takes, relative to the others; it
     * defaults to 1. ⛔ It is the CALLER's to set, not this component's to guess by
     * position: which word is long depends on the language, and a rule like "the first
     * one is wider" would be a claim about content this component never sees.
     *
     * ⛔ Not a key. `t(option.label)` would read the key out of a variable, and the i18n lint
     * only counts literal ones -- every position's word would be reported as unused and the
     * next tidy-up would delete it from ten files. The caller translates; this shows.
     */
    options: { type: Array as PropType<PanelSwitchOption[]>, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // A tap on the position that already stands is not a change. Without this it would write
    // the same answer to the device again on every tap, and emit an update the layout would
    // have to recognise as a no-op.
    const pick = (value: string) => {
      if (value !== props.modelValue) {
        emit('update:modelValue', value)
      }
    }

    // Two words, one of them in force. A pair of tabs rather than a dropdown or a gear:
    // both positions are named and one tap away, which is what makes this not a setting
    // (E-020, KF-009).
    return () => (
      <div
        class={['panel-switch', classes['panel-switch']]}
        role='group'
        aria-label={t('rightSide.aria')}
        data-test='panel-switch'
      >
        {props.options.map((option) => (
          <button
            key={option.value}
            type='button'
            class={['panel-switch-segment', option.value === props.modelValue ? 'active' : '']}
            style={{ flexGrow: option.share ?? 1 }}
            aria-pressed={option.value === props.modelValue ? 'true' : 'false'}
            data-test={`panel-switch-${option.value}`}
            onClick={() => pick(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    )
  },
})
