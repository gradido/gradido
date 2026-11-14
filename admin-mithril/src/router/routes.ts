// AI-GENERATED — not an architecture reference
import { CONFIG } from '@admin/config'
import m, { type ComponentTypes, type RouteDefs, type RouteResolver } from 'mithril'
import { Layout } from '@/components/Layout'
import { ChatSettings } from '@/pages/ChatSettings'
import { ContributionLinks } from '@/pages/ContributionLinks'
import { CreaSettings } from '@/pages/CreaSettings'
import { CreationConfirm } from '@/pages/CreationConfirm'
import { CreationGroups } from '@/pages/CreationGroups'
import { Dashboard } from '@/pages/Dashboard'
import { FederationVisualize } from '@/pages/FederationVisualize'
import { NotFound } from '@/pages/NotFound'
import { ProjectBranding } from '@/pages/ProjectBranding'
import { Statistic } from '@/pages/Statistic'
import { Support } from '@/pages/Support'
import { UserSearch } from '@/pages/UserSearch'
import { adminStore } from '@/store/admin.store'
import { authenticate } from './authenticate'

/**
 * A page only for a signed-in moderator, and with `requiresAdmin` only for an administrator; the
 * menu hides what they may not open, this enforces it. The backend's rights stay the final word.
 */
const protectedPage = (component: ComponentTypes, requiresAdmin = false): RouteResolver => ({
  onmatch: () => {
    const role = adminStore.moderator?.role
    if (
      !CONFIG.DEBUG_DISABLE_AUTH &&
      (!adminStore.token || !role || (requiresAdmin && role !== 'ADMIN'))
    ) {
      m.route.set('/not-found', undefined, { replace: true })
      return
    }
    return component
  },
  render: (vnode) => m(Layout, vnode),
})

// in the menu while somebody is signed in, on its own otherwise
const notFound: RouteResolver = {
  render: () => (adminStore.token ? m(Layout, m(NotFound)) : m(NotFound)),
}

export const routes: RouteDefs = {
  // no page of its own: signs in and moves on
  '/authenticate': { onmatch: (args) => authenticate(args, Object.keys(routes)) },
  '/': protectedPage(Dashboard),
  // the old admin's own "not found", as it had it
  '/logout': notFound,
  '/user': protectedPage(UserSearch),
  '/statistic': protectedPage(Statistic),
  '/creation-confirm': protectedPage(CreationConfirm),
  '/support': protectedPage(Support),
  '/contribution-links': protectedPage(ContributionLinks),
  '/federation': protectedPage(FederationVisualize, true),
  '/projectBranding': protectedPage(ProjectBranding, true),
  '/creaSettings': protectedPage(CreaSettings, true),
  '/chat': protectedPage(ChatSettings, true),
  '/creation-groups': protectedPage(CreationGroups, true),
  // The page answered to /group-tags until the rename; old bookmarks still lead there.
  '/group-tags': { onmatch: () => m.route.set('/creation-groups', undefined, { replace: true }) },
  '/:404...': notFound,
}
