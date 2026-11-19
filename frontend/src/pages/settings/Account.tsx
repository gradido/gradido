// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BButton, BCol, BForm, BFormInput, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { SettingsSection } from '@/components/UserSettings/SettingsSection'
import { UserCreationAccount } from '@/components/UserSettings/UserCreationAccount'
import { UserEmail } from '@/components/UserSettings/UserEmail'
import { UserName } from '@/components/UserSettings/UserName'
import { UserPassword } from '@/components/UserSettings/UserPassword'
import { useAppToast } from '@/composables/useToast'
import { updateUserInfos } from '@/graphql/mutations'
import { useWalletStore } from '@/store/useWalletStore'

export const Account = defineComponent({
  name: 'Account',
  setup() {
    const { t } = useI18n()
    const { toastError, toastSuccess } = useAppToast()
    const store = useWalletStore()

    const firstName = ref<string>(store.firstName || '')
    const lastName = ref<string>(store.lastName || '')

    const isButtonVisible = computed(() => {
      return firstName.value !== store.firstName || lastName.value !== store.lastName
    })

    const { mutate: updateUserData } = useMutation(updateUserInfos)

    const onSubmit = async () => {
      try {
        await updateUserData({
          firstName: firstName.value,
          lastName: lastName.value,
        })
        store.setFirstName(firstName.value)
        store.setLastName(lastName.value)
        toastSuccess(t('settings.name.change-success'))
      } catch (error) {
        toastError(error)
      }
    }

    return () => (
      <SettingsSection title={t('settings.menu.account')}>
        <BRow>
          <BCol cols='12' md='6' lg='6'>
            <UserName />
          </BCol>
          <BCol cols='12' md='6' lg='6'>
            <UserEmail />
          </BCol>
        </BRow>

        <hr />
        <BForm onSubmit={withModifiers(onSubmit, ['prevent'])}>
          <BRow class='mt-3'>
            <BCol cols='12' md='6' lg='6'>
              <label>{t('form.firstname')}</label>
              <BFormInput
                modelValue={firstName.value}
                placeholder={t('settings.name.enterFirstname')}
                data-test='firstname'
                // no prop of BFormInput (that is the `.trim` modifier of v-model): it lands on
                // the element as the empty attribute the template left there
                {...({ trim: '' } as object)}
                onUpdate:modelValue={(entered) => {
                  firstName.value = String(entered ?? '')
                }}
              />
            </BCol>
            <BCol cols='12' md='6' lg='6'>
              <label>{t('form.lastname')}</label>
              <BFormInput
                modelValue={lastName.value}
                placeholder={t('settings.name.enterLastname')}
                data-test='lastname'
                {...({ trim: '' } as object)}
                onUpdate:modelValue={(entered) => {
                  lastName.value = String(entered ?? '')
                }}
              />
            </BCol>
          </BRow>
          {isButtonVisible.value ? (
            <div class='mt-4 pt-4 text-center'>
              <BButton
                type='submit'
                variant='primary'
                data-test='submit-userdata'
                onClick={withModifiers(onSubmit, ['prevent'])}
              >
                {t('form.save')}
              </BButton>
            </div>
          ) : null}
        </BForm>

        <hr />
        {/* No label of our own over this. The card below opens with "change password" and the
            pencil, so a line reading "password" beside it only said the word a second time
            without being the thing one clicks. (Bernd, 27.08.2026) */}
        <UserPassword class='mt-5' />

        <hr />
        {/* ES-021: person or project account. Below everything else, as the exception it is
            (E-020, question 3): the default is a person, and almost nobody moves it. */}
        <UserCreationAccount class='mt-4' />
      </SettingsSection>
    )
  },
})
