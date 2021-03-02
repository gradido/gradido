import DashboardLayout from '@/views/Layout/DashboardLayout.vue'
import AuthLayoutGDD from '@/views/Layout/AuthLayout_gdd.vue'
import AuthLayout from '@/views/Layout/AuthLayout.vue'

import NotFound from '@/views/NotFoundPage.vue'


const routes = [
  {
    path: '/',
    redirect: 'login',
    component: AuthLayoutGDD,
    children: [
      {
        path: '/login',
        name: 'login',
        component: () => import('../views/Pages/Login.vue')
      },
      {
        path: '/thx',
        name: 'Thanks',
        component: () => import('../views/Pages/thx.vue')
      },      
      {
        path: '/register',
        name: 'register',
        component: () => import('../views/Pages/Register.vue')
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
        component: () => import('../views/KontoOverview.vue'),
        meta: {
          requiresAuth: true
        }
      },     
      {
        path: '/profile',
        name: 'profile',
        component: () => import('../views/Pages/UserProfile.vue')
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
        component: () => import('../views/AdminOverview.vue'),
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
