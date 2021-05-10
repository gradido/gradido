<template>
  <div class="login-form">
    <!-- Header -->
    <div class="p-3">
      <b-container>
        <div class="text-center mb-7 header">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>Gradido</h1>
              <p class="text-lead">{{ $t('site.login.community') }}</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>
    <!-- Page content -->
    <b-container class="mt--8">
      <b-row class="justify-content-center">
        <b-col lg="5" md="7">
          <b-card no-body class="border-0 mb-0" style="background-color: #ebebeba3 !important">
            <b-card-body class="p-4">
              <div class="text-center text-muted mb-4">
                <small>{{ $t('login') }}</small>
              </div>
              <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <base-input
                    alternative
                    class="mb-3"
                    name="Email"
                    :rules="{ required: true, email: true }"
                    prepend-icon="ni ni-email-83"
                    placeholder="Email"
                    v-model="model.email"
                  ></base-input>

                  <base-input
                    alternative
                    class="mb-3"
                    name="Password"
                    prepend-icon="ni ni-lock-circle-open"
                    type="password"
                    :placeholder="$t('form.password')"
                    v-model="model.password"
                  ></base-input>

                  <b-alert v-show="loginfail" show dismissible variant="warning">
                    <span class="alert-text bv-example-row">
                      <b-row>
                        <b-col class="col-9 text-left text-dark">
                          <strong>
                            Leider konnten wir keinen Account finden mit diesen Daten!
                          </strong>
                        </b-col>
                      </b-row>
                    </span>
                  </b-alert>

                  <!-- <b-form-checkbox v-model="model.rememberMe">{{ $t('site.login.remember')}}</b-form-checkbox> -->
                  <div class="text-center" ref="submitButton">
                    <base-button type="secondary" native-type="submit" class="my-4">
                      {{ $t('site.login.signin') }}
                    </base-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
          <b-row class="mt-3">
            <b-col cols="6">
              <router-link to="/password">
                {{ $t('site.login.forgot_pwd') }}
              </router-link>
            </b-col>
            <b-col cols="6" class="text-right" v-show="allowRegister">
              <router-link to="/register">
                {{ $t('site.login.new_wallet') }}
              </router-link>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import loginAPI from '../../apis/loginAPI'
import CONFIG from '../../config'

export default {
  name: 'login',
  data() {
    return {
      model: {
        email: '',
        password: '',
        // rememberMe: false
      },
      loginfail: false,
      allowRegister: CONFIG.ALLOW_REGISTER,
    }
  },
  methods: {
    async onSubmit() {
      const loader = this.$loading.show({
        container: this.$refs.submitButton,
      })
      const result = await loginAPI.login(this.model.email, this.model.password)
      if (result.success) {
        this.$store.dispatch('login', {
          sessionId: result.result.data.session_id,
          email: this.model.email,
        })
        this.$router.push('/overview')
        loader.hide()
      } else {
        loader.hide()
        this.loginfail = true
      }
    },
    closeAlert() {
      this.$loading.hide()
      this.loginfail = false
    },
  },
}
</script>
