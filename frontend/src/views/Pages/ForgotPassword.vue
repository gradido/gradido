<template>
  <div class="forgot-password">
    <div class="header p-4">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('site.password.title') }}</h1>
              <p class="text-lead">{{ $t('site.password.subtitle') }}</p>
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
                      {{ $t('site.password.send_now') }}
                    </b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <div class="text-center py-lg-4">
        <router-link to="/Login" class="mt-3">{{ $t('back') }}</router-link>
      </div>
    </b-container>
  </div>
</template>
<script>
import { sendResetPasswordEmail } from '../../graphql/queries'
import InputEmail from '../../components/Inputs/InputEmail'

export default {
  name: 'password',
  components: {
    InputEmail,
  },
  data() {
    return {
      disable: 'disabled',
      form: {
        email: '',
      },
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
        .then((result) => {
          this.$router.push('/thx/password')
        })
        .catch(() => {
          this.$router.push('/thx/password')
        })
    },
  },
}
</script>
<style></style>
