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
    component: () => import('../views/Pages/UserProfile.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  // {
  //  path: '/profileedit',
  //  component: () => import('../views/Pages/UserProfileEdit.vue'),
  //  meta: {
  //    requiresAuth: true,
  //  },
  // },
  // {
  //  path: '/activity',
  //  component: () => import('../views/Pages/UserProfileActivity.vue'),
  //  meta: {
  //    requiresAuth: true,
  //  },
  // },
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
    path: '/thx/:comingFrom',
    component: () => import('../views/Pages/thx.vue'),
    beforeEnter: (to, from, next) => {
      const validFrom = ['password', 'reset', 'register']
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
    path: '/reset/:optin',
    component: () => import('../views/Pages/ResetPassword.vue'),
  },
  { path: '*', component: NotFound },
]

export default routes
