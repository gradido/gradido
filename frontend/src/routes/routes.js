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
    // userIdentifier can be username, email or gradidoID
    // communityIdentifier can be community name or community UUID
    path: '/send/:communityIdentifier?/:userIdentifier?',
    component: () => import('@/pages/Send'),
    name: 'Send',
    props: true,
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
    name: 'Transactions',
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
    path: '/contributions',
    component: () => import('@/pages/Contributions'),
    meta: {
      requiresAuth: true,
      pageTitle: 'contributions',
    },
    redirect: (to) => {
      return { path: '/contributions/contribute' }
    },
  },
  {
    path: '/contributions/:tab/:page?',
    component: () => import('@/pages/Contributions.vue'),
    meta: {
      requiresAuth: true,
      pageTitle: 'contributions',
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
  {
    path: '/usersearch',
    component: () => import('@/pages/UserSearch'),
    meta: {
      requiresAuth: true,
      pageTitle: 'usersearch',
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
    path: '/settings/:tabAlias?',
    component: () => import('@/pages/Settings'),
    meta: {
      requiresAuth: true,
      pageTitle: 'settings',
    },
  },
  {
    name: 'Login',
    path: '/login/:code?',
    component: () => import('@/pages/Login'),
  },
  {
    name: 'Register',
    path: '/register/:code?',
    component: () => import('@/pages/Register'),
  },
  {
    name: 'ForgotPassword',
    path: '/forgot-password',
    component: () => import('@/pages/ForgotPassword'),
  },
  {
    name: 'ForgotPasswordComingFrom',
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
    name: 'ResetPassword',
    path: '/reset-password/:optin',
    component: () => import('@/pages/ResetPassword'),
  },
  {
    name: 'CheckEmail',
    path: '/checkEmail/:optin/:code?',
    component: () => import('@/pages/ResetPassword'),
  },
  {
    name: 'Redeem',
    path: '/redeem/:code',
    component: () => import('@/pages/TransactionLink'),
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: NotFound,
  },
]

export default routes
