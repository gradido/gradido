const routes = [
  {
    path: '/authenticate',
  },
  {
    path: '/',
    component: () => import('@/pages/Overview.vue'),
  },
  {
    path: '/statistic',
    component: () => import('@/pages/CommunityStatistic.vue'),
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
    path: '/creation-confirm',
    component: () => import('@/pages/CreationConfirm.vue'),
  },
  {
    path: '/contribution-links',
    component: () => import('@/pages/ContributionLinks.vue'),
  },
  {
    path: '/federation',
    component: () => import('@/pages/FederationVisualize.vue'),
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('@/components/NotFoundPage.vue'),
  },
]

export default routes
