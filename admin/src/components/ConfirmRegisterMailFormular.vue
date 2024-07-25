<template>
  <div class="component-confirm-register-mail">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <div v-if="props.checked">{{ $t('unregister_mail.text_true') }}</div>
      <div v-else>
        {{
          props.dateLastSend === ''
            ? $t('unregister_mail.never_sent', { email: props.email })
            : $t('unregister_mail.text_false', { date: props.dateLastSend, email: props.email })
        }}
        <!-- Using components -->
        <BInputGroup :prepend="$t('unregister_mail.info')" class="mt-3">
          <BFormInput readonly v-model="props.email" />
          <BInputGroupText>
            <BButton variant="outline-success" class="test-button" @click="sendRegisterMail">
              {{ $t('unregister_mail.button') }}
            </BButton>
          </BInputGroupText>
        </BInputGroup>
      </div>
    </div>
  </div>
</template>
<script setup>
import { sendActivationEmail } from '../graphql/sendActivationEmail'
import { BButton, BFormInput, BInputGroup, BInputGroupText } from 'bootstrap-vue-next'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  checked: {
    type: Boolean,
  },
  email: {
    type: String,
  },
  dateLastSend: {
    type: String,
  },
})

const { t } = useI18n()
const { toastError, toastSuccess } = useAppToast()

const { mutate: activateEmail } = useMutation(sendActivationEmail)

const sendRegisterMail = async () => {
  try {
    await activateEmail({
      email: props.email,
    })
    toastSuccess(t('unregister_mail.success', { email: props.email }))
  } catch (error) {
    toastError(t('unregister_mail.error', { message: error.message }))
  }
}
</script>
<style>
.input-group-text {
  background-color: rgb(255 252 205);
}
</style>
