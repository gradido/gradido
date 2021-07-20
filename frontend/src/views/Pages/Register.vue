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
                  <input-password-confirmation v-model="form.password" />

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

                  <div class="text-center" v-if="namesFilled && emailFilled && form.agree">
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
import InputPasswordConfirmation from '../../components/Inputs/InputPasswordConfirmation.vue'

export default {
  components: { InputPasswordConfirmation, InputEmail },
  name: 'register',
  data() {
    return {
      form: {
        firstname: '',
        lastname: '',
        email: '',
        agree: false,
        password: {
          password: '',
          passwordRepeat: '',
        },
      },
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
        agree: false,
      }
      this.$nextTick(() => {
        this.$refs.observer.reset()
      })
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
  },
}
</script>
<style></style>
