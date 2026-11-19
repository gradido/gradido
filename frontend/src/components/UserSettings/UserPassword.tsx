// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BCard, BCol, BForm, BRow } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'
import { computed, defineComponent, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { InputPassword } from '@/components/Inputs/InputPassword'
import { InputPasswordConfirmation } from '@/components/Inputs/InputPasswordConfirmation'
import { useAppToast } from '@/composables/useToast'
import { updateUserInfos } from '@/graphql/mutations'
import IBiPencil from '~icons/bi/pencil'
import IBiXCircle from '~icons/bi/x-circle'
import classes from './UserPassword.module.scss'

type PasswordForm = { password: string; newPassword: string; newPasswordRepeat: string }

export const UserPassword = defineComponent({
  name: 'UserPassword',
  setup() {
    const { t } = useI18n()

    const showPassword = ref(true)
    const register = ref(false)
    const form = ref<PasswordForm>({
      password: '',
      newPassword: '',
      newPasswordRepeat: '',
    })

    const { toastError, toastSuccess } = useAppToast()
    // `invalid` is read as the component always read it; vee-validate 4 hands out no such
    // field, so its types do not name it.
    const {
      handleSubmit,
      invalid,
      values: formValues,
      resetForm,
    } = useForm<PasswordForm>({
      initialValues: { ...form.value },
    }) as ReturnType<typeof useForm<PasswordForm>> & { invalid?: boolean }

    const disabled = computed(() => {
      return formValues.newPassword !== formValues.newPasswordRepeat
    })

    const cancelEdit = () => {
      showPassword.value = true
      resetForm()
    }

    const toggleShowPassword = () => {
      showPassword.value ? (showPassword.value = !showPassword.value) : cancelEdit()
    }

    const { mutate: updateUserInfo } = useMutation(updateUserInfos)

    const onSubmit = handleSubmit(async () => {
      try {
        await updateUserInfo({
          password: formValues.password,
          passwordNew: formValues.newPassword,
        })
        toastSuccess(t('message.reset'))
        cancelEdit()
      } catch (error) {
        toastError((error as Error).message)
      }
    })

    // No prop and no event of InputPassword (the field registers itself with vee-validate):
    // both land on its root element, as the template left them. Built here and not at the tag:
    // validationFieldNames.drift.spec.js reads the tag's attributes and cannot read an object.
    const oldPasswordModel = () => ({
      'model-value': form.value.password,
      'onUpdate:modelValue': (entered: string) => {
        form.value.password = entered
      },
    })

    return () => (
      <BCard
        id='change_pwd'
        class={['card-border-radius card-background-gray', classes['change-pwd']]}
      >
        <div>
          {/* The opener stands at the LEFT edge and says the whole thing on its own: "change
              password", with the pencil. It used to sit on the right, under a label reading
              just "password" that the settings page put on the left of the same line -- so the
              row said the word twice and neither half was the button. One line, one place, one
              click. (Bernd, 27.08.2026) */}
          <BRow class='mb-4'>
            <BCol>
              <BButton
                class='change-password-form-opener'
                data-test='open-password-change-form'
                onClick={toggleShowPassword}
              >
                <span class='pointer me-3'>{t('settings.password.change-password')}</span>
                {showPassword.value ? <IBiPencil /> : <IBiXCircle class='color-danger' />}
              </BButton>
            </BCol>
          </BRow>
        </div>

        {!showPassword.value ? (
          <div>
            <BForm onSubmit={withModifiers(onSubmit, ['prevent'])}>
              <BRow class='mb-2'>
                <BCol>
                  <InputPassword
                    {...oldPasswordModel()}
                    label={t('form.password_old')}
                    placeholder={t('form.password_old')}
                  />
                </BCol>
              </BRow>
              <InputPasswordConfirmation
                // The template handed the field this text; the component never reads it.
                modelValue={form.value.newPassword as unknown as Record<string, unknown>}
                register={register.value}
                {...{
                  'onUpdate:modelValue': (entered: string) => {
                    form.value.newPassword = entered
                  },
                }}
              />
              <BRow class='text-end'>
                <BCol>
                  <div class='text-end'>
                    <BButton
                      type='submit'
                      variant={invalid ? 'light' : 'success'}
                      class='mt-4'
                      disabled={invalid && disabled.value}
                      data-test='submit-new-password-btn'
                    >
                      {t('form.save')}
                    </BButton>
                  </div>
                </BCol>
              </BRow>
            </BForm>
          </div>
        ) : null}
      </BCard>
    )
  },
})
