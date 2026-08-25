<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The helper page of the doorbell flow (EM-013): a member opened this from their
       multi-registration mail while the guest sits next to them. The guest's name comes
       from the parked attempt; what is entered here is the guest's OWN address — and the
       guest types their password themselves. -->
  <div v-if="!showPageMessage" class="register-assist">
    <div class="h3 pb-3">{{ $t('assistedRegistration.assist.title') }}</div>
    <p v-if="guestName" class="pb-2" data-test="assist-guest-name">
      {{ $t('assistedRegistration.assist.intro', { name: guestName }) }}
    </p>
    <p class="pb-4 text-muted">{{ $t('assistedRegistration.assist.emailHint') }}</p>
    <BForm role="form" @submit.prevent="onSubmit">
      <input-email />
      <input-password-confirmation register />
      <BRow>
        <BCol cols="12" lg="6">
          <BButton
            block
            type="submit"
            :variant="formMeta.valid ? 'gradido' : 'gradido-disable'"
            class="mt-4"
            data-test="assist-submit"
            :disabled="!formMeta.valid || busy"
          >
            {{ $t('assistedRegistration.assist.button') }}
          </BButton>
        </BCol>
      </BRow>
    </BForm>
  </div>
  <message
    v-else
    :headline="messageHeadline"
    :subtitle="messageSubtitle"
    :button-text="messageButtonText"
    :link-to="messageButtonLinkTo"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BCol, BForm, BRow } from 'bootstrap-vue-next'
import { useForm } from 'vee-validate'
import { completeAssistedRegistration } from '@/graphql/mutations'
import { assistedRegistrationInfo } from '@/graphql/queries'
import InputEmail from '@/components/Inputs/InputEmail.vue'
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation.vue'
import Message from '@/components/Message/Message.vue'
import { useAppToast } from '@/composables/useToast'

const route = useRoute()
const { t } = useI18n()
const { toastError } = useAppToast()

const emit = defineEmits(['set-mobile-start'])

const busy = ref(false)
const showPageMessage = ref(false)
const messageHeadline = ref(null)
const messageSubtitle = ref(null)
const messageButtonText = ref(null)
const messageButtonLinkTo = ref(null)

const { meta: formMeta, values: formValues } = useForm()

const { result: infoResult, onError: onInfoError } = useQuery(assistedRegistrationInfo, () => ({
  assistCode: route.params.assistCode,
}))

const guestName = computed(() =>
  infoResult.value
    ? `${infoResult.value.assistedRegistrationInfo.firstName} ${infoResult.value.assistedRegistrationInfo.lastName}`
    : '',
)

// An unknown, mistyped or expired link gets one page-level answer — there is no form
// worth filling behind it.
onInfoError(() => {
  showPageMessage.value = true
  messageHeadline.value = t('message.errorTitle')
  messageSubtitle.value = t('assistedRegistration.assist.invalid')
  messageButtonText.value = t('login')
  messageButtonLinkTo.value = { name: 'Login' }
})

const { mutate: complete } = useMutation(completeAssistedRegistration)

const onSubmit = async () => {
  busy.value = true
  try {
    const result = await complete({
      assistCode: route.params.assistCode,
      email: formValues.email,
      password: formValues.newPassword,
    })
    const redeemCode = result.data.completeAssistedRegistration.redeemCode
    showPageMessage.value = true
    messageHeadline.value = t('message.title')
    messageSubtitle.value = t('assistedRegistration.assist.done')
    messageButtonText.value = t('assistedRegistration.assist.loginButton')
    // Deliberately the redeem route parameter: /login/:code? IS the redeem entry — the
    // guest signs in and the existing flow books the cheque credit.
    messageButtonLinkTo.value = { name: 'Login', params: { code: redeemCode } }
  } catch (error) {
    if (error.message.includes('Email address already in use')) {
      showPageMessage.value = true
      messageHeadline.value = t('message.errorTitle')
      messageSubtitle.value = t('assistedRegistration.assist.emailTaken')
      messageButtonText.value = t('settings.password.reset')
      messageButtonLinkTo.value = { name: 'ForgotPassword' }
    } else {
      toastError(error.message)
    }
  } finally {
    busy.value = false
  }
}

emit('set-mobile-start', false)
</script>
