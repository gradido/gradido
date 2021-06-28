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

              <validation-observer ref="observer" v-slot="{ passes }">
                <b-form @submit.stop.prevent="passes(onSubmit)">
                  <validation-provider
                    name="Email"
                    :rules="{ required: true, email: true }"
                    v-slot="validationContext"
                  >
                    <b-form-group class="mb-3" label="Email" label-for="login-email">
                      <b-form-input
                        id="login-email"
                        name="example-input-1"
                        v-model="form.email"
                        placeholder="Email"
                        :state="getValidationState(validationContext)"
                        aria-describedby="login-email-live-feedback"
                      ></b-form-input>

                      <b-form-invalid-feedback id="login-email-live-feedback">
                        {{ validationContext.errors[0] }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </validation-provider>

                  <input-password
                    :label="$t('form.password')"
                    :placeholder="$t('form.password')"
                    v-model="form.password"
                  ></input-password>

                  <b-alert v-show="loginfail" show dismissible variant="warning">
                    <span class="alert-text bv-example-row">
                      <b-row>
                        <b-col class="col-9 text-left text-dark">
                          <strong>
                            {{ $t('error.no-account') }}
                          </strong>
                        </b-col>
                      </b-row>
                    </span>
                  </b-alert>
                  <div class="text-center mt-4">
                    <b-button type="submit" variant="primary">{{ $t('login') }}</b-button>
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
import InputPassword from '../../components/Inputs/InputPassword'

export default {
  name: 'login',
  components: {
    InputPassword,
  },
  data() {
    return {
      form: {
        email: '',
        password: '',
        // rememberMe: false
      },
      loginfail: false,
      allowRegister: CONFIG.ALLOW_REGISTER,
      passwordVisible: false,
    }
  },
  methods: {
    getValidationState({ dirty, validated, valid = null }) {
      return dirty || validated ? valid : null
    },
    async onSubmit() {
      // error info  ausschalten
      this.loginfail = false
      const loader = this.$loading.show({
        container: this.$refs.submitButton,
      })
      const result = await loginAPI.login(this.form.email, this.form.password)
      if (result.success) {
        this.$store.dispatch('login', {
          sessionId: result.result.data.session_id,
          user: result.result.data.user,
        })
        this.$router.push('/overview')
        loader.hide()
      } else {
        loader.hide()
        this.loginfail = true
      }
    },
  },
}
</script>
