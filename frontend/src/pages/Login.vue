<template>
  <div class="login-form">
    <BContainer v-if="enterData">
      <div class="pb-5" align="center">{{ $t('gdd_per_link.isFree') }}</div>
      <form @submit.prevent="onSubmit">
        <BRow>
          <BCol sm="12" md="12" lg="6">
            <input-email />
          </BCol>
          <BCol sm="12" md="12" lg="6">
            <input-password />
          </BCol>
        </BRow>
        <BRow>
          <BCol class="d-flex justify-content-end mb-4 mb-lg-0">
            <router-link to="/forgot-password" data-test="forgot-password-link">
              {{ $t('settings.password.forgot_pwd') }}
            </router-link>
          </BCol>
        </BRow>
        <BRow>
          <BCol class="col-lg-6 col-12">
            <BButton
              ref="submitBtn"
              type="submit"
              class="w-100 fs-7"
              :variant="meta.valid ? 'gradido' : 'gradido-disable'"
              block
              :disabled="!meta.valid"
            >
              {{ $t('login') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow>
          <BCol class="mt-3">
            {{ $t('missingGradidoAccount', { communityName: CONFIG.COMMUNITY_NAME }) }}
          </BCol>
        </BRow>
        <BRow>
          <BCol class="mt-1 auth-navbar">
            <BLink :to="register()">
              {{ $t('signup') }}
            </BLink>
          </BCol>
        </BRow>
      </form>
    </BContainer>
    <BContainer v-else>
      <message
        :headline="$t('message.errorTitle')"
        :subtitle="errorSubtitle"
        :button-text="$t('settings.password.reset')"
        :link-to="errorLinkTo"
      />
    </BContainer>
  </div>
</template>

<script setup>
import InputPassword from '@/components/Inputs/InputPassword'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'
import { login, authenticateHumhubAutoLoginProject } from '@/graphql/mutations '
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { useMutation } from '@vue/apollo-composable'
import { useAppToast } from '@/composables/useToast'
import { useAuthLinks } from '@/composables/useAuthLinks'
import CONFIG from '@/config'

// import { useLoading } from 'vue-loading-overlay'

const router = useRouter()
const route = useRoute()
const store = useStore()
const { t } = useI18n()
const { mutate } = useMutation(login)
const { mutate: mutateHumhubAutoLogin } = useMutation(authenticateHumhubAutoLoginProject, {
  variables: {
    project: store.state.project,
  },
  enabled: store.state.project,
})
// const $loading = useLoading() // TODO needs to be updated but there is some sort of an issue that breaks the app.
const { toastError } = useAppToast()
const { register } = useAuthLinks()

const form = ref({
  email: '',
  password: '',
})

const { handleSubmit, meta } = useForm({
  initialValues: form.value,
})

const showPageMessage = ref(false)
const errorSubtitle = ref('')
const errorLinkTo = ref('')
const submitBtn = ref(null)

const onSubmit = handleSubmit(async (values) => {
  // const loader = $loading.show({
  //   container: submitBtn,
  // })
  // this.$root.$bvToast.hide()
  try {
    const result = await mutate({
      email: values.email,
      password: values.password,
      publisherId: store.state.publisherId,
      project: store.state.project,
    })
    const { login: loginResponse } = result.data
    await store.dispatch('login', loginResponse)
    store.commit('email', values.email)
    // await loader.hide()

    if (store.state.project) {
      const result = await mutateHumhubAutoLogin()
      window.location.href = result.data.authenticateHumhubAutoLogin
      return
    }

    if (route.params.code) {
      await router.push(`/redeem/${route.params.code}`)
    } else {
      await router.push(store.state.redirectPath)
    }
  } catch (error) {
    if (error.message.includes('User email not validated')) {
      showPageMessage.value = true
      errorSubtitle.value = t('message.activateEmail')
      errorLinkTo.value = '/forgot-password'
      toastError(t('error.no-account'))
    } else if (error.message.includes('User has no password set yet')) {
      showPageMessage.value = true
      errorSubtitle.value = t('message.unsetPassword')
      errorLinkTo.value = '/reset-password/login'
      toastError(t('error.no-account'))
    } else if (error.message.includes('No user with this credentials')) {
      toastError(t('error.no-user'))
    } else {
      toastError(t('error.unknown-error') + error.message)
    }
  } finally {
    // loader.hide()
  }
})

const enterData = computed(() => !showPageMessage.value)
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
