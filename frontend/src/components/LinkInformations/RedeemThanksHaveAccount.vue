<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="redeem-thanks-have-account">
    <!-- Where a link can be redeemed in another community as well, the account may be
         there: the line opens the question where it is, with this community chosen.
         Elsewhere it leads straight to the sign-in. -->
    <template v-if="asksWhere">
      <button
        type="button"
        class="redeem-thanks-link redeem-thanks-toggle"
        :aria-expanded="accountOpen"
        aria-controls="redeem-thanks-account"
        data-test="redeem-thanks-have-account"
        @click="accountOpen = !accountOpen"
      >
        {{ $t('redeem-thanks.have-account') }}
        <svg
          class="redeem-thanks-caret"
          :class="{ 'is-open': accountOpen }"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"
          />
        </svg>
      </button>
      <div
        v-if="accountOpen"
        id="redeem-thanks-account"
        class="redeem-thanks-account"
        data-test="redeem-thanks-account"
      >
        <p class="redeem-thanks-account-title" data-test="redeem-thanks-where-account">
          {{ $t('redeem-thanks.where-account') }}
        </p>
        <community-switch
          :model-value="recipientCommunity"
          @update:model-value="chooseCommunity"
          @communities-loaded="communities = $event"
        />
        <BButton
          v-if="isForeignCommunitySelected"
          variant="gradido"
          class="fs-7 redeem-thanks-account-go"
          :disabled="forwarding"
          data-test="redeem-thanks-forward"
          @click="forward"
        >
          {{ $t('gdd_per_link.to-switch') }}
        </BButton>
        <BButton
          v-else
          variant="gradido"
          class="fs-7 redeem-thanks-account-go"
          :to="routeWithParamsAndQuery('Login')"
          data-test="redeem-thanks-sign-in"
        >
          {{ $t('signin') }}
        </BButton>
        <!-- Only where there is another community to choose: with one, the switch
             shows its name and nothing can be picked. -->
        <p
          v-if="communities.length > 1"
          class="redeem-thanks-account-hint small"
          data-test="redeem-thanks-other-community"
        >
          {{ $t('redeem-thanks.other-community') }}
        </p>
      </div>
    </template>
    <BLink
      v-else
      class="redeem-thanks-link"
      :to="routeWithParamsAndQuery('Login')"
      data-test="redeem-thanks-have-account"
    >
      {{ $t('redeem-thanks.have-account') }}
    </BLink>
  </div>
</template>

<script setup>
/**
 * "I already have an account": the way in for somebody who has one, under the thank-you and
 * under the form that opens an account for it. Moved out of RedeemThanks as it stood, so that
 * both places offer the same.
 *
 * Where a link can be redeemed in another community as well (`asksWhere`), the account may be
 * there: the line opens the question where it is, with this community chosen (ZE-020, F13).
 * Elsewhere it leads straight to the sign-in, with the code of the address.
 */
import { ref } from 'vue'
import { BButton, BLink } from 'bootstrap-vue-next'
import CommunitySwitch from '@/components/CommunitySwitch'
import { useAuthLinks } from '@/composables/useAuthLinks'
import { useRedeemCommunity } from '@/composables/useRedeemCommunity'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'

const props = defineProps({
  linkData: { type: Object, required: true },
  // The code in the address: the token for another community is signed for it.
  redeemCode: { type: String, required: true },
  // The page has read the switch already (`REDEEM_SELECT_COMMUNITY`).
  asksWhere: { type: Boolean, default: false },
})

const { routeWithParamsAndQuery } = useAuthLinks()
const { toastError } = useAppToast()

const accountOpen = ref(false)

// This community first, as the old page had it: without a uuid, which the switch fills in
// from the list of communities once it has it.
const recipientCommunity = ref({
  uuid: '',
  name: CONFIG.COMMUNITY_NAME,
  url: CONFIG.COMMUNITY_URL,
  foreign: false,
})
const communities = ref([])

const chooseCommunity = (community) => {
  recipientCommunity.value = {
    uuid: community.uuid,
    name: community.name,
    url: community.url,
    foreign: community.foreign,
  }
}

const { isForeignCommunitySelected, forwardToRecipientCommunity } = useRedeemCommunity({
  linkData: () => props.linkData,
  redeemCode: () => props.redeemCode,
  recipientCommunity,
})

// The way to the other community is on its way: the button waits. Once the browser is sent
// on it stays locked; where the token did not come, the visitor reads why and may try again.
const forwarding = ref(false)

async function forward() {
  if (forwarding.value) return
  forwarding.value = true
  try {
    if (await forwardToRecipientCommunity()) return
  } catch (error) {
    toastError(error.message)
  }
  forwarding.value = false
}
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it. The sizes are in em of the card's own size, as in RedeemThanks -- which also
   gives every link of the view, the two of this block included, the height a thumb needs. */
.redeem-thanks-have-account {
  margin-top: 6px;
}

/* The line that opens the field is a button, and looks like the links around it: their
   colour in both themes (the dark one sets the same variable), no box. */
.redeem-thanks-toggle {
  gap: 6px;
  border: 0;
  background: none;
  color: rgba(var(--bs-link-color-rgb), 1);
}

.redeem-thanks-toggle:hover {
  text-decoration: underline;
}

.redeem-thanks-toggle:focus-visible {
  border-radius: 4px;
  outline: 2px solid currentcolor;
  outline-offset: 2px;
}

.redeem-thanks-caret.is-open {
  transform: rotate(180deg);
}

/* The field: a step lighter than the card in the light theme, a step above it in the dark
   one, where the card itself has the colour of a surface. */
.redeem-thanks-account {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 14px;
  background: var(--surface);
}

.dark-mode .redeem-thanks-account {
  background: var(--surface-muted);
}

.redeem-thanks-account-title {
  margin: 0;
  color: var(--bs-heading-color);
  font-size: 0.8438em;
  font-weight: 600;
  line-height: 1.4;
}

/* As the invitation further down: a heading's colour, which the dark theme does not switch. */
.dark-mode .redeem-thanks-account-title {
  color: var(--text);
}

.redeem-thanks-account :deep(.redeem-thanks-account-go) {
  width: 100%;
  padding-right: 1.25rem !important;
  padding-left: 1.25rem !important;
}

/* The switch of communities is the wallet's own, with the house's measures for such a line
   (App.vue: 50px high, the name on the left, the arrow on the right). In this field it takes
   the field's width, like the button under it. */
.redeem-thanks-account :deep(.community-switch .dropdown),
.redeem-thanks-account :deep(.community-switch .dropdown-toggle) {
  width: 100%;
}

/* With one community the switch shows its name and brings 8px above and 24px below, meant
   for the page it used to stand on; the field has its own gaps. */
.redeem-thanks-account :deep(.community-switch > .mb-4) {
  margin: 0 !important;
}

.redeem-thanks-account-hint {
  margin: 0;
  line-height: 1.5;
  text-wrap: balance;
}
</style>
