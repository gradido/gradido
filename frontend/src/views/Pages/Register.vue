<template>
  <div>
    <!-- Header -->
    <div class="header bg-gradient-success py-7 py-lg-5 pt-lg-1">
      <b-container class="container">
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-5">
              <h1 class="text-white">Erstelle deine Gradido Wallet</h1>
              <p class="text-lead text-white">Werde teil der Community</p>
            </b-col>
          </b-row>
        </div>
      </b-container>
      <div class="separator separator-bottom separator-skew zindex-100">
        <svg x="0" y="0" viewBox="0 0 2560 100" preserveAspectRatio="none" version="1.1"
             xmlns="http://www.w3.org/2000/svg">
          <polygon class="fill-default" points="2560 0 2560 100 0 100"></polygon>
        </svg>
      </div>
    </div>
    <!-- Page content -->
    <b-container class="mt--8 pb-5">
      <!-- Table -->
      <b-row class="justify-content-center">
        <b-col lg="6" md="8" >
          <b-card no-body class="bg-secondary border-0">
             
            <b-card-body class="px-lg-5 py-lg-5">
              <div class="text-center text-muted mb-4">
                <small>sign up </small>
              </div>
              <validation-observer v-slot="{handleSubmit}" ref="formValidator">
                <b-form role="form" @submit.prevent="handleSubmit(onSubmit)">
                  <base-input alternative
                              class="mb-3"
                              prepend-icon="ni ni-hat-3"
                              placeholder="Vorname"
                              name="Vorname"
                              :rules="{required: true}"
                              v-model="model.firstname">
                  </base-input>
                   <base-input alternative
                              class="mb-3"
                              prepend-icon="ni ni-hat-3"
                              placeholder="Nachname"
                              name="Nachname"
                              :rules="{required: true}"
                              v-model="model.lastname">
                  </base-input>

                  <base-input alternative
                              class="mb-3"
                              prepend-icon="ni ni-email-83"
                              placeholder="Email"
                              name="Email"
                              :rules="{required: true, email: true}"
                              v-model="model.email">
                  </base-input>

                  <base-input alternative
                              class="mb-3"
                              prepend-icon="ni ni-lock-circle-open"
                              placeholder="password"
                              type="password"
                              name="Password"
                              :rules="{required: true, min: 6}"
                              v-model="model.password">
                  </base-input>
                  <div class="text-muted font-italic"><small>password strength: <span
                    class="text-success font-weight-700">strong</span></small></div>
                  <b-row class=" my-4">
                    <b-col cols="12">
                      <base-input :rules="{ required: { allowFalse: false } }" name=Privacy Policy>
                        <b-form-checkbox v-model="model.agree">
                          <span class="text-muted">I agree with the <a href="#!">Privacy Policy</a></span>
                        </b-form-checkbox>
                      </base-input>
                    </b-col>
                  </b-row>
                  <div class="text-center">
                    <b-button type="submit" variant="primary" class="mt-4">Create account</b-button>
                  </div>
                </b-form>
              </validation-observer>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
      <div class="text-center py-lg-5" >
                    <b-button type="button" variant="success" class="mt-4" to="/Login">zurück</b-button>
                  </div>

                  <div>
  <b-button v-b-modal.modal-1 variant="primary">Launch demo modal</b-button>

  <b-modal id="modal-1" title="New message to undefined">
    <p class="my-4">...</p>
  </b-modal>
</div>
    </b-container>
  </div>
</template>
<script>

  export default {
    name: 'register',
    data() {
      return {
        model: {
          firstname: '',
          lastname: '',
          email: '',
          password: '',
          agree: false
        }
      }
    },
    methods: {
      onSubmit() {
        // this will be called only after form is valid. You can do an api call here to register users
          
      console.log("onSubmit()  ")
       console.log("landingpage login() email  ", this.model.email)
       console.log("landingpage login()  firstname ", this.model.firstname)
       console.log("landingpage login()  lastname ", this.model.lastname)
       console.log("landingpage login()  password ", this.model.password)
       this.$store.commit('creatUser', {"email":this.model.email, "first_name":this.model.firstname, "last_name":this.model.lastname , "emailType": 2, "password":this.model.password})      
       
      }
    }
  };
</script>
<style></style>
