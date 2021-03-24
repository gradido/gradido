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
            <b-card-body class="px-lg-5 py-lg-5">
              <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <base-input
                    alternative
                    class="mb-3"
                    prepend-icon="ni ni-email-83"
                    :placeholder="$t('form.email')"
                    name="Email"
                    :rules="{ required: true, email: true }"
                    v-model="model.email"
                  ></base-input>
                  {{ form }}
                  <div class="text-center">
                    <b-button
                      type="submit"
                      outline
                      variant="secondary"
                      class="mt-4"
                      :disabled="disable"
                    >
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
export default {
  name: 'password',
  data() {
    return {
      disable: 'disabled',
      model: {
        email: '',
      },
    }
  },
  methods: {
    onSubmit() {
      this.$store.dispatch('passwordReset', { email: this.model.email })
      this.model.email = ''
      this.$router.push('/thx')
    },
  },
}
</script>
<style></style>
