// AI-GENERATED — not an architecture reference
import { BButton } from 'bootstrap-vue-next'
import { defineComponent, Teleport } from 'vue'
import { useI18n } from 'vue-i18n'
import IBiX from '~icons/bi/x'
import classes from './AppModal.module.scss'

export const AppModal = defineComponent({
  name: 'AppModal',
  props: {
    modelValue: Boolean,
    title: {
      type: String,
      default: '',
    },
    okOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'on-ok'],
  setup(props, { slots, emit }) {
    const { t } = useI18n()

    const closeModal = () => {
      emit('update:modelValue', false)
    }

    return () => (
      <Teleport to='body'>
        {props.modelValue ? (
          <div class={['modal-overlay', classes['modal-overlay']]} onClick={closeModal}>
            <div class='modal-content' onClick={(event: MouseEvent) => event.stopPropagation()}>
              <div class='modal-header'>
                <h3>{props.title}</h3>
                <button class='close-button' onClick={closeModal}>
                  <IBiX />
                </button>
              </div>
              <div class='modal-body'>{slots.default?.()}</div>
              <div class='modal-footer'>
                {props.okOnly ? (
                  <BButton class='btn-success' onClick={() => emit('on-ok')}>
                    {t('form.ok')}
                  </BButton>
                ) : (
                  (slots.footer?.() ?? (
                    // $t, not $. `$` is nothing in a template, so this branch threw the moment
                    // it rendered - which it never did: both users so far pass their own footer,
                    // and this delivery adds the third.
                    <BButton onClick={closeModal}>{t('form.close')}</BButton>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Teleport>
    )
  },
})
