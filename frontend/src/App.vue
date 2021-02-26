<template>
<div id="app" class="font-sans text-gray-800">
    <header class="border-t-4 border-blue-700 bg-white z-10 absolute w-full shadow-md">     
    </header>
    <div class="bg-gray-100 min-h-screen pt-40 text-lg">     
      <router-view />
    </div>
  </div> 
</template>

<script>

export default {
   name: 'app',
    created () { 
      if (this.$cookies.get('gdd_is_auth') == 'true' && this.$store.state.is_auth == true) {
        this.$store.state.user.email = this.$cookies.get('gdd_email')
      
        // if ( this.$store.state.is_auth == false && this.$store.state.is_admin == false) {
        //  this.$router.push("/Landing")
        // }  else {
         this.$router.push('/KontoOverview') 
        // }
     }else {
       this.$router.push("/Login")
     } 
      
      //var user = { id:1, name:'Journal',session:'25j_7Sl6xDq2Kc3ym0fmrSSk2xV2XkUkX' };
      //this.$cookies.set('user',user);
      //// print user name
     //console.log("APP.vue START created get cookie is_auth=>",this.$cookies.get('gdd_is_auth'))
     
     },
     methods: {
       /*
        login() {
          //console.log("app.vue user login() : " + this.$store.state.is_auth)
          this.$store.commit('login')
          //this.$router.push('/KontoOverview')      
        },
        loginAsAdmin () {      
         // console.log("app.vue admin login(): " + this.$store.state.is_admin)
          this.$store.state.modals = true
          //this.$store.commit('loginAsAdmin')
          //this.$router.push('/AdminOverview')
        },
         
        logout(){
         // console.log("app.vue user logout() : ")
          this.$store.commit('logout')
        }       
        */
    }
}
</script>
<style>
    
    gradido-global-color-text{color:  #3D443B }
    gradido-global-color-accent{color:  #047006 }
    gradido-global-color-6e0a9c9e{color:  #000 } 
    gradido-global-color-2d0fb154{color:  #047006 }
    gradido-global-color-16efe88c{color:  #7EBC55 }
    gradido-global-color-1939326{color:  #F6FFF6 }
    gradido-global-color-9d79fc1{color:  #047006 }
    gradido-global-color-6347f4d{color:  #5A7B02 }
    gradido-global-color-4fbc19a{color:  #014034 }
    gradido-global-color-d341874{color:  #B6D939 }
    gradido-global-color-619d338{color:  #8EBFB1 }
    gradido-global-color-44819a9{color:  #026873 }
   
</style>
