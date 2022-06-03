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
    path: '/login/:code?',
    name: 'login',
    component: () => import('@/pages/Login.vue'),
  },
  {
    path: '/contribution-link-login/:code?',
    name: 'contribution-link-login',
    component: () => import('@/pages/Login.vue'),
  },
  {
    path: '/register/:code?',
    name: 'register',
    component: () => import('@/pages/Register.vue'),
  },
  {
    path: '/contribution-link-register/:code?',
    name: 'contribution-link-register',
    component: () => import('@/pages/Register.vue'),
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
    path: '/checkEmail/:optin/:code?',
    component: () => import('@/pages/ResetPassword.vue'),
  },
  {
    path: '/redeem/:code',
    component: () => import('@/pages/TransactionLink.vue'),
  },
  {
    path: '/contribution-link/:code',
    component: () => import('@/pages/ContributionLink.vue'),
  },
  { path: '*', component: NotFound },
]

export default routes
