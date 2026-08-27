<!-- AI-GENERATED — not an architecture reference -->
<template>
  <own-code-view :title="$t('pageTitle.my-gradido-card')" :link="link">
    <div v-if="alias" class="small mt-3" data-test="my-gradido-card-address">
      <gradido-address-copy :alias="alias" />
    </div>
    <!-- Big, not a footnote: read at arm's length while the phone is held out. -->
    <div class="fs-5 mt-4">{{ $t('my-codes.gradido-card.hint') }}</div>
  </own-code-view>
</template>

<script setup>
/**
 * "Somebody sends to me": the member's own Gradido address, as a code on the screen.
 *
 * The printed Gradido card carries the same address, and this is the same thing without
 * the paper -- for the moment at a table when the card is at home. Whoever scans it lands
 * on the public profile page and finds the "send Gradido" button there.
 *
 * ## No user name needed here, although the printed card insists on one
 *
 * The gate on the card is not about the fallback being ugly: `memberAlias` falls back to
 * the Gradido ID, and `findUserByIdentifier` resolves that exactly as well. The gate is
 * there because a printed card is given away and cannot be called back or corrected.
 *
 * A screen can be corrected. So this page shows the address it has, and the member who
 * later picks a name simply shows a different one the next day.
 *
 * ⚠️ The address is built through `utils/gradidoAddress` like everywhere else -- the
 * navigation bar, the card and the cheque all read it from there, which is what keeps a
 * shown address and a printed one from drifting apart.
 */
import { computed } from 'vue'
import { useStore } from 'vuex'
import OwnCodeView from '@/components/QrCode/OwnCodeView'
import GradidoAddressCopy from '@/components/GradidoAddressCopy'
import { gradidoAddress, memberAlias } from '@/utils/gradidoAddress'

const store = useStore()

// gradidoID, not gradidoId -- the store spells it with a capital D, and the other
// spelling once put the word "undefined" in front of every member without a user name.
const alias = computed(() => memberAlias(store.state.username, store.state.gradidoID))

/**
 * No alias, no code.
 *
 * The route requires a login, so this should not arise -- but `gradidoID` is null for the
 * moment before the login response has landed, and an address built then would read
 * `host/u/` : an address with nobody in it. Showing nothing for that instant is right.
 */
const link = computed(() => (alias.value ? gradidoAddress(alias.value).link : ''))
</script>
