// AI-GENERATED — not an architecture reference
import { inject, provide, ref } from 'vue'
import { CONTACTS_FETCH_MAX } from '@/constants'
import { contactListQuery } from '@/graphql/contacts.graphql'
import { chatGroupsQuery } from '@/graphql/chatGroups.graphql'

/**
 * Where a message can be forwarded to (E-059): the member's contacts and their groups.
 *
 * A conversation's window stands in many places -- the contacts page, the column and the strip
 * beside every page, the booking lists, the tile on the overview --, and forwarding belongs to the
 * window, not to the page under it (Bernd, 01.10.2026: outside the contacts page "Weiterleiten" did
 * nothing, because only that page listened). So the dialog finds its lists by itself:
 * - the contacts page holds both lists and hands them down (`provideChatForwardTargets`) -- they
 *   are on screen there, and stay in step with it;
 * - anywhere else the dialog asks the server when it opens (`load`), the whole contact list in one
 *   answer as the contacts page does, and the groups.
 */
const CHAT_FORWARD_TARGETS = Symbol('chatForwardTargets')

/**
 * The page that holds both lists hands them to every forward dialog under it -- and what it knows
 * about them: whether they are still on their way, and whether one could not be read.
 *
 * @param {{
 *   contacts: import('vue').Ref<object[]>,
 *   groups: import('vue').Ref<object[]>,
 *   loading?: import('vue').Ref<boolean>,
 *   contactsFailed?: import('vue').Ref<boolean>,
 *   groupsFailed?: import('vue').Ref<boolean>,
 * }} lists
 */
export const provideChatForwardTargets = (lists) => provide(CHAT_FORWARD_TARGETS, lists)

/**
 * The two lists for one dialog. `load` asks for them where no page handed them down -- at every
 * opening, so somebody met or a group joined a minute ago is there; it does nothing where a page
 * did. `loading` while the first answer is on its way; `contactsFailed` / `groupsFailed` where a
 * list could not be read -- a failed request is not an empty list.
 *
 * ⛔ `no-cache`, as the column's own request for contacts (useContactsPanel): nothing reads these
 * answers out of the store, and the rows carry no id to normalise on.
 */
export const useChatForwardTargets = (apolloClient) => {
  const given = inject(CHAT_FORWARD_TARGETS, null)
  const contacts = given?.contacts ?? ref([])
  const groups = given?.groups ?? ref([])
  const loading = given?.loading ?? ref(false)
  const contactsFailed = given?.contactsFailed ?? ref(false)
  const groupsFailed = given?.groupsFailed ?? ref(false)

  // Only the newest question counts: the dialog can be closed and opened again while one is out.
  let asked = 0
  const ask = (options) =>
    apolloClient.query({ ...options, fetchPolicy: 'no-cache' }).then(
      ({ data }) => data,
      () => null,
    )

  const load = async () => {
    if (given) return
    const mine = ++asked
    loading.value = true
    const [list, groupList] = await Promise.all([
      ask({
        query: contactListQuery,
        variables: { currentPage: 1, pageSize: CONTACTS_FETCH_MAX },
      }),
      ask({ query: chatGroupsQuery }),
    ])
    if (mine !== asked) return
    contactsFailed.value = !list?.contactList
    groupsFailed.value = !groupList?.chatGroups
    // A list that could not be read again stays as it was: the last one known is better than none.
    if (list?.contactList) contacts.value = list.contactList.contacts
    if (groupList?.chatGroups) groups.value = groupList.chatGroups
    loading.value = false
  }

  return { contacts, groups, loading, contactsFailed, groupsFailed, load }
}
