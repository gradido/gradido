<template>
  <div class="resetpwd-form" v-if="authenticated">
    <!-- Header -->
    <div class="header p-4">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>Reset Password</h1>
              <div class="pb-4">
                Jetzt kannst du ein neues Passwort speichern, mit welchem du dich zukünfitg in der
                GRADIDO App anmelden kannst.
              </div>
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
            <b-card-body class="py-lg-4 px-sm-0 px-0 px-md-2 px-lg-4">
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
                        <b-button variant="outline-primary">
                          <b-icon
                            :icon="passwordVisible ? 'eye' : 'eye-slash'"
                            @click="togglePasswordVisibility"
                          />
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
                      {{ $t('signup') }}
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
       authenticated: false,
       session_id: null,
     }
   },
   methods: {
     togglePasswordVisibility() {
       this.passwordVisible = !this.passwordVisible
     },
     onSubmit() {
       this.$store.dispatch('createUser', {
         password: this.model.password,
       })
       this.model.password = ''
       this.$router.push('/thx')
     },
   },
   computed: {
     samePasswords() {
       return this.password === this.checkPassword
     },
     passwordsFilled() {
       return this.password !== '' && this.checkPassword !== ''
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
   async created() {
     const optin = this.$route.params.optin
     const result = await loginAPI.loginViaEmailVerificationCode(optin)
     console.log('result', result)
     if (result.success) {
       this.authenticated = true
       this.session_id = result.result.data.session_id
     } else {
       alert(result.result.message)
     }
   },
 }
</script>
<style></style>
