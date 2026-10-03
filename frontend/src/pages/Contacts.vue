<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="contacts">
    <BFormInput
      v-model="search"
      type="search"
      :placeholder="$t('contacts.search')"
      class="mb-3"
      data-test="contacts-search"
    />

    <!-- The member's chat groups (P5), in a section of their own above the favourites (E-050
         F1a) -- as soon as they are in, whether or not the contacts are, and with "Neue Gruppe"
         also while there is none. A search narrows them by their name, and where it leaves none
         the section steps aside for the contacts it found. -->
    <section
      v-if="groupsShown"
      class="mb-4"
      aria-labelledby="contacts-groups-heading"
      data-test="contacts-groups"
    >
      <div class="contacts-groups-head page-text mb-2">
        <h2 id="contacts-groups-heading" class="h6 text-uppercase text-muted mb-0">
          {{ $t('chatGroup.heading') }}
          <span v-if="groupRows.length" class="fw-normal ms-2" data-test="contacts-groups-count">
            {{ $t('chatGroup.count', groupRows.length) }}
          </span>
        </h2>
        <button
          type="button"
          class="contacts-groups-new"
          data-test="contacts-groups-new"
          @click="createOpen = true"
        >
          <i-mdi-plus aria-hidden="true" />
          {{ $t('chatGroup.new') }}
        </button>
      </div>
      <div
        v-if="groupRows.length"
        class="bg-white gradido-border-radius app-box-shadow px-3"
        data-test="contacts-groups-list"
      >
        <chat-group-row
          v-for="group in groupRows"
          :key="group.groupUuid"
          :group="group"
          @open="openGroup"
        />
      </div>
      <!-- A failed request is not an empty list, here as for the contacts. -->
      <div v-else-if="groupsFailed" class="text-muted small page-text" data-test="groups-error">
        {{ $t('chatGroup.notReachable') }}
      </div>
      <div v-else class="text-muted small page-text" data-test="groups-none">
        {{ $t('chatGroup.none') }}
      </div>
    </section>

    <div v-if="!loaded" class="text-center py-3" data-test="contacts-loading">
      <BSpinner small />
    </div>

    <!-- A failed request is not an empty list: "no contacts yet" would tell a member with
         a hundred of them that they have none. -->
    <div v-else-if="failed" class="text-muted page-text" data-test="contacts-error">
      {{ $t('contacts.notReachable') }}
    </div>

    <!-- ⚠️ The same sentence stands here for an unmatched SEARCH, which it has always done
         and which is a defect of its own. The link is kept out of that case rather than
         made part of it: "show it to your friends" is no answer to "nobody called that". -->
    <div v-else-if="contacts.length === 0" class="text-muted page-text" data-test="contacts-empty">
      <contacts-empty :with-link="!search.trim()" />
    </div>

    <template v-else>
      <!-- Favourites first (L §8.14), all of them, whatever page the rest is on. -->
      <section v-if="favoriteRows.length" class="mb-4" data-test="contacts-favorites">
        <h2 class="h6 text-uppercase text-muted mb-2 page-text">{{ $t('contacts.favorites') }}</h2>
        <div class="bg-white gradido-border-radius app-box-shadow px-3">
          <contact-row
            v-for="contact in favoriteRows"
            :key="rowKey(contact)"
            :contact="contact"
            @open="open"
          />
        </div>
      </section>

      <section data-test="contacts-all">
        <h2 class="h6 text-uppercase text-muted mb-2 page-text">
          {{ $t('contacts.all') }}
          <span class="fw-normal ms-2" data-test="contacts-count">
            {{ $t('contacts.count', otherRows.length) }}
          </span>
        </h2>
        <div
          v-if="pageRows.length"
          class="bg-white gradido-border-radius app-box-shadow px-3"
          data-test="contacts-page"
        >
          <contact-row
            v-for="contact in pageRows"
            :key="rowKey(contact)"
            :contact="contact"
            @open="open"
          />
        </div>
        <div v-else class="text-muted small page-text" data-test="contacts-none-match">
          {{ $t('contacts.count', 0) }}
        </div>
        <!-- ⛔ `no-ellipsis` does NOT make this pager narrower, and an earlier note here
             claimed it did. Measured properly on the real component, at 290 rows and 25 a
             page: with the "..." it is 549 points, without them 540. The component does not
             drop the two placeholders, it REPLACES them with two more page numbers --
             `« ‹ … 2 3 4 … › »` becomes `« ‹ 1 2 3 4 5 › »`. So the reason to pass it is
             not width but worth: two dead placeholders become two buttons one can actually
             press. (Bernd, 04.09.2026: the dots had been irritating him for a while.)

             ⛔ What makes it fit is `limit`, and that is the line the single row depends on:
             three page numbers rather than five, `« ‹ 2 3 4 › »`, 421 points against this
             page's 450. At `limit="4"` it is 479 and wraps again, so this is not a spare
             margin -- do not raise it without measuring. The arrows keep every page
             reachable: `«` first, `»` last. On a phone the ends go, as on every pager in
             this wallet (`usePagerFit`): `‹ 2 3 4 ›` is one line where the seven took two.
             And `flex-wrap`, as on every pager: what is still wider than the page takes a
             second line instead of hanging out of it.

             ⛔⛔ It is `no-ellipsis`, NOT `hide-ellipsis`. `hide-ellipsis` is BootstrapVue's
             Vue-2 name and does not exist in bootstrap-vue-next: the string does not occur
             once in the installed 0.26.8 bundle, and passing it renders both "..." exactly
             as passing nothing does. Three other pagers in this wallet carried it, all
             inert; they were corrected in the same delivery. There is a test at the foot of
             `Contacts.spec.js` that reads every `.vue` file and fails on the dead name, so
             the next copy of it cannot get in. (coderabbit found the first one, 04.09.2026.) -->
        <BPagination
          v-if="otherRows.length > PAGE_SIZE"
          v-model="currentPage"
          class="mt-3 flex-wrap"
          pills
          size="lg"
          :no-ellipsis="true"
          :limit="pagerLimit"
          :no-goto-end-buttons="pagerNoEnds"
          :per-page="PAGE_SIZE"
          :total-rows="otherRows.length"
          align="center"
          data-test="contacts-pagination"
        />
      </section>
    </template>

    <!-- One window for the page, not one per row (KF-010). -->
    <contact-window
      v-model="windowOpen"
      :contact="selected"
      :greet="greet"
      :first-contact="firstContact"
      @contact-made="contactMade"
    />
    <!-- And one for a group (P5), the same way, and the dialog that opens one. -->
    <chat-group-window
      v-model="groupWindowOpen"
      :group="openedGroup"
      :contacts="contacts"
      @changed="reloadGroups"
      @open-member="openGroupMember"
    />
    <chat-group-create v-model="createOpen" :contacts="contacts" @created="groupCreated" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { useStore } from 'vuex'
