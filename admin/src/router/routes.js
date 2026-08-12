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
    name: 'statistic',
    component: () => import('@/pages/CommunityStatistic.vue'),
  },
  {
    // TODO: Implement a "You are logged out"-Page
    path: '/logout',
    component: () => import('@/components/NotFoundPage.vue'),
  },
  {
    path: '/user',
    name: 'user',
    component: () => import('@/pages/UserSearch.vue'),
  },
  {
    path: '/creation-confirm',
    name: 'creation-confirm',
    component: () => import('@/pages/CreationConfirm.vue'),
  },
  {
    path: '/contribution-links',
    name: 'contribution-links',
    component: () => import('@/pages/ContributionLinks.vue'),
  },
  {
    path: '/federation',
    name: 'federation',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/FederationVisualize.vue'),
  },
  {
    path: '/projectBranding',
    name: 'projectBranding',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/ProjectBranding.vue'),
  },
  {
    path: '/creaSettings',
    name: 'creaSettings',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/CreaSettings.vue'),
  },
  {
    path: '/creation-groups',
    name: 'creation-groups',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/CreationGroups.vue'),
  },
  // The page answered to /group-tags until the rename. Without this, an administrator's
  // bookmark -- or a link in a team note or an older handover -- falls through to the
  // catch-all and lands on "not found" instead of the page it always meant.
  {
    path: '/group-tags',
    redirect: '/creation-groups',
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('@/components/NotFoundPage.vue'),
  },
]

export default routes
