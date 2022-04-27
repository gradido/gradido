<template>
  <div class="login-form">
    <!-- Header -->
    <div class="p-3">
      <b-container>
        <div class="text-center mb-7 header">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('site.login.heading') }}</h1>
              <p class="text-lead">{{ $t('site.login.community') }}</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>
    <b-container v-if="!showPageMessage" class="mt--8 p-1">
      <b-row class="justify-content-center">
        <b-col lg="5" md="7">
          <b-card no-body class="border-0 mb-0 gradido-custom-background">
            <b-card-body class="p-4">
              <div class="text-center text-muted mb-4 test-communitydata">
                <b>{{ CONFIG.COMMUNITY_NAME }}</b>
                <p class="text-lead">
                  {{ CONFIG.COMMUNITY_DESCRIPTION }}
                </p>
                {{ $t('login') }}
              </div>

              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form @submit.stop.prevent="handleSubmit(onSubmit)">
                  <input-email v-model="form.email"></input-email>
                  <input-password
                    :label="$t('form.password')"
                    :placeholder="$t('form.password')"
                    :name="$t('form.password')"
                    v-model="form.password"
                  ></input-password>
                  <div class="text-center mt-4">
                    <b-button type="submit" variant="primary">{{ $t('login') }}</b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
          <b-row class="mt-3">
            <b-col cols="6" class="text-center text-sm-left col-12 col-sm-6 pb-5">
              <router-link to="/forgot-password" class="mt-3">
                {{ $t('settings.password.forgot_pwd') }}
              </router-link>
            </b-col>
            <b-col cols="6" class="text-center text-sm-right col-12 col-sm-6">
              <router-link to="/register" class="mt-3">
                {{ $t('site.login.new_wallet') }}
              </router-link>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-else class="mt--8 p-1">
      <message
        :headline="$t('site.thx.errorTitle')"
        :subtitle="errorSubtitle"
        :buttonText="$t('settings.password.reset')"
        :linkTo="errorLinkTo"
      />
    </b-container>
  </div>
</template>

<script>
import { login } from '@/graphql/queries'
import CONFIG from '@/config'
import { ERRORS } from '@/config/errors'
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
      showPageMessage: false,
      errorReason: null,
      errorSubtitle: '',
      errorLinkTo: '',
      CONFIG,
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
          if (errorMessageRemoveGraphQl(error.message) === ERRORS.ERR_EMAIL_NOT_VALIDATED) {
            this.toastError(this.$t('error.no-account'))
            this.showPageMessage = true
            this.errorSubtitle = this.$t('site.thx.activateEmail')
            this.errorLinkTo = '/forgot-password'
          } else if (errorMessageRemoveGraphQl(error.message) === ERRORS.ERR_USER_HAS_NO_PASSWORD) {
            this.toastError(this.$t('error.no-account'))
            this.showPageMessage = true
            this.errorSubtitle = this.$t('site.thx.unsetPassword')
            this.errorLinkTo = '/reset-password/login'
          } else {
            // appeared errors: 'GraphQL error: No user with this credentials', 'Network error: JSON.parse: unexpected character at line 1 column 1 of the JSON data'
            const errorMessage = this.translateErrorMessage(error.message)
            this.toastError(errorMessage)
            this.showPageMessage = true
            this.errorSubtitle = errorMessage
            this.errorLinkTo = '/forgot-password'
          }
          loader.hide()
        })
    },
  },
}
</script>
