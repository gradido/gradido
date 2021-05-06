<template>
  <div class="register-form">
    <!-- Header -->
    <div class="header p-4">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $t('site.signup.title') }}</h1>
              <p class="text-lead">{{ $t('site.signup.subtitle') }}</p>
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
              <div class="text-center text-muted mb-4">
                <small>{{ $t('signup') }}</small>
              </div>
              <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <base-input
                    :label="$t('form.firstname')"
                    alternative
                    class="mb-3"
                    name="firstname"
                    :rules="{ required: true, min: 3 }"
                    v-model="model.firstname"
                  ></base-input>
                  <base-input
                    :label="$t('form.lastname')"
                    alternative
                    class="mb-3"
                    name="lastname"
                    :rules="{ required: true, min: 2 }"
                    v-model="model.lastname"
                  ></base-input>

                  <base-input
                    :label="$t('form.email')"
                    alternative
                    class="mb-3"
                    name="Email"
                    :rules="{ required: true, email: true }"
                    v-model="model.email"
                  ></base-input>

                  <hr />
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

                  <b-row class="my-4">
                    <b-col cols="12">
                      <base-input
                        :rules="{ required: { allowFalse: false } }"
                        name="Privacy Policy"
                      >
                        <b-form-checkbox v-model="model.agree">
                          <span class="text-muted" v-html="$t('site.signup.agree')"></span>
                        </b-form-checkbox>
                      </base-input>
                    </b-col>
                  </b-row>
                  <b-alert
                    v-if="showError"
                    show
                    dismissible
                    variant="warning"
                    @dismissed="closeAlert"
                  >
                    <span class="alert-icon"><i class="ni ni-point"></i></span>
                    <span class="alert-text">
                      <strong>{{ $t('error.error') }}!</strong>
                      {{ messageError }}
                    </span>
                  </b-alert>

                  <div
                    class="text-center"
                    v-if="
                      passwordsFilled &&
                      samePasswords &&
                      passwordValidation.valid &&
                      namesFilled &&
                      emailFilled &&
                      model.agree
                    "
                  >
                    <b-button type="submit" variant="secondary" class="mt-4">
                      {{ $t('signup') }}
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
import loginAPI from '../../apis/loginAPI'

export default {
  name: 'register',
  data() {
    return {
      model: {
        firstname: '',
        lastname: '',
        email: '',
        agree: false,
      },
      rules: [
        { message: this.$t('site.signup.lowercase'), regex: /[a-z]+/ },
        { message: this.$t('site.signup.uppercase'), regex: /[A-Z]+/ },
        { message: this.$t('site.signup.minimum'), regex: /.{8,}/ },
        { message: this.$t('site.signup.one_number'), regex: /[0-9]+/ },
      ],
      password: '',
      checkPassword: '',
      passwordVisible: false,
      submitted: false,
      showError: false,
      messageError: '',
    }
  },
  methods: {
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible
    },
    async onSubmit() {
      const result = await loginAPI.create(
        this.model.email,
        this.model.firstname,
        this.model.lastname,
        this.password,
      )
      if (result.success) {
        this.$store.dispatch('login', {
          session_id: result.result.data.session_id,
          email: this.model.email,
        })
        this.model.email = ''
        this.model.firstname = ''
        this.model.lastname = ''
        this.password = ''
        this.$router.push('/thx')
      } else {
        this.showError = true
        this.messageError = result.result.message
      }
    },
    closeAlert() {
      this.showError = false
      this.messageError = ''
      this.model.email = ''
      this.model.firstname = ''
      this.model.lastname = ''
      this.password = ''
    },
  },
  computed: {
    samePasswords() {
      return this.password === this.checkPassword
    },
    passwordsFilled() {
      return this.password !== '' && this.checkPassword !== ''
    },
    namesFilled() {
      return (
        this.model.firstname !== '' &&
        this.model.firstname.length > 2 &&
        this.model.lastname !== '' &&
        this.model.lastname.length > 1
      )
    },
    emailFilled() {
      return this.model.email !== ''
    },
    passwordValidation() {
      let errors = []
      for (let condition of this.rules) {
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
}
</script>
<style></style>
