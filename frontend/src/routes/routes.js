import NotFound from '@/views/NotFoundPage.vue'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      return { path: '/login' }
    },
  },
  {
    path: '/overview',
    component: () => import('../views/Pages/AccountOverview.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    component: () => import('../views/Pages/UserProfileOverview.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/transactions',
    component: () => import('../views/Pages/UserProfileTransactionList.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    component: () => import('../views/Pages/Login.vue'),
  },
  {
    path: '/thx',
    component: () => import('../views/Pages/thx.vue'),
  },
  {
    path: '/password',
    component: () => import('../views/Pages/ForgotPassword.vue'),
  },
  {
    path: '/reset/:optin',
    component: () => import('../views/Pages/ResetPassword.vue'),
  },
  { path: '*', component: NotFound },
]

export default routes
