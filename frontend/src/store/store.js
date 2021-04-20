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
    },
    passwordReset: async (data) => {},
    schoepfen: async (data) => {
      // http://localhost/transaction-creations/ajaxCreate
    },
    createUser: async ({ commit, dispatch }, data) => {
      commit('session_id', data.session_id)
      commit('email', data.email)
    },
    logout: async ({ commit, state }) => {
      if (state.session_id) {
        const result = await loginAPI.logout(state.session_id)
        // The result can be error, but thats ok with us
      }
      commit('session_id', null)
      commit('email', null)
      sessionStorage.clear()
    },
    accountBalance: async ({ commit, dispatch, state }) => {
      const result = await communityAPI.balance(state.session_id)
      if (result.success) {
        commit('user_balance', result.result.data.balance)
      } else {
        //dispatch('logout')
      }
    },
  },
})
