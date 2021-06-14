<template>
  <div>
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
                  <validation-provider
                    name="Email"
                    :rules="{ required: true, email: true }"
                    v-slot="validationContext"
                  >
                    <b-form-group class="mb-3" label="Email" label-for="input-reset-pwd">
                      <b-form-input
                        id="input-reset-pwd"
                        name="input-reset-pwd"
                        v-model="form.email"
                        placeholder="Email"
                        :state="getValidationState(validationContext)"
                        aria-describedby="reset-pwd--live-feedback"
                      ></b-form-input>

                      <b-form-invalid-feedback id="reset-pwd--live-feedback">
                        {{ validationContext.errors[0] }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </validation-provider>

                  <div class="text-center">
                    <b-button type="submit" variant="primary">
                      {{ $t('site.password.reset_now') }}
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
import loginAPI from '../../apis/loginAPI.js'

export default {
  name: 'password',
  data() {
    return {
      disable: 'disabled',
      form: {
        email: '',
      },
    }
  },
  created() {},
  methods: {
    getValidationState({ dirty, validated, valid = null }) {
      return dirty || validated ? valid : null
    },
    async onSubmit() {
      await loginAPI.sendEmail(this.form.email)
      // always give success to avoid email spying
      this.$router.push('/thx/password')
    },
  },
}
</script>
<style></style>
