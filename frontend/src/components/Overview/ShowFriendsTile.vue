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
      <div class="h3" data-test="show-friends-tile-heading">
        {{
          tileState === MIRROR
            ? $t('showFriends.mirror.title', { name: arrival.alias })
            : $t('showFriends.tile.title')
        }}
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
 * ⚠️ The arrival's name is written by somebody else, so it is only ever interpolated,
 * never rendered as markup.
 *
 * The frame is the one the other two tiles of the overview wear (CardCircles), so the
 * three read as one family while the older two are still there.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@vue/apollo-composable'
import { BButton, BContainer } from 'bootstrap-vue-next'
import { showFriends } from '@/graphql/showFriends.graphql'
import { useShowFriendsSeen } from '@/composables/useShowFriendsSeen'

/** How long an arrival stays news. Two weeks is Bernd's "danach eine ruhige Zeile". */
const MIRROR_DAYS = 14

const MIRROR = 'mirror'
const ROW = 'row'

const { locale } = useI18n()
const { seen } = useShowFriendsSeen()

// ⚠️ `cache-and-network`: the query takes no arguments, so every member shares one cache
// key. Signing out clears the store, and this is the second lock -- an arrival belongs to
// exactly one member and must not survive a change of account on a shared device.
const { result } = useQuery(showFriends, null, { fetchPolicy: 'cache-and-network' })

const arrival = computed(() => result.value?.showFriends?.latestArrival ?? null)

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
