// AI-GENERATED — not an architecture reference

import { watch } from 'vue'
import { chatUnreadConversations } from '@/composables/useChatUpdates'
import { contributionsInProgress } from '@/composables/useContributionsInProgress'
import {
  moderationCreationsWaiting,
  moderationSupportTicketsWaiting,
} from '@/composables/useModerationWaiting'
import { supportTicketsInProgress } from '@/composables/useSupportTicketsMenu'
import { showAppBadge } from '@/utils/appBadge'

/**
 * The number on the app's icon (utils/appBadge): the numbers of the menu added up -- the
 * conversations with something unread (Chat), the own requests and contributions with a question
 * back (Support, Schöpfen), and for whoever moderates the creations and requests waiting in the
 * own groups (the two numbers at "Admin"). All of them come with the chat's beat
 * (useChatUpdates); nothing here asks the server.
 *
 * Counted as the menu shows them: "Schöpfen" not for a project account (Navbar, Sidebar), "Admin"
 * only while the member has a role (Sidebar) -- its numbers stay as they were when the server stops
 * answering them.
 */
export const appBadgeCount = (store) =>
  chatUnreadConversations.value +
  supportTicketsInProgress.value +
  (store.creationAllowed !== false ? contributionsInProgress.value : 0) +
  (store.role ? moderationCreationsWaiting.value + moderationSupportTicketsWaiting.value : 0)

/**
 * Keeps the number on the icon in step with the menu while the signed-in wallet stands
 * (DashboardLayout). When it goes, the stop of the beat takes the number off (useChatUpdates).
 */
export const useAppBadge = (store) => {
  watch(() => appBadgeCount(store), showAppBadge, { immediate: true })
}
