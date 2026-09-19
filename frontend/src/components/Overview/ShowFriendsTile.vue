<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="mb-3 p-3 show-friends-tile" data-test="show-friends-tile">
    <BContainer class="bg-white app-box-shadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('showFriends.tile.title') }}</div>
      <div class="my-3 small">{{ $t('showFriends.tile.text') }}</div>
      <div class="text-lg-end">
        <BButton variant="gradido" to="/show-friends" data-test="show-friends-tile-go">
          {{ $t('showFriends.tile.go') }}
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
 * ⚠️ One state of three for now: the large one. The mirror ("{name} is here.") and the quiet
 * row need to know who arrived through this member, and that trail is a later delivery. The
 * states will come from the data then, not from a "seen" flag -- nothing is stored that could
 * go stale.
 *
 * The frame is the one the other two tiles of the overview wear (CardCircles), so the three
 * read as one family while the older two are still there.
 */
import { BButton, BContainer } from 'bootstrap-vue-next'
</script>
