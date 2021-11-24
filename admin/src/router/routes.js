const routes = [
  {
    path: '/authenticate',
  },
  {
    path: '/',
    component: () => import('@/pages/Overview.vue'),
  },
  {
    // TODO: Implement a "You are logged out"-Page
    path: '/logout',
    component: () => import('@/components/NotFoundPage.vue'),
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
