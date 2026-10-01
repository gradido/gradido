<template>
  <div v-if="enterData" class="resetpwd-form">
    <div class="pb-5">{{ $t('site.resetPassword.heading') }}</div>
    <BForm role="form" @submit.prevent="onSubmit">
      <input-password-confirmation :model-value="form" register @update:modelValue="form" />
      <BRow>
        <BCol cols="12" lg="6">
          <BButton
            block
            type="submit"
            :variant="formMeta.valid ? 'gradido' : 'gradido-disable'"
            class="mt-4"
            data-test="submit-new-password-btn"
            :disabled="!formMeta.valid"
          >
            <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
            {{ $t(displaySetup.button) }}
          </BButton>
        </BCol>
      </BRow>
    </BForm>
  </div>
  <div v-else>
    <message
      :headline="messageHeadline"
      :subtitle="messageSubtitle"
      :button-text="messageButtonText"
      :link-to="messageButtonLinkTo"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLazyQuery, useMutation, useQuery } from '@vue/apollo-composable'
import { setPassword } from '@/graphql/mutations'
import { queryOptIn } from '@/graphql/queries'
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation.vue'
import Message from '@/components/Message/Message.vue'
import { useAppToast } from '@/composables/useToast'
import { useForm } from 'vee-validate'
import { useAuthLinks } from '@/composables/useAuthLinks'

const { routeWithParamsAndQuery } = useAuthLinks()

// `routeWithParamsAndQuery` on purpose, never a plain `{ name: 'Login' }`: after a registration
// over a transaction or contribution link the confirmation mail points at
// `/checkEmail/:optin/:code?`, and that `code` IS the redeem code. It has to travel on to
// `/login/:code?`, because the login page redeems it right after signing in. The collision
// PR #3798 repaired has nothing to do with this page. Pinned by `ResetPassword.spec.js`.
const linkTo = routeWithParamsAndQuery('Login')

const textFields = {
  reset: {
    title: 'settings.password.change-password',
    text: 'settings.password.reset-password.text',
    button: 'settings.password.change-password',
    linkTo,
  },
  checkEmail: {
    title: 'settings.password.set',
    text: 'settings.password.set-password.text',
    button: 'settings.password.set',
    linkTo,
  },
}

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const form = ref({
  password: '',
  passwordRepeat: '',
})

const displaySetup = ref({})
const showPageMessage = ref(false)
const messageHeadline = ref(null)
const messageSubtitle = ref(null)
const messageButtonText = ref(null)
const messageButtonLinkTo = ref(null)

const enterData = computed(() => !showPageMessage.value)

const emit = defineEmits(['set-mobile-start'])

const { mutate: setPasswordMutation } = useMutation(setPassword)
const { load: queryOptInQuery } = useLazyQuery(queryOptIn)

const { toastError } = useAppToast()

const { meta: formMeta, values: formValues, setFieldValue } = useForm()

const onSubmit = async () => {
  try {
    await setPasswordMutation({
      code: route.params.optin,
      password: formValues.newPassword,
    })

    setFieldValue('newPassword', '')
    setFieldValue('newPasswordRepeat', '')

    showPageMessage.value = true
    messageHeadline.value = t('message.title')
    messageSubtitle.value = route.path.includes('checkEmail')
      ? t('message.checkEmail')
      : t('message.reset')
    messageButtonText.value = t('login')
    messageButtonLinkTo.value = linkTo
  } catch (error) {
    const errorMessage = error.message.match(
      /email was sent more than ([0-9]+ hours)?( and )?([0-9]+ minutes)? ago/,
    )
      ? error.message
      : error.message

    showPageMessage.value = true
    messageHeadline.value = t('message.errorTitle')
    messageSubtitle.value = errorMessage
    messageButtonText.value = t('settings.password.reset')
    // `ForgotPassword` has no parameters at all - vue-router discarded `comingFrom` here
    // and the page never learned why somebody had landed on it. The route that carries the
    // reason is a different one, and until now nothing pointed at it.
    messageButtonLinkTo.value = {
      name: 'ForgotPasswordComingFrom',
      params: { comingFrom: 'reset-password' },
    }
    toastError(errorMessage)
  }
}

const checkOptInCode = async () => {
  try {
    await queryOptInQuery(queryOptIn, {
      optIn: route.params.optin,
    })
  } catch (error) {
    toastError(error.message)
    await router.push({
      name: 'ForgotPasswordComingFrom',
      params: { comingFrom: 'reset-password' },
    })
  }
}

const setDisplaySetup = () => {
  checkOptInCode()
  if (route.path.includes('checkEmail')) {
    displaySetup.value = textFields.checkEmail
  }
  if (route.path.includes('reset-password')) {
    displaySetup.value = textFields.reset
  }
}

emit('set-mobile-start', false)
setDisplaySetup()
</script>
<style scoped>
.btn-gradido {
  padding-right: 0;
  padding-left: 0;
}

.btn-gradido-disable {
  padding-right: 0;
  padding-left: 0;
}
</style>
