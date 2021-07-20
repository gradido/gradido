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

              <validation-observer ref="observer" v-slot="{ handleSubmit }">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <validation-provider
                    :name="$t('form.firstname')"
                    :rules="{ required: true, min: 3 }"
                    v-slot="validationContext"
                  >
                    <b-form-group
                      class="mb-3"
                      :label="$t('form.firstname')"
                      label-for="registerFirstname"
                    >
                      <b-form-input
                        id="registerFirstname"
                        :name="$t('form.firstname')"
                        v-model="form.firstname"
                        :placeholder="$t('form.firstname')"
                        :state="getValidationState(validationContext)"
                        aria-describedby="registerFirstnameLiveFeedback"
                      ></b-form-input>

                      <b-form-invalid-feedback id="registerFirstnameLiveFeedback">
                        {{ validationContext.errors[0] }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </validation-provider>

                  <validation-provider
                    :name="$t('form.lastname')"
                    :rules="{ required: true, min: 2 }"
                    v-slot="validationContext"
                  >
                    <b-form-group
                      class="mb-3"
                      :label="$t('form.lastname')"
                      label-for="registerLastname"
                    >
                      <b-form-input
                        id="registerLastname"
                        :name="$t('form.lastname')"
                        v-model="form.lastname"
                        :placeholder="$t('form.lastname')"
                        :state="getValidationState(validationContext)"
                        aria-describedby="registerLastnameLiveFeedback"
                      ></b-form-input>

                      <b-form-invalid-feedback id="registerLastnameLiveFeedback">
                        {{ validationContext.errors[0] }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </validation-provider>

                  <input-email v-model="form.email" id="registerEmail"></input-email>

                  <hr />
                  <input-password v-model="form.password" id="registerPassword"></input-password>
                  <input-password-confirmation v-model="form.passwordRepeat" id="registerPasswordRepeat"></input-password-confirmation>

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
                      <b-form-checkbox
                        id="registerCheckbox"
                        v-model="form.agree"
                        :name="$t('site.signup.agree')"
                      >
                        <span class="text-muted" v-html="$t('site.signup.agree')"></span>
                      </b-form-checkbox>
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
                      form.agree
                    "
                  >
                    <div class="text-center">
                      <b-button class="ml-2" @click="resetForm()">{{ $t('form.reset') }}</b-button>
                      <b-button type="submit" variant="primary">{{ $t('signup') }}</b-button>
                    </div>
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
import InputEmail from '../../components/Inputs/InputEmail.vue'
import InputPassword from '../../components/Inputs/InputPassword.vue'
import InputPasswordConfirmation from '../../components/Inputs/InputPasswordConfirmation.vue'

export default {
  components: { InputPassword, InputPasswordConfirmation, InputEmail },
  name: 'register',
  data() {
    return {
      form: {
        firstname: '',
        lastname: '',
        email: '',
        agree: false,
        password: '',
        passwordRepeat: '',
      },

      passwordVisible: false,
      passwordVisibleRepeat: false,
      submitted: false,
      showError: false,
      messageError: '',
    }
  },
  methods: {
    getValidationState({ dirty, validated, valid = null }) {
      return dirty || validated ? valid : null
    },
    resetForm() {
      this.form = {
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        passwordRepeat: '',
      }
      this.$nextTick(() => {
        this.$refs.observer.reset()
      })
    },
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible
    },
    togglePasswordRepeatVisibility() {
      this.passwordVisibleRepeat = !this.passwordVisibleRepeat
    },
    async onSubmit() {
      const result = await loginAPI.create(
        this.form.email,
        this.form.firstname,
        this.form.lastname,
        this.form.password,
      )
      if (result.success) {
        this.$store.dispatch('login', {
          sessionId: result.result.data.session_id,
          email: this.form.email,
        })
        this.form.email = ''
        this.form.firstname = ''
        this.form.lastname = ''
        this.password = ''
        this.passwordVisibleRepeat = ''
        this.$router.push('/thx/register')
      } else {
        this.showError = true
        this.messageError = result.result.message
      }
    },
    closeAlert() {
      this.showError = false
      this.messageError = ''
      this.form.email = ''
      this.form.firstname = ''
      this.form.lastname = ''
      this.form.password = ''
    },
  },
  computed: {
    samePasswords() {
      return this.form.password === this.form.passwordRepeat
    },
    passwordsFilled() {
      return this.form.password !== '' && this.form.passwordRepeat !== ''
    },
    namesFilled() {
      return (
        this.form.firstname !== '' &&
        this.form.firstname.length > 2 &&
        this.form.lastname !== '' &&
        this.form.lastname.length > 1
      )
    },
    emailFilled() {
      return this.form.email !== ''
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
}
</script>
<style></style>
