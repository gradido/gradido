const routes = [
  {
    path: '/authenticate',
  },
  {
    path: '/',
    component: () => import('@/pages/Overview.vue'),
  },
  {
    path: '/user',
    component: () => import('@/pages/UserSearch.vue'),
  },
  {
    path: '/creation',
    component: () => import('@/pages/Creation.vue'),
  },
  {
    path: '/creation-confirm',
    component: () => import('@/pages/CreationConfirm.vue'),
  },
  {
    path: '*',
    component: () => import('@/components/NotFoundPage.vue'),
  },
]

export default routes
