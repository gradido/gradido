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
    props: { gdt: false },
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/gdt',
    component: () => import('@/pages/Transactions.vue'),
    props: { gdt: true },
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/community',
    component: () => import('@/pages/Community.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/information',
    component: () => import('@/pages/InfoStatistic.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login/:code?',
    component: () => import('@/pages/Login.vue'),
  },
  {
    path: '/register/:code?',
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
    path: '/forgot-password/:comingFrom/:code',
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
  { path: '*', component: NotFound },
]

export default routes
