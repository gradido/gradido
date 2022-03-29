<template>
  <div class="auth-forgot-password">
    <b-card no-body class="border-0 gradido-custom-background">
      <div class="text-center">
        <h1>{{ $t('settings.password.reset') }}</h1>
        <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
        <p class="text-lead">{{ $t(subtitle) }}</p>
      </div>
      <b-card-body class="p-4">
        <validation-observer ref="observer" v-slot="{ handleSubmit }">
          <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
            <input-email v-model="form.email"></input-email>
            <div class="text-center">
              <b-button type="submit" variant="gradido">
                {{ $t('settings.password.send_now') }}
              </b-button>
            </div>
          </b-form>
        </validation-observer>
      </b-card-body>
    </b-card>
  </div>
</template>
<script>
import { sendResetPasswordEmail } from '@/graphql/queries'
import InputEmail from '@/components/Inputs/InputEmail'

export default {
  name: 'AuthForgotPassword',
  components: {
    InputEmail,
  },
  data() {
    return {
      disable: 'disabled',
      form: {
        email: '',
      },
      subtitle: 'settings.password.subtitle',
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
      this.subtitle = 'settings.password.resend_subtitle'
    }
  },
}
</script>
