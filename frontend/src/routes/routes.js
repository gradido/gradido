import DashboardLayout from '@/views/Layout/DashboardLayout.vue'
import AuthLayoutGDD from '@/views/Layout/AuthLayout_gdd.vue'
import AuthLayout from '@/views/Layout/AuthLayout.vue'

import NotFound from '@/views/NotFoundPage.vue'


const routes = [
  {
    path: '/',
    redirect: 'landing',
    component: AuthLayoutGDD,
    children: [
      {
        path: '/login',
        name: 'login',
        component: () => import(/* webpackChunkName: "demo" */ '../views/Pages/Login.vue')
      },
      {
        path: '/Landing',
        name: 'Landing',
        component: () => import(/* webpackChunkName: "demo" */ '../views/Landing.vue')
      },      
      {
        path: '/register',
        name: 'register',
        component: () => import(/* webpackChunkName: "demo" */ '../views/Pages/Register.vue')
      },
    ]
  },
  {
    path: '/',
    redirect: 'KontoOverview',
    component: DashboardLayout,
    children: [
      {
        path: '/KontoOverview',
        name: 'Kontoübersicht',
        component: () => import(/* webpackChunkName: "demo" */ '../views/KontoOverview.vue'),
        meta: {
          requiresAuth: true
        }
      },     
      {
        path: '/profile',
        name: 'profile',
        component: () => import(/* webpackChunkName: "demo" */ '../views/Pages/UserProfile.vue')
      }
    ]
  },
  ,
  {
    path: '/',
    redirect: 'AdminOverview',
    component: AuthLayout,
    children: [
      {
        path: '/AdminOverview',
        name: 'Adminübersicht',
        component: () => import(/* webpackChunkName: "demo" */ '../views/AdminOverview.vue'),
        meta: {
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/',
    redirect: 'login',
    component: AuthLayout,
    children: [
     
      { path: '*', component: NotFound }
    ]
  }
];

export default routes;
