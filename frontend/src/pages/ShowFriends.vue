<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="show-friends">
    <p class="mb-4" data-test="show-friends-lead">{{ $t('showFriends.page.lead') }}</p>
    <h2 class="h4 mb-3" data-test="show-friends-question">{{ $t('showFriends.page.question') }}</h2>

    <section class="door bg-white app-box-shadow gradido-border-radius mb-3">
      <button
        type="button"
        class="door-head"
        :aria-expanded="isHereOpen"
        aria-controls="show-friends-here"
        data-test="show-friends-here-head"
        @click="toggle(HERE)"
      >
        <IMdiCoffeeOutline class="door-icon" />
        <span class="door-title">{{ $t('showFriends.here.title') }}</span>
        <IMdiChevronUp v-if="isHereOpen" />
        <IMdiChevronDown v-else />
      </button>
      <div v-if="isHereOpen" id="show-friends-here" class="door-body" data-test="show-friends-here">
        <own-code-view :title="$t('pageTitle.my-gradido-card')" :link="link" :show-head="false">
          <div v-if="alias" class="small mt-3" data-test="show-friends-address">
            <gradido-address-copy :alias="alias" />
          </div>
          <ol class="door-steps mt-4 mb-0" data-test="show-friends-steps">
            <!-- The map exists only where matching is switched on; a step that sends somebody
                 to a place the wallet does not have would be a sentence nobody can follow.
                 The word carries the link, like "here" in the first creation: right under the
                 member's own card, "the map" alone would read as the code above it. -->
            <li v-if="hasMap" data-test="show-friends-step-map">
              <i18n-t keypath="showFriends.here.step1" tag="span" scope="global">
                <template #map>
                  <RouterLink to="/matching/karte" data-test="show-friends-map">
                    {{ $t('showFriends.here.map') }}
                  </RouterLink>
                </template>
              </i18n-t>
            </li>
            <li>{{ $t('showFriends.here.step2') }}</li>
            <li>{{ $t('showFriends.here.step3') }}</li>
          </ol>
        </own-code-view>
      </div>
    </section>

    <section class="door bg-white app-box-shadow gradido-border-radius mb-3">
      <button
        type="button"
        class="door-head"
        :aria-expanded="isAwayOpen"
        aria-controls="show-friends-away"
        data-test="show-friends-away-head"
        @click="toggle(AWAY)"
      >
        <IMdiEmailOutline class="door-icon" />
        <span class="door-title">{{ $t('showFriends.away.title') }}</span>
        <IMdiChevronUp v-if="isAwayOpen" />
        <IMdiChevronDown v-else />
      </button>
      <div v-if="isAwayOpen" id="show-friends-away" class="door-body" data-test="show-friends-away">
        <p>
          <strong>{{ $t('showFriends.away.thanks') }}</strong>
          {{ $t('showFriends.away.thanksText') }}
        </p>
        <!-- Until the thank-you greeting has a form of its own, the thank-you is a link: the
             send form, opened on its link, cheque and QR tab. -->
        <BButton
          variant="gradido"
          :to="{ path: '/send', query: { art: SEND_TYPES.link } }"
          data-test="show-friends-thanks"
        >
          {{ $t('send_per_link') }}
        </BButton>

        <template v-if="alias">
          <p class="small mt-4 mb-2">{{ $t('showFriends.away.addressLead') }}</p>
          <!-- Exactly what goes out, so what the member reads here is what arrives. -->
          <blockquote class="door-quote" data-test="show-friends-share-text">
            {{ addressText }}
          </blockquote>
          <BButton variant="outline-secondary" data-test="show-friends-share" @click="shareAddress">
            <IBiShare class="me-2" />
            {{ $t('showFriends.away.shareButton') }}
          </BButton>
          <p class="door-hint small mt-2 mb-0">{{ $t('showFriends.away.editHint') }}</p>
        </template>
      </div>
    </section>

    <p class="mt-4" data-test="show-friends-footer">
      <strong>{{ $t('showFriends.page.footerLead') }}</strong>
      {{ $t('showFriends.page.footer') }}
    </p>
  </div>
</template>

