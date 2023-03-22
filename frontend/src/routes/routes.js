import NotFound from '@/pages/NotFoundPage'

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
    component: () => import('@/pages/Overview'),
    meta: {
      requiresAuth: true,
      pageTitle: 'overview',
    },
  },
  {
    path: '/send',
    component: () => import('@/pages/Send'),
    meta: {
      requiresAuth: true,
      pageTitle: 'send',
    },
  },
  // {
  //   path: '/profile',
  //   component: () => import('@/pages/Profile'),
  //   meta: {
  //     requiresAuth: true,
  //   },
  // },
  {
    path: '/transactions',
    component: () => import('@/pages/Transactions'),
    props: { gdt: false },
    meta: {
      requiresAuth: true,
      pageTitle: 'transactions',
    },
  },
  {
    path: '/gdt',
    component: () => import('@/pages/Transactions'),
    props: { gdt: true },
    meta: {
      requiresAuth: true,
      pageTitle: 'gdt',
    },
  },
  {
    path: '/community',
    component: () => import('@/pages/Community'),
    meta: {
      requiresAuth: true,
      pageTitle: 'community',
    },
    redirect: (to) => {
      return { path: '/community/contribute' }
    },
  },
  {
    path: '/community/:tab',
    component: () => import('@/pages/Community.vue'),
    meta: {
      requiresAuth: true,
      pageTitle: 'community',
    },
  },
  {
    path: '/information',
    component: () => import('@/pages/InfoStatistic'),
    meta: {
      requiresAuth: true,
      pageTitle: 'information',
    },
  },
  // {
  //   path: '/storys',
  //   component: () => import('@/pages/TopStorys'),
  //   meta: {
  //     requiresAuth: true,
  //   },
  // },
  // {
  //   path: '/addresses',
  //   component: () => import('@/pages/Addresses'),
  //   meta: {
  //     requiresAuth: true,
  //   },
  // },
  {
    path: '/settings',
    component: () => import('@/pages/Settings'),
    meta: {
      requiresAuth: true,
      pageTitle: 'settings',
    },
  },
  {
    path: '/login/:code?',
    component: () => import('@/pages/Login'),
  },
  {
    path: '/register/:code?',
    component: () => import('@/pages/Register'),
  },
  {
    path: '/forgot-password',
    component: () => import('@/pages/ForgotPassword'),
  },
  {
    path: '/forgot-password/:comingFrom',
    component: () => import('@/pages/ForgotPassword'),
  },
  {
    path: '/register-community',
    component: () => import('@/pages/RegisterCommunity'),
  },
  // {
  //   path: '/select-community',
  //   component: () => import('@/pages/SelectCommunity'),
  // },
  {
    path: '/reset-password/:optin',
    component: () => import('@/pages/ResetPassword'),
  },
  {
    path: '/checkEmail/:optin/:code?',
    component: () => import('@/pages/ResetPassword'),
  },
  {
    path: '/redeem/:code',
    component: () => import('@/pages/TransactionLink'),
  },
  { path: '*', component: NotFound },
]

export default routes
