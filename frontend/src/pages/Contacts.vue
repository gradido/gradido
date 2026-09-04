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
    <div v-else-if="failed" class="text-muted" data-test="contacts-error">
      {{ $t('contacts.notReachable') }}
    </div>

    <div v-else-if="contacts.length === 0" class="text-muted" data-test="contacts-empty">
      {{ $t('contacts.empty') }}
    </div>

    <template v-else>
      <!-- Favourites first (L §8.14), all of them, whatever page the rest is on. -->
      <section v-if="favoriteRows.length" class="mb-4" data-test="contacts-favorites">
        <h2 class="h6 text-uppercase text-muted mb-2">{{ $t('contacts.favorites') }}</h2>
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
        <h2 class="h6 text-uppercase text-muted mb-2">
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
        <div v-else class="text-muted small" data-test="contacts-none-match">
          {{ $t('contacts.count', 0) }}
        </div>
        <!-- ⛔ `no-ellipsis`: the two "..." are two buttons wide and say nothing the arrows
             beside them do not. Measured in a browser against the built Bootstrap: with
             them this pager is 483 points wide and does not fit the page's measure at all
             -- and it did not fit a PHONE either, which is where it has always been
             narrowest. Without them it is 421, or 442 once the page numbers reach two
             digits, and the `flex-wrap` in the stylesheet below catches that remainder
             rather than a number I happened to measure.

             ⛔⛔ It is `no-ellipsis`, NOT `hide-ellipsis`. `hide-ellipsis` is BootstrapVue's
             Vue-2 name and does not exist in bootstrap-vue-next: the string does not occur
             once in the installed 0.26.8 bundle, and passing it renders both "..." exactly
             as passing nothing does (measured on the real component: 2 ellipses without the
             prop, 2 with `hide-ellipsis`, 0 with `no-ellipsis`).

             ⚠️ `PaginatorRouteParamsPage` still carries `:hide-ellipsis="true"`, which is
             where this was copied from -- so that paginator has never hidden anything, and
             the next person to copy the pattern inherits the same dead prop. Left alone
             here on purpose: correcting it changes what the contributions and booking pages
             look like, which is a decision, not a fix. (coderabbit found this, 04.09.2026.) -->
        <BPagination
          v-if="otherRows.length > PAGE_SIZE"
          v-model="currentPage"
          class="mt-3 contacts-pager"
          pills
          size="lg"
          :no-ellipsis="true"
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
import { computed, ref, watch } from 'vue'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { BFormInput, BPagination, BSpinner } from 'bootstrap-vue-next'
import ContactRow from '@/components/Contacts/ContactRow.vue'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import { useContactWindow } from '@/composables/useContactWindow'
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

const { onResult, onError } = useQuery(
  contactListQuery,
  { currentPage: 1, pageSize: CONTACTS_FETCH_MAX },
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

const rowKey = (contact) => memberKey(contact.user)

// A tap on a row opens the contact window; the two ways on from there -- send Gradido,
// send e-mail -- live inside it (KF-010). The state machine is shared with the column and
// the phone strip, so the release-on-close rule is written once.
const { windowOpen, selected, open } = useContactWindow()

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

/* The guard behind the number above. `.pagination` is a flex row and Bootstrap leaves it at
   `nowrap`, so anything wider than the page does not wrap -- it spills out of it. This does
   not depend on a width I measured: whatever the page count and however wide the digits,
   the pager gives way by taking a second line. */
.contacts-pager {
  flex-wrap: wrap;
}
</style>