import { BFormInput, BPagination, BSpinner } from 'bootstrap-vue-next'
import ChatGroupCreate from '@/components/ChatGroups/ChatGroupCreate.vue'
import ChatGroupRow from '@/components/ChatGroups/ChatGroupRow.vue'
import ChatGroupWindow from '@/components/ChatGroups/ChatGroupWindow.vue'
import ContactRow from '@/components/Contacts/ContactRow.vue'
import ContactsEmpty from '@/components/Contacts/ContactsEmpty.vue'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import { useContactWindow } from '@/composables/useContactWindow'
import { setFirstLoginWindowWanted } from '@/composables/useFirstLoginWindow'
import { usePagerFit } from '@/composables/usePagerFit'
import { provideChatForwardTargets } from '@/composables/useChatForwardTargets'
import { onContactListRefresh } from '@/composables/useContactsPanel'
import { contactListQuery } from '@/graphql/contacts.graphql'
import { chatGroupsQuery } from '@/graphql/chatGroups.graphql'
import { ensureFavorites, isFavorite } from '@/composables/useFavorites'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { CONTACTS_FETCH_MAX, PAGE_SIZE } from '@/constants'
import { chatMemberKey } from '@/utils/chatMemberKey'
import { memberKey } from '@/utils/gradidoAddress'

