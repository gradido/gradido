<template>
  <div class="login-form">
    <b-container v-if="enterData">
      <div class="pb-5" align="center">{{ $t('gdd_per_link.isFree') }}</div>
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
import InputPassword from '@/components/Inputs/InputPassword'
import InputEmail from '@/components/Inputs/InputEmail'
import Message from '@/components/Message/Message'
import { login } from '@/graphql/mutations'

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
    }
  },
  methods: {
    async onSubmit() {
      const loader = this.$loading.show({
        container: this.$refs.submitButton,
      })
      this.$apollo
        .mutate({
          mutation: login,
          variables: {
            email: this.form.email,
            password: this.form.password,
            publisherId: this.$store.state.publisherId,
          },
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
            this.errorSubtitle = this.$t('message.activateEmail')
            this.errorLinkTo = '/forgot-password'
            this.toastError(this.$t('error.no-account'))
          } else if (error.message.includes('User has no password set yet')) {
            this.showPageMessage = true
            this.errorSubtitle = this.$t('message.unsetPassword')
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
