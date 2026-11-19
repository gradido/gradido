// AI-GENERATED — not an architecture reference
import { BButton, type ButtonVariant } from 'bootstrap-vue-next'
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'

export const SuccessMessage = defineComponent({
  name: 'SuccessMessage',
  props: {
    message: {
      type: String,
      default: '',
    },
    /**
     * The words on the button, where they are not "Schließen": the send page's "Zurück", which
     * leads out of the page (E-043). A contribution that was handed in keeps "Schließen".
     */
    buttonText: {
      type: String as PropType<string | null>,
      default: null,
    },
  },
  emits: ['on-back'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return () => (
      <div class='bg-white app-box-shadow gradido-border-radius p-3'>
        <div class='p-4' data-test='success-message'>
          {t('form.thx')} <hr /> {props.message}
        </div>
        <div class='text-center mt-5'>
          <BButton
            variant={'gradido' as ButtonVariant}
            data-test='success-message-button'
            onClick={() => emit('on-back')}
          >
            {props.buttonText || t('form.close')}
          </BButton>
        </div>
      </div>
    )
  },
})