const { toastError } = useAppToast()
// Three numbers at the desk too: this page is 450px wide on every screen (see its style).
const { pagerLimit, pagerNoEnds } = usePagerFit(3)
const { client: apolloClient } = useApolloClient()

// The hearts, in case the layout's request at mount did not land (ensureFavorites is a
// no-op once they are here).
ensureFavorites(apolloClient)

const contacts = ref([])
const loaded = ref(false)
const failed = ref(false)
const search = ref('')
const currentPage = ref(1)

/**
 * The whole list in one answer, then favourites, search and pages on this device.
 *
 * The server pages and searches too -- but the favourites are to stand ABOVE the rest,
 * all of them, and the rest is to be searched as one types; both are one array operation
 * once the list is here, and a round trip each otherwise. The list is small: a few dozen
 * people for most members, some hundred for the busiest account measured (713).
 *
 * ⚠️ Past the cap (`CONTACTS_FETCH_MAX`) the list is cut, and nothing on this page says so: the number
 * under "all contacts" counts what arrived, and the server's own `count` is not read
 * here. The day an account passes a thousand counterparties, this page moves to the
 * server-side pages, which exist for the compact panel of delivery 2 -- it is not a
 * matter of one more constant. The cap stands in `constants`: the dialog that forwards a message
 * asks for the same list where this page is not open.
 */
const LIST_VARIABLES = { currentPage: 1, pageSize: CONTACTS_FETCH_MAX }

const { onResult, onError } = useQuery(
  contactListQuery,
  LIST_VARIABLES,
  // `network-only`, as the booking list: a cached copy would replay last visit's dates
  // for the pictures before the fresh list arrives, and the avatar store takes the newest
  // list it is shown as the truth about who withdrew a picture.
  { fetchPolicy: 'network-only' },
)
onResult(({ data }) => {
  if (!data?.contactList) return
  contacts.value = data.contactList.contacts
  loaded.value = true
  failed.value = false
})
onError((error) => {
  loaded.value = true
  failed.value = true
  toastError(error.message)
})

/**
 * The member's chat groups (P5), asked with the list. `network-only` for the reason the list
 * gives, and one more: the query takes no variables, so it has one cache key for whoever signs
 * in -- the cache is emptied at logout, and every opening of the page asks the server anyway.
 *
 * ⚠️ No toast where it fails: the contacts' request says so already when the server cannot be
 * reached, and a second toast for the same failure says nothing new. The section says it in its
 * own line instead, only while there is no list to show.
 */
const groups = ref([])
const groupsLoaded = ref(false)
const groupsFailed = ref(false)

const { onResult: onGroups, onError: onGroupsError } = useQuery(chatGroupsQuery, null, {
  fetchPolicy: 'network-only',
})
onGroups(({ data }) => {
  if (!data?.chatGroups) return
  groups.value = data.chatGroups
  groupsLoaded.value = true
  groupsFailed.value = false
  openAskedGroup()
})
onGroupsError(() => {
  groupsLoaded.value = true
  groupsFailed.value = groups.value.length === 0
  groupAsked = null
})

/**
 * The group's window (P5): which group is open, by its uuid, and the newest the list has of it --
 * so a name, a part or a mute mark that changed shows in the open window once the list is asked
 * again. Let go when the window closes, as the contact window lets its contact go.
 */
