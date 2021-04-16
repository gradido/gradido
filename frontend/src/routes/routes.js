import NotFound from '@/views/NotFoundPage.vue'

const routes = [
  {
    path: '/overview',
    component: () => import('../views/Pages/KontoOverview.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profile',
    component: () => import('../views/Pages/UserProfileCard.vue'),
  },
  {
    path: '/profileedit',
    component: () => import('../views/Pages/UserProfileEdit.vue'),
  },
  {
    path: '/activity',
    component: () => import('../views/Pages/UserProfileActivity.vue'),
  },
  {
    path: '/transactions',
    component: () => import('../views/Pages/UserProfileTransactionList.vue'),
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
    path: '/register',
    component: () => import('../views/Pages/Register.vue'),
  },
  {
    path: '/password',
    component: () => import('../views/Pages/ForgotPassword.vue'),
  },
  {
    path: '/reset',
    component: () => import('../views/Pages/ResetPassword.vue'),
  },

  { path: '*', component: NotFound },
]

export default routes
