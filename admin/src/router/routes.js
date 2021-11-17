const routes = [
  {
    path: '/',
    component: () => import('@/views/Overview.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/overview',
    component: () => import('@/views/Overview.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/user',
    component: () => import('@/views/UserSearch.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/creation',
    component: () => import('@/views/Creation.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/creation-confirm',
    component: () => import('@/views/CreationConfirm.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '*',
    component: () => import('@/components/NotFoundPage.vue'),
  },
]

export default routes
