// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import IBiThreeDots from '~icons/bi/three-dots'

export const Status = defineComponent({
  name: 'Status',
  props: {
    balance: { type: Number, default: 0 },
    pending: {
      type: Boolean,
      default: true,
    },
    statusText: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const { t, n } = useI18n()

    return () => (
      <div class='gdd-status'>
        <div class='p-0 gdd-status-div'>
          {props.pending ? (
            <IBiThreeDots
              {...({ animation: 'cylon', 'font-scale': '4' } as object)}
              class='test-pending-icon'
            />
          ) : (
            <div>
              {props.pending || props.balance === null ? t('em-dash') : n(props.balance, 'decimal')}{' '}
              {props.statusText}
            </div>
          )}
        </div>
      </div>
    )
  },
})
