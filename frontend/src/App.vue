<template>
<div id="app" class="font-sans text-gray-800">
    <header > 
      <b-col class="text-center">
        <b-dropdown  size="sm" split variant="secondary" :text="$t('language') + ' - '+$i18n.locale" class="m-md-2">
        <b-dropdown-divider></b-dropdown-divider> 
        <b-dropdown-item @click.prevent="setLocale('de')">Deutsch</b-dropdown-item>
        <b-dropdown-item @click.prevent="setLocale('en')">English</b-dropdown-item>
       </b-dropdown>
     </b-col>     
    </header>
    <div class="">   
      <particles-bg type="custom" :config="config" :bg="true" />  
      <router-view />       
    </div>
  </div> 
</template>

<script>
 import { ParticlesBg } from "particles-bg-vue";
 import icon from "./icon.js"
 import { localeChanged } from 'vee-validate'

 export default {
   name: 'app',
   components: {
     ParticlesBg
   },
   created () {  
     console.log( "xx", $cookies.get("gdd_lang"))
     console.log('%cWillkommen bei Gradido %cgreen text', 'font-weight:bold', 'color: green')
     if ( $cookies.isKey("gdd_session_id") == true) {
       console.log('%cHey %c'+$cookies.get("gdd_u")+'', 'font-weight:bold', 'color: orange')
       this.$store.commit('session_id', $cookies.get("gdd_session_id"))
       this.$store.commit('email', $cookies.get("gdd_u"))
       this.$store.commit('language', $cookies.get("gdd_lang"))
       this.$i18n.locale = $cookies.get("gdd_lang")
       this.$router.push("overview") 
     }else {
       console.log("app.vue to Logout")
       this.$store.dispatch('logout')
     }    
   },
   data() {
     return {
       config: {
         num: [1, 7],
         rps: 15,
         radius: [5, 50],
         life: [6.5, 15],
         v: [1, 1],
         tha: [-40, 40],
         body: icon,
         alpha: [0.6, 0],
         scale: [0.1, 0.4],
         position: "all",
         cross: "dead",
         random: 2,
       },
     };
   },
   methods: {
     setLocale(locale) {
       this.$i18n.locale = locale
       this.$store.commit('language', this.$i18n.locale)
       localeChanged(locale)
     }
   },
 }
</script>
<style>

    .btn-primary pim{
      background-color: #5A7B02;
      border-color: #5e72e4;
    }
     a, .copyright{
      color: #5A7B02;    
    }
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
