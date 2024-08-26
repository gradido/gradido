<!-- eslint-disable prettier/prettier -->
<template>
  <div class="forgot-password">
    <BContainer v-if="enterData">
      <div class="pb-5">{{ $t('site.forgotPassword.heading') }}</div>
      <BRow class="justify-content-center">
        <BCol>
          <BForm role="form" @submit.prevent="onSubmit">
            <input-email
              name="email"
              :label="$t('form.email')"
              :placeholder="$t('form.email')"
              class="mb-4"
            />
            <BRow>
              <BCol cols="12" lg="6">
                <BButton
                  type="submit"
                  :variant="formMeta.valid ? 'gradido' : 'gradido-disable'"
                  block
                  :disabled="!formMeta.valid"
                >
                  {{ $t('settings.password.send_now') }}
                </BButton>
              </BCol>
            </BRow>
          </BForm>
        </BCol>
      </BRow>
    </BContainer>
    <BContainer v-else>
      <message
        :headline="success ? $t('message.title') : $t('message.errorTitle')"
        :subtitle="success ? $t('message.email') : $t('error.email-already-sent')"
        :data-test="success ? 'forgot-password-success' : 'forgot-password-error'"
        :button-text="$t('login')"
        link-to="/login"
      />
    </BContainer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'
import { useAppToast } from '@/composables/useToast'
import { forgotPassword } from '@/graphql/mutations'
import { useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { useI18n } from 'vue-i18n'

const { toastError } = useAppToast()

const subtitle = ref('settings.password.subtitle')
const showPageMessage = ref(false)
const success = ref(null)

const { params } = useRoute()

const { t } = useI18n()

if (params.comingFrom) {
  subtitle.value = 'settings.password.resend_subtitle'
}

const { mutate } = useMutation(forgotPassword)

const { meta: formMeta, values: formValues } = useForm()

const enterData = computed(() => {
  return !showPageMessage.value
})

async function onSubmit() {
  try {
    await mutate({
      email: formValues.email,
    })
    showPageMessage.value = true
    success.value = true
  } catch (err) {
    showPageMessage.value = true
    success.value = false
    toastError(t('error.email-already-sent'))
  }
}
</script>
<style scoped>
:deep(.btn-gradido) {
  padding-right: 0;
  padding-left: 0;
}

:deep(.btn-gradido-disable) {
  padding-right: 0;
  padding-left: 0;
}
</style>
