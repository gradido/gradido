// AI-GENERATED — not an architecture reference
import {
  BButton,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BInputGroup,
} from 'bootstrap-vue-next'
import { useField } from 'vee-validate'
import { computed, defineComponent, isRef, type PropType, ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import IBiXCircle from '~icons/bi/x-circle'
import './InputUsername.scss'

export const InputUsername = defineComponent({
  name: 'InputUsername',
  props: {
    rules: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({ required: true }),
    },
    name: { type: String, default: 'username' },
    label: { type: String, default: 'Username' },
    placeholder: { type: String, default: 'Username' },
    showAllErrors: { type: Boolean, default: false },
    immediate: { type: Boolean, default: false },
    unique: { type: Boolean, required: true },
    initialUsernameValue: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useI18n()

    const currentValue = ref(props.initialUsernameValue)

    const {
      meta: usernameMeta,
      errors: usernameErrors,
      value: usernameValue,
      errorMessage: usernameError,
    } = useField<string>(props.name, props.rules, {
      initialValue: currentValue,
    })

    const clearInput = () => (usernameValue.value = '')

    const labelFor = computed(() => `${props.name}-input-field`)

    return () => (
      <div class='input-username'>
        <div>
          <BFormGroup label={t('form.username')}>
            {/* " :description="$t('settings.usernameInfo')" */}
            <BInputGroup>
              <BFormInput
                id={labelFor.value}
                modelValue={unref(usernameValue)}
                name={props.name}
                placeholder={props.placeholder}
                type='text'
                state={usernameMeta.valid}
                autocomplete='off'
                data-test='username'
                onUpdate:modelValue={(entered) => {
                  // as the template's assignment did: only into a ref
                  if (isRef(usernameValue)) {
                    usernameValue.value = entered as string
                  }
                }}
              />
              <BButton
                size='md'
                variant='secondary'
                // no props of BButton: they land on the element as the attributes the template
                // left there
                {...({ text: 'Button', append: '' } as object)}
                onClick={clearInput}
              >
                <IBiXCircle style='height: 17px; width: 17px' />
              </BButton>
            </BInputGroup>
            {unref(usernameError) || unref(usernameErrors).length ? (
              <BFormInvalidFeedback forceShow>
                {props.showAllErrors ? (
                  <div>
                    {unref(usernameErrors).map((error) => (
                      <span key={error}>
                        {error}
                        <br />
                      </span>
                    ))}
                  </div>
                ) : (
                  <div>{unref(usernameErrors)?.[0]}</div>
                )}
              </BFormInvalidFeedback>
            ) : null}
          </BFormGroup>
        </div>
      </div>
    )
  },
})
