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
              <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <b-form-group :label="$t('form.password')">
                    <b-input-group>
                      <b-form-input
                        class="mb-0"
                        v-model="password"
                        name="password"
                        :class="{ valid: passwordValidation.valid }"
                        :type="passwordVisible ? 'text' : 'password'"
                        prepend-icon="ni ni-lock-circle-open"
                        :placeholder="$t('form.password')"
                      ></b-form-input>

                      <b-input-group-append>
                        <b-button variant="outline-primary" @click="togglePasswordVisibility">
                          <b-icon :icon="passwordVisible ? 'eye' : 'eye-slash'" />
                        </b-button>
                      </b-input-group-append>
                    </b-input-group>
                  </b-form-group>

                  <base-input
                    :label="$t('form.password_repeat')"
                    type="password"
                    name="password-repeat"
                    :placeholder="$t('form.password_repeat')"
                    prepend-icon="ni ni-lock-circle-open"
                    v-model.lazy="checkPassword"
                    :class="{ valid: passwordValidation.valid }"
                  />

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
      password: '',
      checkPassword: '',
      passwordVisible: false,
      submitted: false,
      authenticated: false,
      sessionId: null,
      email: null,
    }
  },
  methods: {
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible
    },
    async onSubmit() {
      const result = await loginAPI.changePassword(this.sessionId, this.email, this.password)
      if (result.success) {
        this.password = ''
        this.$store.dispatch('login', {
          sessionId: result.result.data.session_id,
          email: result.result.data.user.email,
        })
        this.$router.push('/thx')
      } else {
        alert(result.result.message)
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
        alert(result.result.message)
      }
    },
  },
  computed: {
    samePasswords() {
      return this.password === this.checkPassword
    },
    passwordsFilled() {
      return this.password !== '' && this.checkPassword !== ''
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
        if (!condition.regex.test(this.password)) {
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
