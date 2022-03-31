<template>
  <div class="forgot-password">
    <div class="pb-5">Bitte gib deine E-Mail an mit der du bei Gradido angemeldet bist.</div>
    <validation-observer ref="observer" v-slot="{ handleSubmit }">
      <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
        <input-email v-model="form.email"></input-email>

        <b-button type="submit" variant="gradido" class="mt-4">
          {{ $t('settings.password.send_now') }}
        </b-button>
      </b-form>
    </validation-observer>

    <div class="text-center py-lg-4">
      <router-link to="/login" class="mt-3">{{ $t('back') }}</router-link>
    </div>
  </div>
</template>
<script>
import { forgotPassword } from '@/graphql/mutations'
import InputEmail from '@/components/Inputs/InputEmail'

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
      subtitle: 'settings.password.subtitle',
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
          this.$router.push('/thx/forgotPassword')
        })
        .catch(() => {
          this.toastError(this.$t('error.email-already-sent'))
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
