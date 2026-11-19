// AI-GENERATED — not an architecture reference

import m, { type ComponentTypes, type RouteDefs, type RouteResolver } from 'mithril'
import { Layout } from '@/components/Layout'
import { CONFIG } from '@/config'
import { supportIsTheirs } from '@/data/Moderator.logic'
import type { Moderator } from '@/data/Moderator.schema'
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

const forAdministrators = (moderator: Moderator) => moderator.role === 'ADMIN'

/**
 * A page only for a signed-in moderator, and only where `mayOpen` says yes of them: an
 * administrator's page, or the support (K6, supportIsTheirs). The menu hides what they may not
 * open, this enforces it. The backend's rights stay the final word.
 */
const protectedPage = (
  component: ComponentTypes,
  mayOpen: (moderator: Moderator) => boolean = () => true,
): RouteResolver => ({
  onmatch: () => {
    const moderator = adminStore.moderator
    if (
      !CONFIG.DEBUG_DISABLE_AUTH &&
      (!adminStore.token || !moderator?.role || !mayOpen(moderator))
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
  '/support': protectedPage(Support, supportIsTheirs),
  '/contribution-links': protectedPage(ContributionLinks),
  '/federation': protectedPage(FederationVisualize, forAdministrators),
  '/projectBranding': protectedPage(ProjectBranding, forAdministrators),
  '/creaSettings': protectedPage(CreaSettings, forAdministrators),
  '/chat': protectedPage(ChatSettings, forAdministrators),
  '/creation-groups': protectedPage(CreationGroups, forAdministrators),
  // The page answered to /group-tags until the rename; old bookmarks still lead there.
  '/group-tags': { onmatch: () => m.route.set('/creation-groups', undefined, { replace: true }) },
  '/:404...': notFound,
}
