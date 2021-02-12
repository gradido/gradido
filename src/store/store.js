import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    path: 'http://192.168.0.89/account/',
    is_auth: false,
    is_admin: false,
    active: false,
    modals: false,
    user : {
      name:"oger ly",
      email:"test@test.de"
    }
  },
  mutations: {
    login (state) {
      console.log("store login() user from " + state.is_auth)       
      if (state.is_auth) { 
        state.is_auth = false 
        state.active = false
      } else { 
        state.is_auth = true 
        state.active = true
      }
        console.log("store login() user to " + state.is_auth)      
    },
    loginAsAdmin (state) {
      console.log("store login admin from" + state.is_admin)
      if (state.is_admin) { 
        state.is_admin = false 
        state.active = false
      } else { 
        state.is_admin = true 
        state.active = true
      }
      console.log("store login admin to" + state.is_admin)
    },
    logout(state){
        state.is_auth = false 
        state.is_admin = false 
        state.active = false
    }
  }
})