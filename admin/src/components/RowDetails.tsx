// AI-GENERATED — not an architecture reference
import { BButton, BCard } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import IBiEyeSlashFill from '~icons/bi/eye-slash-fill'
import IBiX from '~icons/bi/x'

export const RowDetails = defineComponent({
  name: 'RowDetails',
  props: {
    row: { required: true, type: Object },
    slotName: { required: true, type: String },
    type: { required: true, type: String },
    index: { required: true, type: Number },
  },
  emits: ['row-toggle-details'],
  setup(props, { emit, slots }) {
    const { t } = useI18n()

    // The card takes its surface from Bootstrap's `--bs-card-bg`, which a dark mode can turn.
    // The symbol of the button used to be a <b-icon>, which bootstrap-vue-next does not have:
    // it rendered as an unknown element and showed nothing.
    return () => (
      <BCard class='shadow-lg ps-3 pe-3 mb-5 rounded'>
        {slots[props.slotName]?.()}
        <BButton size='sm' onClick={() => emit('row-toggle-details', props.row, props.index)}>
          {props.type === 'PageCreationConfirm' ? (
            <IBiX aria-hidden='true' />
          ) : (
            <IBiEyeSlashFill aria-hidden='true' />
          )}{' '}
          {t('hide_details')}
        </BButton>
      </BCard>
    )
  },
})