const groupWindowOpen = ref(false)
const openedGroupUuid = ref(null)
const openedGroup = computed(
  () => groups.value.find((group) => group.groupUuid === openedGroupUuid.value) ?? null,
)
const openGroup = (group) => {
  openedGroupUuid.value = group.groupUuid
  groupWindowOpen.value = true
}
watch(groupWindowOpen, (isOpen) => {
  if (!isOpen) openedGroupUuid.value = null
})
// A group the list no longer holds -- the member left it, or was taken out -- closes its window
// rather than leave it open around nothing.
watch(openedGroup, (group) => {
  if (!group && groupWindowOpen.value) groupWindowOpen.value = false
})

/**
 * A member named in a group -- in its list of members, or over their message (E-053) -- and a
 * first word to them in one tap (Bernd, 30.09.2026, E-055). Their contact window opens OVER the
 * group's: closing it leads back into the group.
 * - A contact: the window as always; where the two have never written, "Hallo …" stands in the
 *   field.
 * - Nobody's contact yet: the window in its first form -- only the text, "Hallo …" in the field.
 *   The first message goes by mail as every first one does (E-024) and makes them a contact; the
 *   window then becomes the whole one (`contactMade`). No send form any more.
 *
 * Who is a contact is this page's list, by the pair without regard to case -- the group's members
 * are all of this community in P5 (E-026), and a missing community is this one. Whether a person
 * who is no contact yet belongs to it is the pair's to say too, for the address line; the server's
 * answer (`homeCommunity`) takes its place with the contact row.
 */
const store = useStore()
const openGroupMember = (user) => {
  if (!user?.gradidoID) return
  const home = store.state.communityUuid
  const key = chatMemberKey(user, home)
  const contact = contacts.value.find((held) => chatMemberKey(held.user, home) === key)
  if (contact) {
    open(contact, { fromGroup: true })
    return
  }
  const communityUuid = user.communityUuid ?? home
  if (!communityUuid) return
  const homeCommunity = Boolean(home) && communityUuid.toLowerCase() === home.toLowerCase()
  open({ user: { ...user, communityUuid }, homeCommunity }, { fromGroup: true, known: false })
}

/**
 * The first message to a member of a group made them a contact (E-055): the window takes the
 * server's row -- the meta line, and all its ways --, and the list asks again, so that they stand
 * in it.
 */
const contactMade = () => {
  fillIn()
  reloadList()
}

/**
 * "Neue Gruppe" (P5): the dialog, and what follows a group opened in it -- it stands in the list at
 * once, its window opens, and the list is asked again for the server's order.
 */
const createOpen = ref(false)
const groupCreated = (group) => {
  groups.value = [group, ...groups.value.filter((held) => held.groupUuid !== group.groupUuid)]
  groupsLoaded.value = true
  openGroup(group)
  reloadGroups()
}

/**
 * The groups asked again, the way the list is (`reloadList` below): a message arrived or was
 * read, and the dot or the order of a group moved. Quiet, and only the newest answer counts.
 */
let groupReloads = 0
const reloadGroups = async () => {
  const mine = ++groupReloads
  try {
    const { data } = await apolloClient.query({
      query: chatGroupsQuery,
      fetchPolicy: 'network-only',
      context: { renewSession: false },
    })
    if (mine !== groupReloads || !data?.chatGroups) return
    groups.value = data.chatGroups
    groupsLoaded.value = true
    groupsFailed.value = false
  } catch {
    // The groups as they were.
  }
}

/**
 * The list asked again, because the right-hand column's is (useContactsPanel): a transfer went
 * through, or chat messages arrived (useChatUpdates). The server orders the contacts by the last
 * exchange, so somebody who just wrote comes to the top -- the wallet keeps no book of its own.
 *
 * ⛔ `renewSession: false`: nobody did anything on this page, and a list asked again must not
 * keep an unattended wallet signed in (plugins/apolloProvider.js). Said nothing on a failure:
 * the list on screen stays as it was, and the next news asks again.
 *
 * Only the newest answer counts: two of these can be on their way at once.
 */
