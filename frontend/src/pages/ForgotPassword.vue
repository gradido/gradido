<template>
  <div class="forgot-password">
    <div class="header p-4">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t(displaySetup.headline) }}</h1>
              <p class="text-lead">{{ $t(displaySetup.subtitle) }}</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>
    <b-container class="mt--8 p-1">
      <b-row class="justify-content-center">
        <b-col lg="6" md="8">
          <b-card no-body class="border-0" style="background-color: #ebebeba3 !important">
            <b-card-body class="p-4">
              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <input-email v-model="form.email"></input-email>
                  <div class="text-center">
                    <b-button type="submit" variant="primary">
                      {{ $t(displaySetup.button) }}
                    </b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <div class="text-center py-lg-4">
        <router-link to="/login" class="mt-3">{{ $t('back') }}</router-link>
      </div>
    </b-container>
  </div>
</template>
<script>
import { sendResetPasswordEmail } from '@/graphql/queries'
import InputEmail from '@/components/Inputs/InputEmail'

const textFields = {
  reset: {
    headline: 'settings.password.reset',
    subtitle: 'settings.password.resend_subtitle',
    button: 'settings.password.send_now',
    cancel: 'back',
  },
  login: {
    headline: 'settings.password.reset',
    subtitle: 'settings.password.subtitle',
    button: 'settings.password.send_now',
    cancel: 'back',
  },
}

export default {
  name: 'ForgotPassword',
  components: {
    InputEmail,
  },
  data() {
    return {
      disable: 'disabled',
      form: {
        email: '',
      },
      displaySetup: {},
    }
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .query({
          query: sendResetPasswordEmail,
          variables: {
            email: this.form.email,
          },
        })
        .then(() => {
          this.$router.push('/thx/forgotPassword')
        })
        .catch(() => {
          this.$router.push('/thx/forgotPassword')
        })
    },
  },
  created() {
    if (this.$route.params.comingFrom) {
      this.displaySetup = textFields[this.$route.params.comingFrom]
    } else {
      this.displaySetup = textFields.login
    }
  },
}
</script>
<style></style>
