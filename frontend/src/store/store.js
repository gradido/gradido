import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
import router from '../routes/router.js'
import loginAPI from '../apis/loginAPI'
import axios from 'axios'

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
    ajaxCreate: async (state) => {
      state.ajaxCreateData.session_id = state.session_id
      console.log(" state.ajaxCreateData => ",  state.ajaxCreateData)
      axios.post(" http://localhost/transaction-creations/ajaxCreate/", state.ajaxCreateData).then((req) => {
        console.log("ajaxCreate => ", req)
      }, (error) => { 
        console.log(error);
      });
    },
    ajaxListTransactions: async (state) => {
     // console.log("ajaxListTransactions => START")
      axios.get("http://localhost/state-balances/ajaxListTransactions/" + state.session_id).then((req) => {
        console.log("ajaxListTransactions => ", req)
      }, (error) => {
        console.log(error);
      });
    },
    accountBalance: async ({ state }) => {
      //console.log(" => START")
      state.url = "http://localhost/state-balances/ajaxGetBalance/" + state.session_id
      //console.log(state.url)
      axios.get(state.url).then((req) => {
        console.log("accountBalance => ", req.data.balance)
        state.user.balance = req.data.balance
      }, (error) => {
        console.log(error);
      });
    }
  }  
})