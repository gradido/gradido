import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
import axios from 'axios';
import VueCookies from 'vue-cookies';
import router from '../routes/router.js';

export const store = new Vuex.Store({
  state: {
    path: 'http://192.168.0.89/account/',
    is_auth: false,
    is_admin: false,
    active: false,
    modals: false,
    url: "",
    user : {
      name:"",
      email:"",
      sessionID: 0,
      balance: 0
    },
    ajaxCreateData:  {
      session_id : '',
      email: "max.musterman@gmail.de",
      amount: 10000000,
      target_date:"2021-02-19T13:25:36+00:00", 
      memo:"AGE",
      auto_sign: true
    }
  },
  mutations: {   
    isActive(state) {
      //("Im Store PRÜFEN PRÜFEN" )   
      return true      
    },
    login (state, logindata) {
      //console.log("Im Store LOGIN() start " )  
      //console.log("logon state =>", state )  
      //console.log("logon TEST =>", logindata )  
      axios.post("http://localhost/login_api/unsecureLogin", logindata).then((ldata) => {
         
        console.log("Im Store LOGIN() axios then.statusText ", ldata);
        if (ldata.statusText === "OK") {          
            //console.log("STORE login() ldatasession_id",  ldata.data.session_id)                
            state.is_auth = true 
            state.active = true
            state.user.sessionID = ldata.data.session_id
            state.user.email = logindata.email
            $cookies.set('gdd_is_auth','true');
            $cookies.set('gdd_session_id', ldata.data.session_id);
            $cookies.set('gdd_email',logindata.email);
            console.log("cookie ? GRADIDO_LOGIN",  $cookies.get('GRADIDO_LOGIN'))  
            //this.$store.commit('accountBalance')
            //console.log("STORE login() to " + state.is_auth)      
            router.push('/KontoOverview')
           
        }
         
        return true
      }, (error) => {
        console.log(error);
      });
      //console.log("STORE login() from" + state.is_auth)       
      //if (state.is_auth) { 
      //  state.is_auth = false 
      //  state.active = false
      //} else { 
      //  state.is_auth = true 
      //  state.active = true
      //}
      //  console.log("STORE login() to " + state.is_auth)      
    },
    creatUser( state, formdata) {
      //console.log("Im Store creatUser() start " ) 
      axios.post("http://localhost/login_api/createUser", formdata).then((ldata) => {
         
         console.log("Im Store creatUser() axios then ", ldata);
         // this.ldata = ldata.data;
         router.push('/Login')
         
      }, (error) => {
        console.log(error);
      });
    },     
    logout(state){
      axios.post("http://localhost/login_api/logout", {"session_id": state.user.sessionID}).then((ldata) => {
         
      //console.log("Im Store logout() axios then ", ldata);
       // this.ldata = ldata.data;
        //return true
        state.is_auth = false 
        state.is_admin = false 
        state.active = false
        state.user.sessionID = ''
        state.user.email = ''
        $cookies.set('gdd_is_auth','false');
        $cookies.remove('gdd_email');
        $cookies.remove('gdd_session_id');
        router.push('/Login')
      }, (error) => {
        console.log(error);
      });
        
    },
    ajaxCreate(state){
      state.ajaxCreateData.session_id = state.user.sessionID
      console.log(" state.ajaxCreateData => ",  state.ajaxCreateData)
      axios.post(" http://localhost/transaction-creations/ajaxCreate/", state.ajaxCreateData).then((req) => {
        console.log("ajaxCreate => ", req)
      }, (error) => { 
        console.log(error);
      });
    },
    ajaxListTransactions(state) {
      console.log("ajaxListTransactions => START")
      axios.get("http://localhost/state-balances/ajaxListTransactions/"+ state.user.sessionID).then((req) => {
        console.log("ajaxListTransactions => ", req)
      }, (error) => {
        console.log(error);
      });
    },
    accountBalance(state) {
      console.log(" => START")
      state.url = "http://localhost/state-balances/ajaxGetBalance/"+ state.user.sessionID
      console.log(state.url)
      axios.get(state.url).then((req) => {
        console.log("accountBalance => ", req.data.balance)
        state.user.balance = req.data.balance
      }, (error) => {
        console.log(error);
      });
    }
  }
})