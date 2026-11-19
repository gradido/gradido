// AI-GENERATED — not an architecture reference
import { BFormInput } from 'bootstrap-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const FirstName = defineComponent({
  name: 'FirstName',
  props: {
    value: { type: String, default: '' },
  },
  setup(props, { expose }) {
    const { t } = useI18n()

    const firstName = ref(props.value)

    const firstNameState = computed(() => firstName.value.length > 2)

    // What the specs read of the field.
    expose({ firstName, firstNameState })

    return () => (
      <div role='group' class='first-name'>
        <label for='input-firstName'>{t('form.firstname')}</label>
        <BFormInput
          id='input-firstName'
          modelValue={firstName.value}
          onUpdate:modelValue={(entered) => {
            firstName.value = String(entered ?? '')
          }}
          state={firstNameState.value}
          aria-describedby='input-live-help input-live-feedback'
          placeholder='Enter your firstName'
          // no prop of BFormInput: it lands on the element as the empty attribute the template
          // left there
          {...({ trim: '' } as object)}
        />

        {/* This will only be shown if the preceding input has an invalid state */}
        {/* <b-form-invalid-feedback id="input-live-feedback">
          Enter at least 3 letters
        </b-form-invalid-feedback> */}

        {/* This is a form text block (formerly known as help block) */}
        {/* <b-form-text id="input-live-help">Dein Vorname</b-form-text> */}
      </div>
    )
  },
})
