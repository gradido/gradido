<template>
  <div>
    <div class="header py-7 py-lg-5 pt-lg-1">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-5">
              <h1 class="text-white">{{ $t('site.password.title')}}</h1>
              <p class="text-lead text-white">{{ $t('site.password.subtitle')}}</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
    
    </div>
    <b-container class="mt--8 pb-5">
      <b-row class="justify-content-center">
        <b-col lg="6" md="8" >
          <b-card no-body class="bg-secondary border-0">             
            <b-card-body class="px-lg-5 py-lg-5">              
              <validation-observer v-slot="{handleSubmit}" ref="formValidator">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <base-input alternative
                    class="mb-3"
                    prepend-icon="ni ni-email-83"
                    :placeholder="$t('form.email')"
                    name="Email"
                    :rules="{required: true, email: true}"
                    v-model="model.email">
                  </base-input>                  
                  <div class="text-center">
                    <b-button type="submit" variant="primary" class="mt-4">{{ $t('site.password.reset_now')}}</b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <div class="text-center py-lg-4" >
        <b-button type="button" variant="success" class="mt-3" to="/Login">{{ $t('back')}}</b-button>
      </div>           
    </b-container>
  </div>
</template>
<script>
  export default {
    name: 'password',
    data() {
      return {
        model: {
          email: ''        
        }
      }
    },
    methods: {
      onSubmit() {
        this.$store.dispatch('passwordReset', {"email":this.model.email}) 
        this.model.email = ""
        this.$router.push('/thx')          
     }
    }
  };
</script>
<style></style>
