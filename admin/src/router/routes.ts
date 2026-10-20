// AI-GENERATED — not an architecture reference
import type { RouteRecordRaw } from 'vue-router'

export const routes = [
  {
    // no page of its own: the first guard (guards.ts) takes the token and moves on
    path: '/authenticate',
  } as RouteRecordRaw,
  {
    path: '/',
    component: () => import('@/pages/Overview').then((m) => m.Overview),
  },
  {
    // TODO: Implement a "You are logged out"-Page
    path: '/logout',
    component: () => import('@/components/NotFoundPage').then((m) => m.NotFoundPage),
  },
  {
    path: '/user',
    name: 'user',
    component: () => import('@/pages/UserSearch').then((m) => m.UserSearch),
  },
  {
    path: '/creation-confirm',
    name: 'creation-confirm',
    component: () => import('@/pages/CreationConfirm').then((m) => m.CreationConfirm),
  },
  {
    path: '/contribution-links',
    name: 'contribution-links',
    component: () => import('@/pages/ContributionLinks').then((m) => m.ContributionLinks),
  },
  {
    path: '/federation',
    name: 'federation',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/FederationVisualize').then((m) => m.FederationVisualize),
  },
  {
    path: '/projectBranding',
    name: 'projectBranding',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/ProjectBranding').then((m) => m.ProjectBranding),
  },
  {
    path: '/creaSettings',
    name: 'creaSettings',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/CreaSettings').then((m) => m.CreaSettings),
  },
  {
    path: '/chat',
    name: 'chat',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/ChatSettings').then((m) => m.ChatSettings),
  },
  {
    path: '/creation-groups',
    name: 'creation-groups',
    meta: { requiresAdmin: true },
    component: () => import('@/pages/CreationGroups').then((m) => m.CreationGroups),
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
    component: () => import('@/components/NotFoundPage').then((m) => m.NotFoundPage),
  },
] satisfies RouteRecordRaw[]
