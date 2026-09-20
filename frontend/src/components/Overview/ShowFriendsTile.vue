<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="mb-3 p-3 show-friends-tile" data-test="show-friends-tile">
    <BContainer
      v-if="tileState === ROW"
      class="bg-white app-box-shadow gradido-border-radius p-4 mt--3"
    >
      <router-link
        to="/show-friends"
        class="text-decoration-none"
        data-test="show-friends-tile-row"
      >
        {{ $t('showFriends.tile.title') }}
        <IMdiChevronRight class="ms-1" />
      </router-link>
    </BContainer>

    <BContainer v-else class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <!-- The name is the GRIP on the person, not only a word about them: a tap opens the
           contact window (ZE-010). Since the referral trace became the contact list's
           second source, that window already knows this person -- "contact since ..." and
           "knows Gradido through you", with no way into a booking list that has nothing
           in it.

           ⛔ Through <i18n-t> with a slot, NOT by cutting the sentence around the
           placeholder. The ten translations put {name} in ten different places -- Greek
           opens with an article in front of it, Turkish ends on a different word -- so a
           wallet that split the sentence itself would have to know where, in every
           language, for ever. The key stays exactly as it is in all ten files.

           ⚠️ The name is still only interpolated, never markup: it is written by somebody
           else. A slot puts it in a text position inside the button, where Vue escapes it
           exactly as the interpolation did. -->
      <i18n-t
        v-if="tileState === MIRROR"
        keypath="showFriends.mirror.title"
        tag="div"
        class="h3"
        scope="global"
        data-test="show-friends-tile-heading"
      >
        <template #name>
          <button
            type="button"
            class="show-friends-tile-name"
            data-test="show-friends-tile-name"
            @click="openArrival"
          >
            {{ arrival.alias }}
          </button>
        </template>
      </i18n-t>
      <div v-else class="h3" data-test="show-friends-tile-heading">
        {{ $t('showFriends.tile.title') }}
      </div>
      <div v-if="tileState === MIRROR" class="my-3 small" data-test="show-friends-tile-since">
        {{ $t('showFriends.mirror.since', { date: arrivalDate }) }}
        <span v-if="arrival.first" data-test="show-friends-tile-first">
          {{ $t('showFriends.mirror.text') }}
        </span>
      </div>
      <div v-else class="my-3 small">{{ $t('showFriends.tile.text') }}</div>
      <div class="text-lg-end">
        <BButton variant="gradido" to="/show-friends" data-test="show-friends-tile-go">
          {{ tileState === MIRROR ? $t('showFriends.mirror.go') : $t('showFriends.tile.go') }}
          <IMdiChevronRight class="ms-1" />
        </BButton>
      </div>
    </BContainer>

    <!-- At the tile, because this is where the tap happens -- the same shape every other
         list that opens a contact uses (one window per list, not one per row). It is
         `lazy`, so a closed one renders nothing. -->
    <ContactWindow v-model="windowOpen" :contact="selected" />
  </div>
</template>

<script setup>
/**
 * The way onto the page for showing Gradido to somebody, on the overview.
 *
 * The overview is where a member lands after the first creation, and showing follows on
 * having been moved by something oneself -- so the tile is that moment rather than a
 * window that interrupts it.
 *
 * ## Three states, in this order (ZE-008 W5)
 *
 * 1. **Mirror** -- somebody arrived over this member in the last fortnight. It wins over
 *    everything: it is the only one of the three that carries news, and it is the point of
 *    the whole thing.
 * 2. **Row** -- this member has opened the page on this device before. Quiet, still there.
 * 3. **Large** -- the invitation, until they have been there once.
 *
 * ⛔ The mirror comes from the DATA, never from a flag: `latestArrival` is read fresh, so
 * nothing can go stale. Only the "has been there" of state 2 is remembered, per device and
 * per member (`useShowFriendsSeen`) -- and on a new device the tile is simply large again.
 *
 * In the mirror the name is also the GRIP on the person: a tap opens the contact window
 * (ZE-010), which since the referral trace became the contact list's second source
 * already knows them -- "contact since ...", "knows Gradido through you", and no way into
 * a booking list that has nothing in it. Three taps from here to the first thank you.
 *
 * ⚠️ The arrival's name is written by somebody else, so it is only ever interpolated,
 * never rendered as markup -- inside the button as it was outside it.
 *
 * The frame is the one the other two tiles of the overview wear (CardCircles), so the
 * three read as one family while the older two are still there.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { BButton, BContainer } from 'bootstrap-vue-next'
import ContactWindow from '@/components/Contacts/ContactWindow.vue'
import { showFriends } from '@/graphql/showFriends.graphql'
import { useContactWindow } from '@/composables/useContactWindow'
import { useShowFriendsSeen } from '@/composables/useShowFriendsSeen'

/** How long an arrival stays news. Two weeks is Bernd's "danach eine ruhige Zeile". */
const MIRROR_DAYS = 14

