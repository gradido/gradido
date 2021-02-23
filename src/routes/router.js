import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './routes'
import {store} from '../store/store';

Vue.use(VueRouter)

// configure router
const router = new VueRouter({
  routes, // short for routes: routes
  linkActiveClass: 'active',
  scrollBehavior: (to, from ,savedPosition) => {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { selector: to.hash }
    }
    return { x: 0, y: 0 }
  }
});

router.beforeEach((to, from, next) => {
 
  let language = to.params.lang
     if (!language) {
       language = 'de'
     }
   
  //console.log("----------------")
  //("ROUTER.js to", to)
  //console.log("ROUTER.js store.state.is_auth", store.state.is_auth)
  //console.log("ROUTER.js store.commit('isActive')", store.commit('isActive'))
  
  //if (store.commit('isActive') ) {
  //  next()
  //} else {
  //  next("/login")
  //}
  //console.log(from)
  //console.log(next)

  next()
  
})

export default router
