<template>
  <div>
    <!-- Header -->
    <div class="header bg-gradient-info py-7 py-lg-8 pt-lg-9">
      <b-container>
        <div class="header-body text-center mb-7"> 
          <p class="h1">GRADIDO</p>
          <p class="h4">Wallet</p>
          <!-- <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="6" class="px-5">
              <h1 class="text-light">Landing Gradido</h1>               
              <br>
              <router-link to="/KontoOverview" class="font-weight-bold text-white mt-5"> LoginUser</router-link>
              <br><br>
              <router-link  to="/AdminOverview" class="font-weight-bold text-white mt-5"> Login Admin</router-link>
               <br><br>
              <router-link to="/register" class="font-weight-bold text-white mt-5"> Register</router-link>
            </b-col>
          </b-row> -->
          <hr>
          <p class="lead">
            Anmelden
          </p>

            <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="6" class="px-5">
             <form @submit.prevent="login">
 
                <b-row class="form-group">
                  <label for="example-email-input" class="col-md-2 col-form-label form-control-label">Email</label>
                  <b-col md="10">
                    <base-input type="email" autocomplete="username email" placeholder="argon@example.com" v-model="lemail"/>
                  </b-col>
                </b-row>
 
                <b-row class="form-group">
                  <label for="example-password-input"
                        class="col-md-2 col-form-label form-control-label">Password</label>
                  <b-col md="10">
                    <base-input type="password" autocomplete="current-password" placeholder="password" v-model="lpwd"/>
                  </b-col>
                </b-row>
 
                <b-button block type="submit" >Anmelden</b-button>
              </form>
            </b-col>
          </b-row>

      <hr>
      <p class="lead">
        neues Mitglied anlegen
      </p>

       <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="6" class="px-5">
             <form>
              <b-row class="form-group">
                <label class="col-md-2 col-form-label form-control-label">Vorname</label>
                <b-col md="10">
                  <base-input placeholder="Jon "  v-model="rfname"></base-input>
                </b-col>
              </b-row>
              <b-row class="form-group">
                <label class="col-md-2 col-form-label form-control-label">Nachname</label>
                <b-col md="10">
                  <base-input placeholder=" Snow"  v-model="rlname"></base-input>
                </b-col>
              </b-row>
              <b-row class="form-group">
                <label for="example-email-input" class="col-md-2 col-form-label form-control-label">Email</label>
                <b-col md="10">
                  <base-input type="email" autocomplete="username email" placeholder="argon@example.com" v-model="remail"/>
                </b-col>
              </b-row>
            
              <b-row class="form-group">
                <label for="example-password-input"
                      class="col-md-2 col-form-label form-control-label">Password</label>
                <b-col md="10">
                  <base-input type="password" autocomplete="current-password" placeholder="password" v-model="rpwd"/>
                </b-col>
              </b-row>            
            </form>
             <b-button block type="submit" @click="creatUser()">Anmelden</b-button>
            </b-col>
          </b-row>
    
        </div>
      </b-container>
      <div class="separator separator-bottom separator-skew zindex-100">
        <svg x="0" y="0" viewBox="0 0 2560 100" preserveAspectRatio="none" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <polygon class="fill-default" points="2560 0 2560 100 0 100"></polygon>
        </svg>
      </div>
    </div>
    <!-- Page content -->
  
  </div>
</template>
<script>
// Components

export default {
  name: 'Landing',
  data(){
    return {
      lemail: '',
      lpwd: '',
      rfname: '',
      rlname: '',
      remail: '',
      rpwd: ''
    }
  },
   methods: {
    login() {
      if (this.lemail != '' || this.lpwd != '') {
      //console.log("landingpage login()  ")
      //console.log("landingpage login() lemail  ", this.lemail)
      //console.log("landingpage login()  lpwd ", this.lpwd)
      this.$store.commit('login', {"email":  this.lemail, "password":  this.lpwd})   
      }
       
      //this.$router.push('/KontoOverview')
      
    },
     creatUser() {
      console.log("landingpage creatUser()  ")
       console.log("landingpage login() remail  ", this.remail)
       console.log("landingpage login()  rfname ", this.rfname)
       console.log("landingpage login()  rlname ", this.rlname)
       console.log("landingpage login()  rpwd ", this.rpwd)
      this.$store.commit('creatUser', {"email":this.remail, "first_name":this.rfname, "last_name":this.rlname , "emailType": 2, "password":this.rpwd})      
      //this.$router.push('/KontoOverview')
      
    },
    loginAsAdmin () {      
       console.log("app.vue admin login(): " + this.$store.state.is_admin)
      this.modals = false
      this.$store.commit('loginAsAdmin')
      this.$router.push('/AdminOverview')   
    }
   }
};
</script>