let reloads = 0
const reloadList = async () => {
  const mine = ++reloads
  try {
    const { data } = await apolloClient.query({
      query: contactListQuery,
      variables: LIST_VARIABLES,
      fetchPolicy: 'network-only',
      context: { renewSession: false },
    })
    if (mine !== reloads || !data?.contactList) return
    contacts.value = data.contactList.contacts
    // What an answer of the page's own query says too: a list that failed at first, or had not
    // answered yet, stands once a question again succeeds (coderabbit, PR #3980).
    loaded.value = true
    failed.value = false
  } catch {
    // The list as it was.
  }
}
onBeforeUnmount(
  onContactListRefresh(() => {
    reloadList()
    reloadGroups()
  }),
)

const rowKey = (contact) => memberKey(contact.user)

// A tap on a row opens the contact window; the ways on from there live inside it (KF-010). The
// state machine is shared with the column and the phone strip, so the release-on-close rule is
// written once.
const { windowOpen, selected, greet, firstContact, open, openKnownMember, fillIn } =
  useContactWindow(apolloClient)

/**
 * Forwarding a message (E-059) is the windows' own business -- each holds the dialog that asks
 * where to, since a window is opened from many places besides this page. This page holds the two
 * lists the dialog chooses from, so it hands them down instead of letting the dialog ask again:
 * they are on screen here, and stay in step with it -- with what the page knows of them: still on
 * their way, or not to be read. Once a message went, the chat's beat asks at once and the lists
 * with it (`onContactListRefresh` above).
 */
provideChatForwardTargets({
  contacts,
  groups,
  loading: computed(() => !loaded.value || !groupsLoaded.value),
  contactsFailed: failed,
  groupsFailed,
})

/**
 * `/contacts?with=<gradidoID>[&community=<uuid>]` opens the conversation with that person -- the
 * address the mail's reply button will point to (P4c); nothing in the wallet links here yet. A
 * missing community is this one. Read once, when the page is built, and taken out of the
 * address at once, so a reload shows the list and does not open the window again.
 *
 * Opened only for somebody the server knows as a contact (useContactWindow.openKnownMember): an
 * unknown id, or somebody one never exchanged anything with, opens nothing and says nothing.
 * Only plain values: `?with=a&with=b` is no person.
 */
const route = useRoute()
const router = useRouter()
const askedFor = route.query.with
const askedCommunity = route.query.community
const askedGroup = route.query.group
if (askedFor !== undefined || askedCommunity !== undefined || askedGroup !== undefined) {
  const { with: _with, community: _community, group: _group, ...rest } = route.query
  router.replace({ query: rest })
}
if (typeof askedFor === 'string' && askedFor !== '') {
  // ⛔ Never two windows on top of each other. The conversation an address asks for comes before
  // the windows of the first logins (useFirstLoginWindow) -- somebody who has just accepted a
  // thank-you taps "… antworten" and meets the wallet for the first time right here. Said at
  // once, while the page is built: the lookup below takes a moment, and one of the three would
  // have the screen by then.
  setFirstLoginWindowWanted('contact', true)
  openKnownMember({
    gradidoID: askedFor,
    communityUuid:
      typeof askedCommunity === 'string' && askedCommunity !== '' ? askedCommunity : null,
  }).finally(() => {
    // Nobody the server knows as a contact, so no window: the three need not wait.
    if (!windowOpen.value) setFirstLoginWindowWanted('contact', false)
  })
}
// The three come in their order once the window is closed -- and when the page is left.
watch(windowOpen, (isOpen) => {
  if (!isOpen) setFirstLoginWindowWanted('contact', false)
})
onBeforeUnmount(() => setFirstLoginWindowWanted('contact', false))

/**
 * `/contacts?group=<uuid>` opens that group's window (P5) -- the address the group's mails point
 * to (E-049), also after the sign-in (the guard keeps the whole address as the way back), and the
 * one a start comes back to after iOS started the wallet over (utils/chatReturn). Read once, and
 * taken out of the address with the other two, above.
 *
 * Opened only for a group the member is in: it is looked for in the member's own list, once that
 * has answered. A group the member is not in -- or no longer, or that does not exist -- opens
 * nothing and says nothing, as `?with=` does for somebody who is no contact. Nor over something
 * the member opened in the meantime.
 */
