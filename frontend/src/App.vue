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
      if ( $cookies.isKey("gdd_session_id") == true  ) {
        this.$store.state.email = this.$cookies.get('gdd_u')
        this.$router.push('/KontoOverview') 
      }else {
       this.$router.push("/Login")
      } 
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
