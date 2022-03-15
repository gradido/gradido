import NotFound from '@/pages/NotFoundPage.vue'

const routes = [
  {
    path: '/authenticate',
  },
  {
    path: '/',
    redirect: (to) => {
      return { path: '/login' }
    },
  },
  {
    path: '/overview',
    component: () => import('@/pages/Overview.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/send',
    component: () => import('@/pages/Send.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    component: () => import('@/pages/Profile.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/transactions',
    component: () => import('@/pages/Transactions.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    component: () => import('@/pages/Login.vue'),
  },
  {
    path: '/register',
    component: () => import('@/pages/Register.vue'),
  },
  {
    path: '/thx/:comingFrom',
    component: () => import('@/pages/thx.vue'),
    beforeEnter: (to, from, next) => {
      const validFrom = ['forgot-password', 'reset-password', 'register', 'login', 'checkEmail']
      if (!validFrom.includes(from.path.split('/')[1])) {
        next({ path: '/login' })
      } else {
        next()
      }
    },
  },
  {
    path: '/forgot-password',
    component: () => import('@/pages/ForgotPassword.vue'),
  },
  {
    path: '/forgot-password/:comingFrom',
    component: () => import('@/pages/ForgotPassword.vue'),
  },
  {
    path: '/register-community',
    component: () => import('@/pages/RegisterCommunity.vue'),
  },
  {
    path: '/select-community',
    component: () => import('@/pages/SelectCommunity.vue'),
  },
  {
    path: '/reset-password/:optin',
    component: () => import('@/pages/ResetPassword.vue'),
  },
  {
    path: '/checkEmail/:optin',
    component: () => import('@/pages/ResetPassword.vue'),
  },
  {
    path: '/redeem/:code',
    component: () => import('@/pages/ShowTransactionLinkInformations.vue'),
  },
  { path: '*', component: NotFound },
]

export default routes
