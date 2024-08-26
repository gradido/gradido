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

<!--<script>-->
<!--import { setPassword } from '@/graphql/mutations'-->
<!--import { queryOptIn } from '@/graphql/queries'-->
<!--import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation'-->
<!--import Message from '@/components/Message/Message'-->

<!--const textFields = {-->
<!--  reset: {-->
<!--    title: 'settings.password.change-password',-->
<!--    text: 'settings.password.reset-password.text',-->
<!--    button: 'settings.password.change-password',-->
<!--    linkTo: '/login',-->
<!--  },-->
<!--  checkEmail: {-->
<!--    title: 'settings.password.set',-->
<!--    text: 'settings.password.set-password.text',-->
<!--    button: 'settings.password.set',-->
<!--    linkTo: '/login',-->
<!--  },-->
<!--}-->

<!--export default {-->
<!--  name: 'ResetPassword',-->
<!--  components: {-->
<!--    InputPasswordConfirmation,-->
<!--    Message,-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      form: {-->
<!--        password: '',-->
<!--        passwordRepeat: '',-->
<!--      },-->
<!--      displaySetup: {},-->
<!--      showPageMessage: false,-->
<!--      messageHeadline: null,-->
<!--      messageSubtitle: null,-->
<!--      messageButtonText: null,-->
<!--      messageButtonLinkTo: null,-->
<!--    }-->
<!--  },-->
<!--  computed: {-->
<!--    enterData() {-->
<!--      return !this.showPageMessage-->
<!--    },-->
<!--  },-->
<!--  created() {-->
<!--    this.$emit('set-mobile-start', false)-->
<!--    this.setDisplaySetup()-->
<!--  },-->
<!--  methods: {-->
<!--    async onSubmit() {-->
<!--      this.$apollo-->
<!--        .mutate({-->
<!--          mutation: setPassword,-->
<!--          variables: {-->
<!--            code: this.$route.params.optin,-->
<!--            password: this.form.password,-->
<!--          },-->
<!--        })-->
<!--        .then(() => {-->
<!--          this.form.password = ''-->
<!--          this.form.passwordRepeat = ''-->

<!--          this.showPageMessage = true-->
<!--          this.messageHeadline = this.$t('message.title')-->
<!--          this.messageSubtitle = this.$route.path.includes('checkEmail')-->
<!--            ? this.$t('message.checkEmail')-->
<!--            : this.$t('message.reset')-->
<!--          this.messageButtonText = this.$t('login')-->
<!--          if (this.$route.params.code) {-->
<!--            this.messageButtonLinkTo = `/login/${this.$route.params.code}`-->
<!--          } else {-->
<!--            this.messageButtonLinkTo = '/login'-->
<!--          }-->
<!--        })-->
<!--        .catch((error) => {-->
<!--          let errorMessage-->
<!--          if (-->
<!--            error.message.match(-->
<!--              /email was sent more than ([0-9]+ hours)?( and )?([0-9]+ minutes)? ago/,-->
<!--            )-->
<!--          ) {-->
<!--            errorMessage = error.message-->
<!--          } else {-->
<!--            errorMessage = error.message-->
<!--          }-->
<!--          this.showPageMessage = true-->
<!--          this.messageHeadline = this.$t('message.errorTitle')-->
<!--          this.messageSubtitle = errorMessage-->
<!--          this.messageButtonText = this.$t('settings.password.reset')-->
<!--          this.messageButtonLinkTo = '/forgot-password/resetPassword'-->
<!--          this.toastError(errorMessage)-->
<!--        })-->
<!--    },-->
<!--    checkOptInCode() {-->
<!--      this.$apollo-->
<!--        .query({-->
<!--          query: queryOptIn,-->
<!--          variables: {-->
<!--            optIn: this.$route.params.optin,-->
<!--          },-->
<!--        })-->
<!--        .then()-->
<!--        .catch((error) => {-->
<!--          this.toastError(error.message)-->
<!--          this.$router.push('/forgot-password/resetPassword')-->
<!--        })-->
<!--    },-->
<!--    setDisplaySetup() {-->
<!--      this.checkOptInCode()-->
<!--      if (this.$route.path.includes('checkEmail')) {-->
<!--        this.displaySetup = textFields.checkEmail-->
<!--      }-->
<!--      if (this.$route.path.includes('reset-password')) {-->
<!--        this.displaySetup = textFields.reset-->
<!--      }-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->
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

const textFields = {
  reset: {
    title: 'settings.password.change-password',
    text: 'settings.password.reset-password.text',
    button: 'settings.password.change-password',
    linkTo: '/login',
  },
  checkEmail: {
    title: 'settings.password.set',
    text: 'settings.password.set-password.text',
    button: 'settings.password.set',
    linkTo: '/login',
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
    messageButtonLinkTo.value = route.params.code ? `/login/${route.params.code}` : '/login'
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
    messageButtonLinkTo.value = '/forgot-password/resetPassword'
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
    await router.push('/forgot-password/resetPassword')
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
