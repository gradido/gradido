import NotFound from '@/pages/NotFoundPage'
import CONFIG from '@/config'

// The new matching ships dark. Without MATCHING_ACTIVE its routes are never
// registered at all, so /matching falls through to the catch-all and shows "not
// found" instead of opening a page the instance does not offer. Hiding only the
// menu entry would leave the pages reachable by typing the address.
// Order matters in here: /matching/karte has to stay ahead of /matching/:tab,
// or the map would be swallowed as a fourth tab.
const matchingRoutes = CONFIG.MATCHING_ACTIVE
  ? [
      {
        path: '/matching',
        component: () => import('@/pages/Matching'),
        meta: {
          requiresAuth: true,
          pageTitle: 'matching',
        },
        redirect: () => {
          return { path: '/matching/entries' }
        },
      },
      {
        // Ahead of /matching/:tab so the map is a place of its own rather than a
        // fourth tab: it is where you go looking, and it wants the whole canvas.
        path: '/matching/karte',
        component: () => import('@/pages/MatchingMap'),
        meta: {
          requiresAuth: true,
          pageTitle: 'matching',
          // This route brings its own head, so the layout drops the navbar, the page
          // heading and the content header. On a phone it drops everything and the
          // map takes the screen; on desktop the menu stays and the logo moves under
          // it, because the navbar it used to live in is gone.
          bareChrome: true,
        },
      },
      {
        path: '/matching/:tab',
        component: () => import('@/pages/Matching'),
        meta: {
          requiresAuth: true,
          pageTitle: 'matching',
        },
      },
    ]
  : []

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
  ...matchingRoutes,
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
