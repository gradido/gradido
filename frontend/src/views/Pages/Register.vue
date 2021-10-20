<template>
  <div id="registerform">
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
              <div class="text-center text-muted mb-4 test-communitydata">
                <b>{{ $store.state.community.name }}</b>
                <p class="text-lead">
                  {{ $store.state.community.description }}
                </p>
                <div>{{ $t('signup') }}</div>
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

                  <input-email v-model="form.email"></input-email>

                  <hr />
                  <input-password-confirmation
                    v-model="form.password"
                    :register="register"
                  ></input-password-confirmation>

                  <b-row>
                    <b-col cols="12">
                      {{ $t('language') }}
                      <language-switch-select @update-language="updateLanguage" />
                    </b-col>
                  </b-row>

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

                  <div class="text-center">
                    <div class="text-center">
                      <router-link class="test-button-back" to="/login">
                        <b-button variant="outline-secondary" class="mr-4">
                          {{ $t('back') }}
                        </b-button>
                      </router-link>
                      <b-button
                        :disabled="!(namesFilled && emailFilled && form.agree && !!language)"
                        type="submit"
                        variant="primary"
                      >
                        {{ $t('signup') }}
                      </b-button>
                    </div>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
    <!--
    <div class="text-center pt-4">
      <router-link class="test-button-another-community" to="/select-community">
        <b-button variant="outline-secondary">
          {{ $t('community.choose-another-community') }}
        </b-button>
      </router-link>
    </div>
    -->
  </div>
</template>
<script>
import InputEmail from '../../components/Inputs/InputEmail.vue'
import InputPasswordConfirmation from '../../components/Inputs/InputPasswordConfirmation.vue'
import LanguageSwitchSelect from '../../components/LanguageSwitchSelect.vue'
import { registerUser } from '../../graphql/mutations'

export default {
  components: { InputPasswordConfirmation, InputEmail, LanguageSwitchSelect },
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
      language: '',
      submitted: false,
      showError: false,
      messageError: '',
      register: true,
    }
  },
  methods: {
    updateLanguage(e) {
      this.language = e
    },
    getValidationState({ dirty, validated, valid = null }) {
      return dirty || validated ? valid : null
    },
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: registerUser,
          variables: {
            email: this.form.email,
            firstName: this.form.firstname,
            lastName: this.form.lastname,
            password: this.form.password.password,
            language: this.language,
            publisherId: this.$store.state.publisherId,
          },
        })
        .then(() => {
          this.$router.push('/thx/register')
        })
        .catch((error) => {
          this.showError = true
          this.messageError = error.message
        })
    },
    closeAlert() {
      this.showError = false
      this.messageError = ''
      this.form.email = ''
      this.form.firstname = ''
      this.form.lastname = ''
      this.form.password.password = ''
      this.form.password.passwordRepeat = ''
      this.language = ''
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
  },
  created() {
    this.messageError = ''
    this.form.email = ''
    this.form.firstname = ''
    this.form.lastname = ''
    this.form.password.password = ''
    this.form.password.passwordRepeat = ''
    this.language = ''
  },
}
</script>
<style></style>
