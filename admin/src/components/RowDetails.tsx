// AI-GENERATED — not an architecture reference
import { BButton, BCard } from 'bootstrap-vue-next'
import { defineComponent, h, resolveComponent } from 'vue'
import { useI18n } from 'vue-i18n'

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

    return () => {
      // ⚠️ bootstrap-vue-next has no BIcon, so the build never resolved <b-icon>: it renders
      // as an unknown element and shows no icon. Kept as it was.
      const icon = resolveComponent('b-icon')
      return (
        <BCard class='shadow-lg ps-3 pe-3 mb-5 bg-white rounded'>
          {slots[props.slotName]?.()}
          <BButton size='sm' onClick={() => emit('row-toggle-details', props.row, props.index)}>
            {h(icon, {
              icon: props.type === 'PageCreationConfirm' ? 'x' : 'eye-slash-fill',
              'aria-label': 'Help',
            })}{' '}
            {t('hide_details')}
          </BButton>
        </BCard>
      )
    }
  },
})
