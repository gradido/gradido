<template>
<div id="app" class="font-sans text-gray-800">
    <header class="border-t-4 border-blue-700 bg-white z-10 absolute w-full shadow-md">     
    </header>
    <div class="bg-gray-100 min-h-screen pt-40 text-lg">     
      <router-view />
       <particles-bg type="custom" :config="config" :bg="true" />
    </div>
  </div> 
</template>

<script>
import { ParticlesBg } from "particles-bg-vue";
import icon from "./icon.js";

export default {
  name: 'app',
  components: {
      ParticlesBg,
    },
    created () { 
      //console.log("this.$cookies.get('gdd_session_id') ", this.$cookies.get('gdd_session_id') )
      //console.log(" $cookies.isKey('gdd_session_id') == true", this.$cookies.isKey("gdd_session_id") == true )
      if ( this.$cookies.get('gdd_session_id')  == this.$store.state.session_id ) {
        //this.$store.state.email = this.$cookies.get('gdd_u')       
        this.$router.push('/KontoOverview') 
      }else {
       this.$router.push("/Login")
      } 
    },
     data: function () {
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
