import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
import router from '../routes/router.js'
import loginAPI from '../apis/loginAPI'
import communityAPI from '../apis/communityAPI'

export const store = new Vuex.Store({
  state: {
    session_id: null,
    email: null,
    user : {
      name:"",
      balance: 0
    },
    ajaxCreateData:  {
      session_id : '',
      email: "max.musterman@gmail.de",
      amount: 10000000,
      target_date:"2021-02-19T13:25:36+00:00", 
      memo:"AGE",
      auto_sign: true
    },
    transactions: [],
    modals: false
  },
  // Retrieve a state variable
  getters: {
    //isLoggedIn: (state /*, getters */) => {
    //  return state.session_id !== null;
    //}
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
    user_balance: (state,balance) => {
      console.log('mutation: user_balance')
      state.user.balance = balance / 10000
    },
    transactions: (state,transactions) => {
      console.log('mutation: transactions')
      state.transactions = transactions
    }
  },
  // Asyncronous actions - used for api calls
  actions: {
    login: async ({ dispatch, commit }, data) => {
      console.log('action: login')
      const result = await loginAPI.login(data.email,data.password)
      if( result.success ){
        commit('session_id', result.result.data.session_id)
        commit('email', data.email)
        $cookies.set('gdd_session_id', result.result.data.session_id);
        $cookies.set('gdd_u',  data.email);
        router.push('/KontoOverview')
      } else {
        // Register failed, we perform a logout
        dispatch('logout')
      } 
    },
    createUser: async ({ commit, dispatch }, data) => {
      console.log('action: createUser')
      const result = await loginAPI.create(data.email,data.first_name,data.last_name,data.password)
      if( result.success ){
        commit('session_id', result.result.data.session_id)
        commit('email', data.email)
        $cookies.set('gdd_session_id', result.result.data.session_id);
        $cookies.set('gdd_u',  data.email);
        router.push('/KontoOverview')
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
      $cookies.remove('gdd_session_id');
      $cookies.remove('gdd_u');
      router.push('/Login')
    },
    ajaxCreate: async ({ dispatch, state }) => {
      console.log('action: ajaxCreate')
      console.log(state.ajaxCreateData)
      const result = await communityAPI.create(
        state.ajaxCreateData.session_id,
        state.ajaxCreateData.email,
        state.ajaxCreateData.amount,
        state.ajaxCreateData.memo,
        state.ajaxCreateData.target_date,
      )
      if( result.success ){
        // TODO
      } else {
        dispatch('logout')
      }
    },
    ajaxListTransactions: async ({commit, dispatch, state}) => {
      console.log('action: ajaxListTransactions')
      const result = await communityAPI.transactions(state.session_id)
      console.log(result)
      if(result.success) {
        commit('transactions', result.result.data.transactions)
      } else {
        dispatch('logout')
      }
    },
    accountBalance: async ({ commit, dispatch, state }) => {
      console.log('action: accountBalance')
      const result = await communityAPI.balance(state.session_id)
      console.log(result)
      if(result.success) {
        commit('user_balance', result.result.data.balance)
      } else {
        dispatch('logout')
      }
    }
  }  
})