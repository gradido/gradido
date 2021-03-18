<template>
  <div>
    <!-- Header -->
    <div class="  py-7 py-lg-5 pt-lg-1">
         <b-container>
        <div class="text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-5">
              <h1>Gradido Wallet</h1>
              <p class="text-lead">{{ $t('site.login.community')}}</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
     
    </div>
    <!-- Page content -->
    <b-container class="mt--8 pb-5">
      <b-row class="justify-content-center">
        <b-col lg="5" md="7">
          <b-card no-body class="bg-secondary border-0 mb-0">
            <b-card-body class="px-lg-5 py-lg-5">
              
                <div class="text-center text-muted mb-4">
                <small>{{ $t('login')}}</small>
              </div>
               <validation-observer v-slot="{handleSubmit}" ref="formValidator">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <base-input alternative
                              class="mb-3"
                              name="Email"
                              :rules="{required: true, email: true}"
                              prepend-icon="ni ni-email-83"
                              placeholder="Email"
                              v-model="model.email">
                  </base-input>

                  <base-input alternative
                              class="mb-3"
                              name="Password"
                              :rules="{required: true, min: 6}"
                              prepend-icon="ni ni-lock-circle-open"
                              type="password"
                              :placeholder="$t('form.password')"
                              v-model="model.password">
                  </base-input>

                  <b-form-checkbox v-model="model.rememberMe">{{ $t('site.login.remember')}}</b-form-checkbox>
                  <div class="text-center">
                    <base-button type="primary" native-type="submit" class="my-4">{{ $t('site.login.signin')}}</base-button>
                  </div>
                </b-form>
              </validation-observer>  
            </b-card-body>
          </b-card>
          <b-row class="mt-3">
            <b-col cols="6">
              <router-link to="/password" >{{ $t('site.login.forgot_pwd')}}</router-link>
            </b-col>
            <b-col cols="6" class="text-right">
              <router-link to="/register">{{ $t('site.login.new_wallet')}}</router-link>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
  export default {
    name: "login",
    data() {
      return {
        model: {
          email: '',
          password: '',
          rememberMe: false
        }
      };
    },
    methods: {    
      onSubmit() {
        this.$store.dispatch('login', {"email":  this.model.email, "password":  this.model.password})
      }
    }
  }
</script>
