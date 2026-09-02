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

    <div v-else-if="contacts.length === 0" class="text-muted" data-test="contacts-empty">
      {{ $t('contacts.empty') }}
    </div>

    <template v-else>
      <!-- Favourites first (L §8.14), all of them, whatever page the rest is on. -->
      <section v-if="favoriteRows.length" class="mb-4" data-test="contacts-favorites">
        <h2 class="h6 text-uppercase text-muted mb-2">{{ $t('contacts.favorites') }}</h2>
        <div class="bg-white gradido-border-radius app-box-shadow px-3">
          <contact-row v-for="contact in favoriteRows" :key="rowKey(contact)" :contact="contact" />
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
          <contact-row v-for="contact in pageRows" :key="rowKey(contact)" :contact="contact" />
        </div>
        <div v-else class="text-muted small" data-test="contacts-none-match">
          {{ $t('contacts.count', 0) }}
        </div>
        <BPagination
          v-if="otherRows.length > PAGE_SIZE"
          v-model="currentPage"
          class="mt-3"
          pills
          size="lg"
          :per-page="PAGE_SIZE"
          :total-rows="otherRows.length"
          align="center"
          data-test="contacts-pagination"
        />
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { BFormInput, BPagination, BSpinner } from 'bootstrap-vue-next'
import ContactRow from '@/components/Contacts/ContactRow.vue'
import { contactListQuery } from '@/graphql/contacts.graphql'
import { isFavorite, favoriteKey } from '@/composables/useFavorites'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { PAGE_SIZE } from '@/constants'

/**
 * The whole list in one answer, then favourites, search and pages on this device.
 *
 * The server pages and searches too -- but the favourites are to stand ABOVE the rest,
 * all of them, and the rest is to be searched as one types; both are one array operation
 * once the list is here, and a round trip each otherwise. The list is small: a few dozen
 * people for most members, some hundred for the busiest account measured (713). Should
 * somebody ever pass the cap below, the count under "all contacts" says so, and the
 * server-side page is the way to go further -- it exists, it is just not used yet.
 */
const CONTACTS_FETCH_MAX = 1000

const { toastError } = useAppToast()
const { client: apolloClient } = useApolloClient()

const contacts = ref([])
const loaded = ref(false)
const search = ref('')
const currentPage = ref(1)

const { onResult, onError } = useQuery(
  contactListQuery,
  { currentPage: 1, pageSize: CONTACTS_FETCH_MAX },
  { fetchPolicy: 'cache-and-network' },
)
onResult(({ data }) => {
  if (!data?.contactList) return
  contacts.value = data.contactList.contacts
  loaded.value = true
})
onError((error) => {
  loaded.value = true
  toastError(error.message)
})

const rowKey = (contact) => favoriteKey(contact.user)

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
watch(
  [favoriteRows, pageRows],
  ([favorites, page]) => {
    const members = [...favorites, ...page]
      .map(({ user }) => user)
      .filter((user) => user?.gradidoID)
      .map(({ gradidoID, communityUuid, avatarUpdatedAt }) => ({
        gradidoID,
        communityUuid: communityUuid ?? null,
        avatarUpdatedAt: avatarUpdatedAt ?? null,
      }))
    if (members.length) fetchMemberAvatars(apolloClient, members)
  },
  { immediate: true },
)
</script>
