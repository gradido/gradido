<template>
  <div class="resetpwd-form" v-if="authenticated">
    <!-- Header -->
    <div class="header p-4">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('reset-password.title') }}</h1>
              <div class="pb-4">{{ $t('reset-password.text') }}</div>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>
    <!-- Page content -->
    <b-container class="mt--8 p-1">
      <!-- Table -->
      <b-row class="justify-content-center">
        <b-col lg="6" md="8">
          <b-card no-body class="border-0" style="background-color: #ebebeba3 !important">
            <b-card-body class="p-4">
              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <validation-provider
                    :name="$t('form.password')"
                    :rules="{ required: true }"
                    v-slot="validationContext"
                  >
                    <b-form-group
                      class="mb-5"
                      :label="$t('form.password')"
                      label-for="resetPassword"
                    >
                      <b-input-group>
                        <b-form-input
                          id="resetPassword"
                          :name="$t('form.password')"
                          v-model="form.password"
                          :placeholder="$t('form.password')"
                          :type="passwordVisible ? 'text' : 'password'"
                          :state="getValidationState(validationContext)"
                          aria-describedby="resetPasswordLiveFeedback"
                        ></b-form-input>

                        <b-input-group-append>
                          <b-button variant="outline-primary" @click="togglePasswordVisibility">
                            <b-icon :icon="passwordVisible ? 'eye' : 'eye-slash'" />
                          </b-button>
                        </b-input-group-append>
                      </b-input-group>
                      <b-form-invalid-feedback id="resetPasswordLiveFeedback">
                        {{ validationContext.errors[0] }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </validation-provider>

                  <b-form-group
                    class="mb-5"
                    :label="$t('form.passwordRepeat')"
                    label-for="resetPasswordRepeat"
                  >
                    <b-input-group>
                      <b-form-input
                        id="resetPasswordRepeat"
                        :name="$t('form.passwordRepeat')"
                        v-model.lazy="form.passwordRepeat"
                        :placeholder="$t('form.passwordRepeat')"
                        :type="passwordVisibleRepeat ? 'text' : 'password'"
                      ></b-form-input>

                      <b-input-group-append>
                        <b-button variant="outline-primary" @click="togglePasswordRepeatVisibility">
                          <b-icon :icon="passwordVisibleRepeat ? 'eye' : 'eye-slash'" />
                        </b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>

                  <transition name="hint" appear>
                    <div v-if="passwordValidation.errors.length > 0 && !submitted" class="hints">
                      <ul>
                        <li v-for="error in passwordValidation.errors" :key="error">
                          <small>{{ error }}</small>
                        </li>
                      </ul>
                    </div>
                    <div class="matches" v-else-if="!samePasswords">
                      <p>
                        {{ $t('site.signup.dont_match') }}
                        <i class="ni ni-active-40" color="danger"></i>
                      </p>
                    </div>
                  </transition>
                  <div
                    class="text-center"
                    v-if="passwordsFilled && samePasswords && passwordValidation.valid"
                  >
                    <b-button type="submit" variant="secondary" class="mt-4">
                      {{ $t('reset') }}
                    </b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
import loginAPI from '../../apis/loginAPI'
export default {
  name: 'reset',
  data() {
    return {
      form: {
        password: '',
        passwordRepeat: '',
      },
      password: '',
      passwordVisible: false,
      submitted: false,
      authenticated: false,
      sessionId: null,
      email: null,
    }
  },
  methods: {
    getValidationState({ dirty, validated, valid = null }) {
      return dirty || validated ? valid : null
    },
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible
    },
    async onSubmit() {
      const result = await loginAPI.changePassword(this.sessionId, this.email, this.form.password)
      if (result.success) {
        this.form.password = ''
        /*
            this.$store.dispatch('login', {
            sessionId: result.result.data.session_id,
            email: result.result.data.user.email,
            })
          */
        this.$router.push('/thx/reset')
      } else {
        this.$toast.error(result.result.message)
      }
    },
    async authenticate() {
      const optin = this.$route.params.optin
      const result = await loginAPI.loginViaEmailVerificationCode(optin)
      if (result.success) {
        this.authenticated = true
        this.sessionId = result.result.data.session_id
        this.email = result.result.data.user.email
      } else {
        this.$toast.error(result.result.message)
      }
    },
  },
  computed: {
    samePasswords() {
      return this.form.password === this.form.passwordRepeat
    },
    passwordsFilled() {
      return this.form.password !== '' && this.form.passwordRepeat !== ''
    },
    rules() {
      return [
        { message: this.$t('site.signup.lowercase'), regex: /[a-z]+/ },
        { message: this.$t('site.signup.uppercase'), regex: /[A-Z]+/ },
        { message: this.$t('site.signup.minimum'), regex: /.{8,}/ },
        { message: this.$t('site.signup.one_number'), regex: /[0-9]+/ },
      ]
    },
    passwordValidation() {
      const errors = []
      for (const condition of this.rules) {
        if (!condition.regex.test(this.form.password)) {
          errors.push(condition.message)
        }
      }
      if (errors.length === 0) {
        return { valid: true, errors }
      }
      return { valid: false, errors }
    },
  },
  async created() {
    this.authenticate()
  },
}
</script>
<style></style>
