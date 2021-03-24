import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
import router from '../routes/router.js'
import loginAPI from '../apis/loginAPI'
import communityAPI from '../apis/communityAPI'
//import CONFIG from '../config'

export const store = new Vuex.Store({
  state: {
    session_id: null,
    email: null,
    language: 'en',
    sizeDE: 'normal',
    sizeGB: 'big',
    user : {
      name:"",
      balance: 0,
      balance_gdt: 0
    },
    ajaxCreateData:  {
      session_id : '',
      email: "",
      amount: 0,
      target_date:"2021-02-19T13:25:36+00:00", 
      memo:"",
      auto_sign: true
    },
    transactions: [],
    modals: false,
    optionAxios: {
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
      }
    }
  },
  // Retrieve a state variable
  getters: {
    //isLoggedIn: (state /*, getters */) => {
    //  return state.session_id !== null;
    //}
  },
  // Syncronous mutation of the state
  mutations: {
    language: (state, language) => {
       console.log('mutation: language', language)
      state.language = language
      $cookies.set('gdd_lang',  language);
      if (state.language == "de") {
        state.sizeDE = 'big'
        state.sizeGB = 'normal'       
      } else {
        state.sizeDE = 'normal'
        state.sizeGB = 'big'
      }

    },
    email: (state, email) => {
      //console.log('mutation: email')
      state.email = email
    },
    session_id: (state,session_id) => {
      //console.log('mutation: session_id')
      state.session_id = session_id
    },
    user_balance: (state,balance) => {
      //console.log('mutation: user_balance')
      state.user.balance =  (balance/10000)
    },
    user_balance_gdt: (state,balance) => {
      //console.log('mutation: user_balance_gdt')
      state.user.balance_gdt = (balance/10000)
    },
    transactions: (state,transactions) => {
      //console.log('mutation: transactions')
      state.transactions = transactions
    }
  },
  // Asyncronous actions - used for api calls
  actions: {
    login: async ({ dispatch, commit }, data) => {
      // console.log('action: login')
    
      //axios.post("http://localhost/login_api/unsecureLogin/", 
      //            {"email": data.email, "password":data.password }).then((result) => {
           //  console.log("store login result", result)
       
      const result = await loginAPI.login(data.email,data.password)
     // console.log('result.data.state',result.data.state)
     // console.log('result.data.session_id',result.data.session_id)
     
    
      if( result.success){
        commit('session_id', result.result.data.session_id)
        commit('email', data.email)
        $cookies.set('gdd_session_id', result.result.data.session_id);
        $cookies.set('gdd_u',  data.email);
        
     
        router.push('/overview')
      } else {
        // Register failed, we perform a logout
        // console.log('action login to  logout start')
        dispatch('logout')
      }
      //}, (error) => {
      //  console.log(error);
      //});

      
    },
    passwordReset: async (data) => {
      console.log("<<<<<<<<<<< PASSWORT RESET TODO >>>>>>>>>>>", data.email)
    },
    schoepfen: async (data) => {
       // http://localhost/transaction-creations/ajaxCreate
    },
    createUser: async ({ commit, dispatch }, data) => {
      // console.log('action: createUser')
      const result = await loginAPI.create(data.email,data.first_name,data.last_name,data.password)
      if( result.success ){
        commit('session_id', result.result.data.session_id)
        commit('email', data.email)
        $cookies.set('gdd_session_id', result.result.data.session_id);
        $cookies.set('gdd_u',  data.email);
        router.push('/overview')
      } else {
        // Register failed, we perform a logout
        // console.log('action createUser to  logout start')
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
      $cookies.remove('gdd_lang');
      router.push('/Login')
    },
    ajaxCreate: async ({ dispatch, state }) => {
      //console.log('action: ajaxCreate')
      state.ajaxCreateData.amount = (state.ajaxCreateData.amount)*10000
      const result = await communityAPI.create($cookies.get("gdd_session_id", email, amount, memo)) 
      console.log(result)
      //axios.post("http://localhost/transaction-send-coins/ajaxCreate", state.ajaxCreateData).then((result) => {
      //  //console.log("store ajaxCreate result", result)
      // 
      //if( result.success ){
      //  // TODO
      //} else {
      //  //dispatch('logout')
      //}
      //}, (error) => {
      //  console.log(error);
      //});
    },
    ajaxListTransactions: async ({commit, dispatch, state}) => {
     // console.log('action: ajaxListTransactions', state.session_id)
     // const result = await communityAPI.transactions(state.session_id)     
    },
    accountBalance: async ({ commit, dispatch, state }) => {
        console.log('action: accountBalance')
      // console.log('action: dispatch', dispatch)
      // console.log('action: state.session_id', state.session_id)
      // console.log(" action: $cookies.get('gdd_session_id') ", $cookies.get("gdd_session_id")  )
      // commit('session_id', $cookies.get("gdd_session_id"))
      // commit('email', $cookies.get("gdd_u"))
      const result = await communityAPI.balance($cookies.get("gdd_session_id"))
        console.log("accountBalance result", result)
        console.log("aresult.result.data.balance", result.result.data.balance)
      if(result.success) {
        commit('user_balance', result.result.data.balance)
      } else {
        console.log('action accountBalance to  logout start')
        dispatch('logout')
      }
    }
  }  
})