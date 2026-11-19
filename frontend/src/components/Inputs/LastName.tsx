// AI-GENERATED — not an architecture reference
import { BFormInput } from 'bootstrap-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const LastName = defineComponent({
  name: 'LastName',
  props: {
    value: { type: String, default: '' },
  },
  setup(props, { expose }) {
    const { t } = useI18n()

    const lastName = ref(props.value)

    const lastNameState = computed(() => lastName.value.length > 2)

    // What the specs read of the field.
    expose({ lastName, lastNameState })

    return () => (
      <div role='group' class='last-name'>
        <label for='input-lastName'>{t('form.lastname')}</label>
        <BFormInput
          id='input-lastName'
          modelValue={lastName.value}
          onUpdate:modelValue={(entered) => {
            lastName.value = String(entered ?? '')
          }}
          state={lastNameState.value}
          aria-describedby='input-live-help input-live-feedback'
          placeholder='Enter your lastName'
          // no prop of BFormInput: it lands on the element as the empty attribute the template
          // left there
          {...({ trim: '' } as object)}
        />

        {/* This will only be shown if the preceding input has an invalid state */}
        {/* <b-form-invalid-feedback id="input-live-feedback">
          Enter at least 3 letters
        </b-form-invalid-feedback> */}

        {/* This is a form text block (formerly known as help block) */}
        {/* <b-form-text id="input-live-help">Dein Nachname</b-form-text> */}
      </div>
    )
  },
})
