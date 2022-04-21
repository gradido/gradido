<template>
  <div class="forgot-password">
    <div class="header p-4">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('settings.password.reset') }}</h1>
              <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys-->
              <p class="text-lead">{{ $t(subtitle) }}</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>
    <b-container v-if="!showPageMessage" class="mt--8 p-1">
      <b-row class="justify-content-center">
        <b-col lg="6" md="8">
          <b-card no-body class="border-0 gradido-custom-background">
            <b-card-body class="p-4">
              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <input-email v-model="form.email"></input-email>
                  <div class="text-center">
                    <b-button type="submit" variant="primary">
                      {{ $t('settings.password.send_now') }}
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
    <b-container v-else class="mt--8 p-1">
      <!-- eslint-disable @intlify/vue-i18n/no-dynamic-keys-->
      <message
        v-if="success"
        :headline="$t('site.thx.title')"
        :subtitle="$t('site.thx.email')"
        :buttonText="$t('login')"
        linkTo="/login"
      />
      <message
        v-else
        :headline="$t('site.thx.errorTitle')"
        :subtitle="$t('error.email-already-sent')"
        :buttonText="$t('login')"
        linkTo="/login"
      />
      <!-- eslint-enable @intlify/vue-i18n/no-dynamic-keys-->
    </b-container>
  </div>
</template>
<script>
import { forgotPassword } from '@/graphql/mutations'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'

export default {
  name: 'ForgotPassword',
  components: {
    InputEmail,
    Message,
  },
  data() {
    return {
      // Wolle disable: 'disabled',
      form: {
        email: '',
      },
      subtitle: 'settings.password.subtitle',
      showPageMessage: false,
      success: null,
    }
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: forgotPassword,
          variables: {
            email: this.form.email,
          },
        })
        .then(() => {
          this.showPageMessage = true
          this.success = true
        })
        .catch(() => {
          this.showPageMessage = true
          this.success = false
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