let groupAsked =
  typeof askedGroup === 'string' && askedGroup !== '' ? askedGroup.toLowerCase() : null
const openAskedGroup = () => {
  const wanted = groupAsked
  groupAsked = null
  if (!wanted || groupWindowOpen.value || windowOpen.value) return
  const group = groups.value.find((held) => held.groupUuid.toLowerCase() === wanted)
  if (group) openGroup(group)
}

const needle = computed(() => search.value.trim().toLowerCase())
const matches = (contact) =>
  !needle.value ||
  `${contact.user.alias ?? ''} ${contact.user.gradidoID}`.toLowerCase().includes(needle.value)

// The groups the search leaves: a word narrows them by their name, as it narrows the contacts
// by theirs. The section stands while there is a group to show -- and, with no search, once the
// server has answered: with "Neue Gruppe", and a line that says there is none yet or that they
// could not be loaded.
const groupRows = computed(() =>
  groups.value.filter((group) => !needle.value || group.title.toLowerCase().includes(needle.value)),
)
const groupsShown = computed(
  () => groupRows.value.length > 0 || (groupsLoaded.value && !needle.value),
)

// Read through the composable, not the `favorite` flag the server sent: a heart given on
// this page has to move the person up at once, without a refetch.
const favoriteRows = computed(() =>
  contacts.value.filter((contact) => isFavorite(contact.user) && matches(contact)),
)
const otherRows = computed(() =>
  contacts.value.filter((contact) => !isFavorite(contact.user) && matches(contact)),
)
const pageRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return otherRows.value.slice(start, start + PAGE_SIZE)
})

// A new search starts on page one; a page beyond the end is no page.
watch(needle, () => {
  currentPage.value = 1
})
watch(otherRows, (rows) => {
  const last = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  if (currentPage.value > last) currentPage.value = last
})

// Faces for the rows on screen, the way the booking list asks for them. Only the visible
// ones: a member with hundreds of contacts must not pay for hundreds of pictures on page one.
//
// The page rows come FIRST: the store keeps a fixed number of faces and serves the list in
// the order it is given, so a member with more favourites than it can hold sees the people
// they are looking at, and initials further down.
watch(
  [favoriteRows, pageRows],
  ([favorites, page]) => {
    fetchMemberAvatars(
      apolloClient,
      [...page, ...favorites].map(({ user }) => user),
    )
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
/* ⛔ A contact row is a name and a heart, and nothing between them that grows. Given the
   whole content column it stretched to whatever the window allowed, and the heart ended up
   a hand's width from the person it belongs to -- the very complaint that does NOT arise on
   a phone, where the column is simply narrow. So the page keeps a phone's measure on a
   desktop too, rather than each row being taught to hold its heart closer. (Bernd,
   04.09.2026.)

   450 and not 390: it is a little wider than the widest common phone (430 points), so this
   page is never TIGHTER on a desktop than on the device it already works on -- and it is
   what the pager needs on one line once the page numbers reach two digits (442 points,
   measured). It sits on the page root, so the search box, the headings, the two boxes and
   the pager all share the one measure -- the search box above the list has to be the same
   width, or the narrowing reads as a mistake.

   Left, not centred: everything else on this page starts at the content column's left edge,
   and a block that alone floats to the middle looks misplaced rather than deliberate. */
.contacts {
  max-width: 450px;
}

/* The groups' heading with "Neue Gruppe" at the right end of its line (the mockup). */
.contacts-groups-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem 0.75rem;
}

/* A quiet outlined pill in the house's gold, as "+ Mitglieder hinzufügen" in the group's members;
   at least a finger's height. */
.contacts-groups-new {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 2.25rem;
  padding: 0.2rem 0.85rem;
  border: 1px solid var(--gold, #c58d38);
  border-radius: 1.2rem;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 0.85rem;
}

.contacts-groups-new:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}
</style>