const MIRROR = 'mirror'
const ROW = 'row'

const { locale } = useI18n()
const store = useStore()
const { client: apolloClient } = useApolloClient()
const { seen } = useShowFriendsSeen()

/** The contact window this tile opens, and the lookup that fills in its meta line. */
const { windowOpen, selected, openMember } = useContactWindow(apolloClient)

// ⚠️ `cache-and-network`: the query takes no arguments, so every member shares one cache
// key. Signing out clears the store, and this is the second lock -- an arrival belongs to
// exactly one member and must not survive a change of account on a shared device.
const { result } = useQuery(showFriends, null, { fetchPolicy: 'cache-and-network' })

const arrival = computed(() => result.value?.showFriends?.latestArrival ?? null)

/**
 * The tap on the name: this person, in the window every other list opens (KF-010).
 *
 * ⛔ THIS wallet's community uuid, not null. The server does read a missing one as this
 * community (`resolveCommunityUuid`), so the lookup would land either way -- but the
 * window opens AT ONCE on what it is handed and fills the figures in when the answer
 * comes, and its two buttons build `/send/<community>/<member>` and do nothing at all
 * without a community. With null they would have been dead for the length of a round
 * trip, and dead for good where the lookup fails (which `openMember` deliberately
 * survives). The store holds it from the login and `verifyLogin` keeps it fresh; `??
 * null` only keeps a session that predates the field on the old behaviour.
 *
 * ⚠️ Right for the same reason the field is missing from the query: an arrival is by
 * construction a member of this community -- registration writes the home uuid on the row
 * it creates -- so this wallet's own uuid IS theirs.
 */
const openArrival = () => {
  if (!arrival.value) return
  openMember({
    gradidoID: arrival.value.gradidoID,
    communityUuid: store.state.communityUuid ?? null,
    alias: arrival.value.alias,
  })
}

/** Only a recent arrival is news; an older one leaves the tile in its quiet state. */
const arrivalIsFresh = computed(() => {
  const when = arrival.value ? new Date(arrival.value.createdAt) : null
  if (!when || Number.isNaN(when.getTime())) {
    return false
  }
  return Date.now() - when.getTime() < MIRROR_DAYS * 24 * 60 * 60 * 1000
})

const tileState = computed(() => {
  if (arrivalIsFresh.value) {
    return MIRROR
  }
  return seen.value ? ROW : 'large'
})

/** Day and month, no year: the mirror only ever speaks about the last fortnight. */
const arrivalDate = computed(() =>
  arrival.value
    ? new Date(arrival.value.createdAt).toLocaleDateString(locale.value, {
        day: 'numeric',
        month: 'long',
      })
    : '',
)
</script>

<style lang="scss" scoped>
/* ⛔ Looks like the tappable name everywhere else in the wallet -- link colour and an
   underline -- for the reason `Name.vue` gives beside the same rule: the affordance is
   what tells a member there is something behind it. `font: inherit` carries the heading's
   own size and weight in, so the sentence reads as one sentence with one word in it that
   can be tapped.

   ⚠️ Inline, not `display: block` as in the booking row: here the name stands INSIDE a
   sentence, and a block would push the words after it onto a line of their own. */
.show-friends-tile-name {
  display: inline;
  appearance: none;
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  text-align: inherit;
  color: var(--bs-link-color, #0d6efd);
  text-decoration: underline;
  cursor: pointer;
}

.show-friends-tile-name:hover,
.show-friends-tile-name:focus-visible {
  color: var(--bs-link-hover-color, #0a58ca);
}
</style>
