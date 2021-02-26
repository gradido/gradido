import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
import router from '../routes/router.js'
import loginAPI from '../apis/loginAPI'

// TODO make persistent: https://translate.google.de/translate?hl=de&sl=en&u=https://sandulat.com/safely-persisting-vuex-store-in-local-storage/&prev=search&pto=aue
export const store = new Vuex.Store({
  state: {
    /*path: 'http://192.168.0.89/account/',
    is_auth: false,
    is_admin: false,
    active: false,
    modals: false,
    user : {
      name:"",
      email:""
    },
    dataLogout: {"session_id": -127182}*/
    session_id: null,
    email: null
  },
  // Retrieve a state variable
  getters: {
    /*isActive: (state, getters) => {
      return state.active;
    }*/
  },
  // Syncronous mutation of the state
  mutations: {
    email: (state, email) => {
      console.log('mutation: email')
      state.email = email
    },
    session_id: (state,session_id) => {
      console.log('mutation: session_id')
      state.session_id = session_id
    },
  },
  // Asyncronous actions - used for api calls
  actions: {
    login: async ({ dispatch, commit }, data) => {
      console.log('action: login')
      const result = await loginAPI.login(data.email,data.password)
      console.log(result)
      if( result.success ){
        // We are not logged in, we need to do that manually.
        // TODO show user a success message
        commit('session_id', result.result.data.session_id)
        commit('email', data.email)
        router.push('/KontoOverview')
      } else {
        // Register failed, we perform a logout
        dispatch('logout')
      } 
    },
    createUser: async ({ dispatch }, data) => {
      console.log('action: createUser')
      const result = await loginAPI.create(data.email,data.first_name,data.last_name,data.password)
      if( result.success ){
        // TODO We are not logged in, we need to do that manually.
        // TODO show user a success message
      } else {
        // Register failed, we perform a logout
        dispatch('logout')
      }
    },     
    logout: async ({ commit , state }) => {
      console.log('action: logout')
      // Are we actually logged in?
      if(state.session_id){
        const result = await loginAPI.logout(state.session_id)
        // The result can be error, but thats ok with us
      }

      commit('session_id', null)
      commit('email', null)
      router.push('/landing')
    }
  }
})