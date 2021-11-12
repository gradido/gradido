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
    path: '/register',
    component: () => import('../views/Pages/Register.vue'),
  },
  {
    path: '/thx/:comingFrom',
    component: () => import('../views/Pages/thx.vue'),
    beforeEnter: (to, from, next) => {
      const validFrom = ['password', 'reset', 'register', 'login']
      if (!validFrom.includes(from.path.split('/')[1])) {
        next({ path: '/login' })
      } else {
        next()
      }
    },
  },
  {
    path: '/password',
    component: () => import('../views/Pages/ForgotPassword.vue'),
  },
  {
    path: '/register-community',
    component: () => import('../views/Pages/RegisterCommunity.vue'),
  },
  {
    path: '/select-community',
    component: () => import('../views/Pages/RegisterSelectCommunity.vue'),
  },
  {
    path: '/reset/:optin',
    component: () => import('../views/Pages/ResetPassword.vue'),
  },
  {
    path: '/checkEmail/:optin',
    component: () => import('../views/Pages/CheckEmail.vue'),
  },
  { path: '*', component: NotFound },
]

export default routes
