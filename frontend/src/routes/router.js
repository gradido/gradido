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
     next()  
})

export default router