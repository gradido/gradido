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
             reachable: `«` first, `»` last.

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
          class="mt-3 contacts-pager"
          pills
          size="lg"
          :no-ellipsis="true"
          :limit="3"
          :per-page="PAGE_SIZE"
          :total-rows="otherRows.length"
          align="center"
          data-test="contacts-pagination"
        />
      </section>
    </template>

    <!-- One window for the page, not one per row (KF-010). -->
    <contact-window v-model="windowOpen" :contact="selected" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { BFormInput, BPagination, BSpinner } from 'bootstrap-vue-next'
import ContactRow from '@/components/Contacts/ContactRow.vue'
import ContactsEmpty from '@/components/Contacts/ContactsEmpty.vue'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import { useContactWindow } from '@/composables/useContactWindow'
import { onContactListRefresh } from '@/composables/useContactsPanel'
import { contactListQuery } from '@/graphql/contacts.graphql'
import { ensureFavorites, isFavorite } from '@/composables/useFavorites'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { PAGE_SIZE } from '@/constants'
import { memberKey } from '@/utils/gradidoAddress'

/**
 * The whole list in one answer, then favourites, search and pages on this device.
 *
 * The server pages and searches too -- but the favourites are to stand ABOVE the rest,
 * all of them, and the rest is to be searched as one types; both are one array operation
 * once the list is here, and a round trip each otherwise. The list is small: a few dozen
 * people for most members, some hundred for the busiest account measured (713).
 *
 * ⚠️ Past the cap below the list is cut, and nothing on this page says so: the number
 * under "all contacts" counts what arrived, and the server's own `count` is not read
 * here. The day an account passes a thousand counterparties, this page moves to the
 * server-side pages, which exist for the compact panel of delivery 2 -- it is not a
 * matter of one more constant.
 */
const CONTACTS_FETCH_MAX = 1000

const { toastError } = useAppToast()
const { client: apolloClient } = useApolloClient()

// The hearts, in case the layout's request at mount did not land (ensureFavorites is a
// no-op once they are here).
ensureFavorites(apolloClient)

const contacts = ref([])
const loaded = ref(false)
const failed = ref(false)
const search = ref('')
const currentPage = ref(1)

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
  } catch {
    // The list as it was.
  }
}
onBeforeUnmount(onContactListRefresh(reloadList))

const rowKey = (contact) => memberKey(contact.user)

// A tap on a row opens the contact window; the ways on from there live inside it (KF-010). The
// state machine is shared with the column and the phone strip, so the release-on-close rule is
// written once.
const { windowOpen, selected, open, openKnownMember } = useContactWindow(apolloClient)

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
if (askedFor !== undefined || askedCommunity !== undefined) {
  const { with: _with, community: _community, ...rest } = route.query
  router.replace({ query: rest })
}
if (typeof askedFor === 'string' && askedFor !== '') {
  openKnownMember({
    gradidoID: askedFor,
    communityUuid:
      typeof askedCommunity === 'string' && askedCommunity !== '' ? askedCommunity : null,
  })
}

const needle = computed(() => search.value.trim().toLowerCase())
const matches = (contact) =>
  !needle.value ||
  `${contact.user.alias ?? ''} ${contact.user.gradidoID}`.toLowerCase().includes(needle.value)

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

/* The guard behind the number above, and it stays even though `limit` now makes the pager
   fit: `.pagination` is a flex row that Bootstrap leaves at `nowrap`, so anything wider than
   the page does not wrap -- it spills out of it. On a phone the column is narrower than any
   pager can be, so there it WILL take a second line, and that is the right way to give way.
   What it must not do is hang out of the page. */
.contacts-pager {
  flex-wrap: wrap;
}
</style>
