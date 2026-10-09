// AI-GENERATED — not an architecture reference

import { ref, watch } from 'vue'
import { contactByMemberQuery } from '@/graphql/contacts.graphql'

/**
 * The server's contact row for this member, or null where they are no contact of the one signed
 * in. Throws where the question did not get through: who asks decides what that means -- the
 * window reads it as "nothing to fill in" (below), the first word from the map as "not known
 * yet" (useChatHello).
 *
 * ⛔ `no-cache`, for the reason useContactsPanel measures at the same query: a contact row
 * carries no id to normalise on, so `network-only` would leave one copy per pair in the store
 * until logout, and nothing ever reads them back.
 */
export const lookUpContactRow = async (apolloClient, member) => {
  const { data } = await apolloClient.query({
    query: contactByMemberQuery,
    variables: {
      ref: { gradidoID: member.gradidoID, communityUuid: member.communityUuid ?? null },
    },
    fetchPolicy: 'no-cache',
  })
  return data?.contactList?.contacts?.[0] ?? null
}

/**
 * The contact window's state, for a list that opens one (KF-010).
 *
 * ⛔ One copy, because there are five lists now. The column, the phone strip and the
 * contacts page each held their own `windowOpen` / `selected` / `open` / release-on-close,
 * byte for byte, and each carried its own comment explaining the non-obvious half -- so the
 * rule was documented three times and enforced nowhere.
 *
 * ⛔ The contact is let go when the window closes. The window is `lazy`, so a closed one
 * renders nothing, but holding the contact would keep a portrait and a person alive for the
 * life of the page -- and a person who may no longer be in the list at all after a search
 * or a refresh.
 *
 * @param apolloClient only for `openMember` and `openKnownMember`; a list that hands whole
 *   contacts needs none.
 */
export const useContactWindow = (apolloClient = null) => {
  const windowOpen = ref(false)
  const selected = ref(null)

  /**
   * Which opening the window is currently showing.
   *
   * Nothing but `openMember` reads it: an answer that arrives after the member has moved on
   * -- closed the window, or opened somebody else's -- belongs to an opening that is over,
   * and writing it into `selected` would put one person's figures under another's name.
   */
  let opening = 0

  /**
   * How the window was opened from a group (Bernd, 30.09.2026, E-055) -- a first word to a member
   * of the group should be one tap on the arrow:
   * - `greet`: "Hallo …" stands in the field while there is no conversation yet, contact or not;
   * - `firstContact`: for somebody who is no contact yet, only the text -- no Gradido, no camera,
   *   no bell, no heart, no paperclip -- until the first message makes them one (`fillIn`).
   * Both belong to the opening: the next one sets them anew, closing lets them go.
   */
  const greet = ref(false)
  const firstContact = ref(false)

  const open = (contact, { fromGroup = false, known = true } = {}) => {
    opening += 1
    selected.value = contact
    greet.value = fromGroup
    firstContact.value = fromGroup && !known
    windowOpen.value = true
    return opening
  }

  /**
   * The same window from a booking row, which carries a MEMBER and not a contact.
   *
   * ★ It opens at once, on what the row already has -- face, name, community, both buttons
   * and the heart are all there -- and the three figures follow when the server answers.
   * The other way round, waiting for the round trip before anything appeared, is a tap that
   * does nothing for as long as the network takes; on a phone that reads as a broken
   * button, and the member taps again.
   *
   * ⚠️ Nothing is torn down when the answer fails to come. The window stays exactly as it
   * opened and every control in it works -- only the meta line stays away, which
   * `ContactWindow` is written for. A toast over a missing grey line would be louder than
   * what it reports.
   */
  /**
   * The server's contact row for this member, or null -- where they are no contact of the one
   * signed in, and where the question did not get through.
   */
  const lookUpContact = async (member) => {
    try {
      return await lookUpContactRow(apolloClient, member)
    } catch {
      return null
    }
  }

  const openMember = async (member) => {
    if (!member?.gradidoID) return
    // What the row knows, standing in until the lookup lands. Not a partial contact by
    // accident: `ContactWindow` shows the meta line only where the figures are.
    const mine = open({ user: member })
    if (!apolloClient) return

    // A failed lookup leaves the window as it opened -- see above.
    const contact = await lookUpContact(member)

    // ⛔ `selected` directly, NOT `open`: filling in what was asked for is not a new
    // opening, and going through `open` would bump the counter this guard reads and make
    // every answer look current. And only while this opening is still the one on screen.
    if (opening !== mine || !windowOpen.value || !contact) return
    selected.value = contact
  }

  /**
   * The same window for somebody named from OUTSIDE the lists -- an address like
   * `/contacts?with=<gradidoID>` (the mail's reply button, P4c).
   *
   * ⛔ Asked FIRST, opened only when the server knows the person as a contact. Unlike a booking
   * row there is nothing on screen that names them -- no face, no name -- so there is nothing
   * to open on while the lookup runs; and a person the server does not know as a contact (an
   * unknown id, somebody one never exchanged anything with) is nobody to open a window for.
   * Nothing is said either: the page stands as it would without the address.
   *
   * And not over something the member opened in the meantime: a tap on a row while the lookup
   * was on its way wins.
   */
  const openKnownMember = async (member) => {
    if (!member?.gradidoID || !apolloClient) return
    const before = opening
    const contact = await lookUpContact(member)
    if (!contact || opening !== before) return
    open(contact)
  }

  /**
   * The server's contact row in place of what the window was opened on -- once the first message
   * to a member of a group made them a contact (E-055): the meta line, and all of the window.
   *
   * ⛔ `selected` directly, as in `openMember`, and only while the same opening is on screen. A
   * failed lookup leaves the window as it stands: the conversation is there either way, and the
   * list asks again with the next news.
   */
  const fillIn = async () => {
    const member = selected.value?.user
    if (!member?.gradidoID || !apolloClient) return
    const mine = opening
    const contact = await lookUpContact(member)
    if (opening !== mine || !windowOpen.value || !contact) return
    selected.value = contact
    firstContact.value = false
  }

  watch(windowOpen, (isOpen) => {
    if (!isOpen) {
      selected.value = null
      greet.value = false
      firstContact.value = false
    }
  })

  return {
    windowOpen,
    selected,
    greet,
    firstContact,
    open,
    openMember,
    openKnownMember,
    fillIn,
  }
}