<script setup>
/**
 * Showing Gradido to somebody: one question, two doors.
 *
 * The page asks "whom?" -- one person with a name, not "friends" in the plural -- and answers
 * with two ways. The first is open on arrival, because the table is the usual case and every
 * tap between deciding and holding up the code is one too many.
 *
 * ## The first door is the member's own card
 *
 * Not a new kind of code: the same address as the card page (`MyGradidoCard`), drawn by the
 * same view with the same link, so the code here, the code there and the printed card are one
 * picture. Whoever scans it lands on the public page behind the address, which says who shows
 * them Gradido and offers to open an account.
 *
 * ## The second door is for somebody elsewhere
 *
 * A thank-you first -- whoever thanks gives something, whoever invites wants something. Until
 * the thank-you greeting is built it is the link from the send form. Under it the address
 * alone, with a sentence around it, handed to the device's share sheet.
 *
 * Nothing here is stored and nothing is asked of the server. The page reads the member's name
 * from the store like the card page does.
 */
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { BButton } from 'bootstrap-vue-next'
import OwnCodeView from '@/components/QrCode/OwnCodeView'
import GradidoAddressCopy from '@/components/GradidoAddressCopy'
import { useAppToast } from '@/composables/useToast'
import { useShowFriendsSeen } from '@/composables/useShowFriendsSeen'
import CONFIG from '@/config'
import { gradidoAddress, memberAlias } from '@/utils/gradidoAddress'
import { SEND_TYPES } from '@/utils/sendTypes'
import { shareText } from '@/utils/shareText'

const HERE = 'here'
const AWAY = 'away'

const store = useStore()
const { t } = useI18n()

/**
 * Having been here once is what turns the tile on the overview from the large invitation
 * into a quiet row (ZE-008 W5). Remembered on opening rather than on any action taken
 * here: the member came, looked and decided -- that is the answer the tile asked for.
 */
const { markSeen } = useShowFriendsSeen()
onMounted(markSeen)
const toast = useAppToast()

const hasMap = CONFIG.MATCHING_ACTIVE === true

// gradidoID with a capital D, as the store spells it (see MyGradidoCard).
const alias = computed(() => memberAlias(store.state.username, store.state.gradidoID))

// No alias, no code: for the instant before the login answer has landed, an address built
// then would read `host/u/` -- nobody in it.
const link = computed(() => (alias.value ? gradidoAddress(alias.value).link : ''))

const addressText = computed(() => t('showFriends.away.shareText', { url: link.value }))

/**
 * One door open at a time, and either may be closed again. The first is open on arrival.
 */
const openDoor = ref(HERE)
const isHereOpen = computed(() => openDoor.value === HERE)
const isAwayOpen = computed(() => openDoor.value === AWAY)

const toggle = (door) => {
  openDoor.value = openDoor.value === door ? null : door
}

/**
 * The sentence and the address, to the share sheet; copied where the device has none.
 *
 * Copying says "copied" only once it is copied, for the reason `GradidoAddressCopy` gives: in
 * some browsers built into other apps there is no clipboard at all, and the call throws.
 */
const copyAddressText = async () => {
  try {
    await navigator.clipboard.writeText(addressText.value)
    toast.toastSuccess(t('showFriends.away.copied'))
  } catch {
    toast.toastError(t('gradidoid-not-copied'))
  }
}

const shareAddress = () => shareText(addressText.value, copyAddressText)
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector". */

/* The whole head is the button, so the door opens wherever it is touched. It brings none of
   a button's looks with it: colour and font come from the page. */
.door-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.25rem;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: start;
}

.door-icon {
  flex-shrink: 0;
  font-size: 1.4rem;
}

.door-title {
  flex: 1;
}

.door-body {
  padding: 0 1.25rem 1.25rem;
}

/* The steps are read at the table, so left-aligned like any list, even though the code
   above them is centred by its own view. */
.door-steps {
  text-align: start;
  padding-inline-start: 1.25rem;
}

.door-steps li + li {
  margin-top: 0.4rem;
}

/* The message as it goes out: its own lines, and a link that may break anywhere rather than
   run out of the card on a phone. No background of its own, so it reads in both themes. */
.door-quote {
  margin: 0 0 1rem;
  padding: 0.5rem 0.75rem;
  border-inline-start: 3px solid var(--bs-border-color, #dee2e6);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.door-hint {
  color: var(--bs-secondary-color, #6c757d);
}
</style>
