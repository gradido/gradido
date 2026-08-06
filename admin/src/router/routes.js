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
    path: '/module',
    name: 'module',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/ModuleSettings.vue'),
  },
  // The Crea settings had this page to themselves until the module switches joined them.
  // Same reason as /group-tags below: a bookmark or an older note must not land on
  // "not found" just because the page grew a wider job.
  {
    path: '/creaSettings',
    redirect: '/module',
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
