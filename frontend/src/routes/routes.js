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
    // A page of its own rather than a panel over whatever is open: at a till this is worked
    // with for minutes at a time, the keypad wants the whole width, and the back button then
    // does what somebody expects without any handling of ours.
    path: '/calculator',
    component: () => import('@/pages/Calculator'),
    meta: {
      requiresAuth: true,
      pageTitle: 'calculator',
    },
  },
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
  // The Gradido address, `community-host/u/alias`. Public on purpose: it is what a printed
  // card, an e-mail signature or a QR code points at, and most people who arrive here are not
  // logged in -- a phone camera opens the default browser, not the one the wallet was signed
  // into. It has to stay above the catch-all, which is what used to swallow it: every printed
  // QR code landed on "page not found".
  {
    name: 'PublicProfile',
    path: '/u/:alias',
    component: () => import('@/pages/PublicProfile'),
  },
  // Where a scanned thank you card lands. Its own namespace rather than a query on the
  // Gradido address, because the card carries neither a name nor an address, only its
  // code -- which keeps the profile page out of this entirely.
  //
  // ⚠️ requiresAuth, and that IS the whole login handling: the person who scans is the
  // RECIPIENT and has an account, so the router guard sends them through the login and
  // back here on its own. Nothing below checks whether anybody is signed in.
  {
    name: 'ThankYouCardPayment',
    path: '/dk/:code',
    component: () => import('@/pages/ThankYouCardPayment'),
    props: true,
    meta: {
      requiresAuth: true,
      // ⚠️ A flat slug, not the key of the heading itself: the breadcrumb prefixes
      // `pageTitle.`, and vue-i18n reads the dots as a path — so anything nested would be
      // looked up under `pageTitle` and printed raw when it is not found there.
      pageTitle: 'thank-you-card-receive',
    },
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: NotFound,
  },
]

export default routes
