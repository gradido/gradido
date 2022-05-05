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
    <b-container v-if="enterData" class="mt--8 p-1">
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
import InputPassword from '@/components/Inputs/InputPassword'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'
import { login } from '@/graphql/queries'
import CONFIG from '@/config'

export default {
  name: 'Login',
  components: {
    InputPassword,
    InputEmail,
    Message,
  },
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
          if (error.message.includes('User email not validated')) {
            this.showPageMessage = true
            this.errorSubtitle = this.$t('site.thx.activateEmail')
            this.errorLinkTo = '/forgot-password'
            this.toastError(this.$t('error.no-account'))
          } else if (error.message.includes('User has no password set yet')) {
            this.showPageMessage = true
            this.errorSubtitle = this.$t('site.thx.unsetPassword')
            this.errorLinkTo = '/reset-password/login'
            this.toastError(this.$t('error.no-account'))
          } else if (error.message.includes('No user with this credentials')) {
            this.toastError(this.$t('error.no-user'))
          } else {
            this.toastError(this.$t('error.unknown-error') + error.message)
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
