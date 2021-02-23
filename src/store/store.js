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
    user : {
      name:"",
      email:""
    },
    dataLogout: {"session_id": -127182}
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
         
        //console.log("Im Store LOGIN() axios then.statusText ", ldata.statusText);
        if (ldata.statusText === "OK") {          
          //console.log("STORE login() from" + state.is_auth)                
            state.is_auth = true 
            state.active = true
            $cookies.set('gdd_is_auth','true');
            $cookies.set('gdd_email',logindata.email);
            state.user.email = logindata.email
     
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
         return true
         
      }, (error) => {
        console.log(error);
      });
    },     
    logout(state){
      axios.post("http://localhost/login_api/logout", this.dataLogout).then((ldata) => {
         
      //console.log("Im Store logout() axios then ", ldata);
       // this.ldata = ldata.data;
        //return true
        state.is_auth = false 
        state.is_admin = false 
        state.active = false
        $cookies.set('gdd_is_auth','false');
        $cookies.remove('gdd_email');
        router.push('/Landing')
      }, (error) => {
        console.log(error);
      });
        
    }
  }
})