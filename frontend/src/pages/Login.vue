<template>
  <div class="login-form">
    <b-container v-if="enterData">
      <div class="pb-5">{{ $t('site.login.heading') }}</div>
      <validation-observer ref="observer" v-slot="{ handleSubmit }">
        <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
          <b-row>
            <b-col sm="12" md="12" lg="6"><input-email v-model="form.email"></input-email></b-col>
            <b-col sm="12" md="12" lg="6">
              <input-password
                :label="$t('form.password')"
                :placeholder="$t('form.password')"
                :name="$t('form.password')"
                v-model="form.password"
              ></input-password>
            </b-col>
          </b-row>
          <b-row>
            <b-col class="d-flex justify-content-start">
              <b-form-checkbox
                class="mt-3"
                v-model="status"
                name="checkbox-1"
                value="saved"
                unchecked-value="not_saved"
              >
                {{ $t('site.login.saveLogin') }}
              </b-form-checkbox>
            </b-col>
            <b-col class="d-flex justify-content-end">
              <router-link to="/forgot-password" class="mt-3">
                {{ $t('settings.password.forgot_pwd') }}
              </router-link>
            </b-col>
          </b-row>
          <div class="mt-5">
            <b-button type="submit" variant="gradido">{{ $t('login') }}</b-button>
          </div>
        </b-form>
      </validation-observer>
    </b-container>
    <b-container v-else>
      <message
        :headline="$t('message.errorTitle')"
        :subtitle="errorSubtitle"
        :buttonText="$t('settings.password.reset')"
        :linkTo="errorLinkTo"
      />
    </b-container>
  </div>
</template>

<script>
import { ERRORS } from '@/config/errors'
import { login } from '@/graphql/queries'
import { errorMessageRemoveGraphQl, errors } from '@/mixins/errors'
import InputPassword from '@/components/Inputs/InputPassword'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'

export default {
  name: 'Login',
  components: {
    InputPassword,
    InputEmail,
    Message,
  },
  mixins: [errors],
  data() {
    return {
      form: {
        email: '',
        password: '',
      },
      passwordVisible: false,
      status: false,
      showPageMessage: false,
      errorReason: null,
      errorSubtitle: '',
      errorLinkTo: '',
    }
  },
  methods: {
    async onSubmit() {
      const loader = this.$loading.show({
        container: this.$refs.submitButton,
      })
      this.$apollo
        .query({
          query: login,
          variables: {
            email: this.form.email,
            password: this.form.password,
            publisherId: this.$store.state.publisherId,
          },
          fetchPolicy: 'network-only',
        })
        .then(async (result) => {
          const {
            data: { login },
          } = result
          this.$store.dispatch('login', login)
          await loader.hide()
          if (this.$route.params.code) {
            this.$router.push(`/redeem/${this.$route.params.code}`)
          } else {
            this.$router.push('/overview')
          }
        })
        .catch((error) => {
          const errorCode = errorMessageRemoveGraphQl(error.message)
          if (errorCode === ERRORS.ERR_EMAIL_NOT_VALIDATED) {
            this.toastError(this.$t('error.no-account'))
            this.showPageMessage = true
            this.errorSubtitle = this.translateErrorMessage(error.message)
            this.errorLinkTo = '/forgot-password'
          } else if (errorCode === ERRORS.ERR_USER_HAS_NO_PASSWORD) {
            this.toastError(this.$t('error.no-account'))
            this.showPageMessage = true
            this.errorSubtitle = this.translateErrorMessage(error.message)
            this.errorLinkTo = '/reset-password/login'
            this.toastError(this.$t('error.no-account'))
          } else if (error.message.includes('No user with this credentials')) {
            // Wolle: use error code and translation here as well, see below
            // don't show any error on the page! against boots
            this.toastError(this.$t('error.no-user'))
          } else {
            // don't show any error on the page! against boots
            this.toastError(this.translateErrorMessage(error.message))
          }
          loader.hide()
        })
    },
  },
  computed: {
    enterData() {
      return !this.showPageMessage
    },
  },
}
</script>
