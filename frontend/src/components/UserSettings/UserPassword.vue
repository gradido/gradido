<template>
  <BCard id="change_pwd" class="card-border-radius card-background-gray">
    <div>
      <BRow class="mb-4 text-right">
        <BCol class="text-right">
          <BButton
            class="change-password-form-opener"
            data-test="open-password-change-form"
            @click="toggleShowPassword"
          >
            <span class="pointer me-3">{{ $t('settings.password.change-password') }}</span>
            <IBiPencil v-if="showPassword" />
            <IBiXCircle v-else class="color-danger" />
            <!-- <b-icon v-if="showPassword" class="pointer ml-3" icon="pencil"></b-icon>
            <b-icon v-else icon="x-circle" class="pointer ml-3" variant="danger"></b-icon> -->
          </BButton>
        </BCol>
      </BRow>
    </div>

    <div v-if="!showPassword">
      <BForm @submit.prevent="onSubmit">
        <BRow class="mb-2">
          <BCol>
            <input-password
              :model-value="form.password"
              :label="$t('form.password_old')"
              :placeholder="$t('form.password_old')"
              @update:modelValue="form.password = $event"
            />
          </BCol>
        </BRow>
        <input-password-confirmation
          :model-value="form.newPassword"
          :register="register"
          @update:modelValue="form.newPassword = $event"
        />
        <BRow class="text-right">
          <BCol>
            <div class="text-right">
              <BButton
                type="submit"
                :variant="invalid ? 'light' : 'success'"
                class="mt-4"
                :disabled="invalid && disabled"
                data-test="submit-new-password-btn"
              >
                {{ $t('form.save') }}
              </BButton>
            </div>
          </BCol>
        </BRow>
      </BForm>
    </div>
  </BCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BRow, BCol, BForm, BButton } from 'bootstrap-vue-next'
import InputPassword from '@/components/Inputs/InputPassword'
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation'
import { updateUserInfos } from '@/graphql/mutations'
import { useForm } from 'vee-validate'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()

const showPassword = ref(true)
const register = ref(false)
const form = ref({
  password: '',
  newPassword: '',
  newPasswordRepeat: '',
})

const { toastError, toastSuccess } = useAppToast()
const {
  handleSubmit,
  invalid,
  values: formValues,
  resetForm,
} = useForm({
  initialValues: { ...form.value },
})

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
    toastError(error.message)
  }
})
</script>

<style scoped lang="scss">
.change-password-form-opener {
  background-color: transparent;
  border: none;
  color: $gradido-4;
  display: flex;
  align-items: center;
  margin-left: auto;

  > span {
    margin-right: 15px;
  }

  > svg {
    width: 16px;
    height: 16px;
  }
}

.color-danger {
  color: $danger !important;
}
</style>
