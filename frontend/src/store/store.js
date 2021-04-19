import Vue from 'vue'
import Vuex from 'vuex'
//import router from '../routes/router.js'
Vue.use(Vuex)
import loginAPI from '../apis/loginAPI'
import communityAPI from '../apis/communityAPI'
import createPersistedState from 'vuex-persistedstate'

export const store = new Vuex.Store({
  plugins: [
    createPersistedState({
      storage: window.sessionStorage,
    }),
  ],
  state: {
    session_id: null,
    email: '',
    language: 'en',
    sizeDE: 'normal',
    sizeGB: 'big',
    loginfail: false,
    user: {
      name: '',
      balance: 0,
      balance_gdt: 0,
    },
    modals: false,
    optionAxios: {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    },
  },
  getters: {},
  // Syncronous mutation of the state
  mutations: {
    language: (state, language) => {
      state.language = language
      $cookies.set('gdd_lang', language)
      if (state.language == 'de') {
        state.sizeDE = 'big'
        state.sizeGB = 'normal'
      } else {
        state.sizeDE = 'normal'
        state.sizeGB = 'big'
      }
    },
    loginfail: (state, loginfail) => {
      state.loginfail = loginfail
    },
    email: (state, email) => {
      state.email = email
    },
    session_id: (state, session_id) => {
      state.session_id = session_id
    },
    user_balance: (state, balance) => {
      state.user.balance = balance / 10000
    },
    user_balance_gdt: (state, balance) => {
      state.user.balance_gdt = balance / 10000
    },
  },
  // Asyncronous actions - used for api calls
  actions: {
    login: async ({ dispatch, commit }, data) => {
      commit('session_id', data.session_id)
      commit('email', data.email)
      //      $cookies.set('gdd_session_id', result.result.data.session_id)
      //      $cookies.set('gdd_u', data.email)
    },
    passwordReset: async (data) => {},
    schoepfen: async (data) => {
      // http://localhost/transaction-creations/ajaxCreate
    },
    createUser: async ({ commit, dispatch }, data) => {
      const result = await loginAPI.create(
        data.email,
        data.first_name,
        data.last_name,
        data.password,
      )
      if (result.success) {
        commit('session_id', result.result.data.session_id)
        commit('email', data.email)
        $cookies.set('gdd_session_id', result.result.data.session_id)
        $cookies.set('gdd_u', data.email)
        //router.push('/overview')
      } else {
        // Register failed, we perform a logout
        dispatch('logout')
      }
    },
    logout: async ({ commit, state }) => {
      if (state.session_id) {
        const result = await loginAPI.logout(state.session_id)
        // The result can be error, but thats ok with us
      }
      sessionStorage.clear()
      commit('session_id', null)
      commit('email', null)
    },
    accountBalance: async ({ commit, dispatch, state }) => {
      const result = await communityAPI.balance($cookies.get('gdd_session_id'))
      if (result.success) {
        commit('user_balance', result.result.data.balance)
      } else {
        //dispatch('logout')
      }
    },
  },
})
