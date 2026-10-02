<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="redeem-thanks text-center">
    <!-- The link opened later: a sign, what became of the thank-you, and one sentence. -->
    <div v-if="closed" class="redeem-thanks-closed" :data-test="`redeem-thanks-${closed.name}`">
      <svg
        v-if="closed.name === 'accepted'"
        class="redeem-thanks-sign is-accepted"
        viewBox="0 0 20 20"
        width="26"
        height="26"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M10 17C5.5 13.8 3 11.4 3 8.6C3 6.4 4.7 5 6.5 5C8 5 9.2 5.9 10 7.2C10.8 5.9 12 5 13.5 5C15.3 5 17 6.4 17 8.6C17 11.4 14.5 13.8 10 17Z"
        />
      </svg>
      <svg
        v-else
        class="redeem-thanks-sign"
        :class="`is-${closed.name}`"
        viewBox="0 0 20 20"
        width="26"
        height="26"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="7.5" />
        <path :d="closed.name === 'expired' ? 'M10 5.5V10l3 2' : 'M6.5 10h7'" />
      </svg>
      <h2 class="redeem-thanks-closed-title" data-test="redeem-thanks-title">
        {{ closed.title }}
      </h2>
      <p class="redeem-thanks-closed-text" data-test="redeem-thanks-text">{{ closed.text }}</p>
      <div v-if="closed.name === 'accepted'" class="redeem-thanks-onward">
        <BButton
          :variant="null"
          class="redeem-thanks-to-account"
          to="/overview"
          data-test="redeem-thanks-to-account"
        >
          {{ $t('redeem-thanks.to-account') }}
        </BButton>
      </div>
    </div>

    <!-- The link is open: the sheet, and under it what this visitor can do with it. -->
    <template v-else>
      <!-- A link that carries a greeting says so; the sender's own keeps its sentence. -->
      <h2 class="h4 redeem-thanks-title" data-test="redeem-thanks-title">
        {{ openTitle }}
      </h2>
      <redeem-thanks-paper :link-data="linkData" />

      <template v-if="isOwn">
        <p class="redeem-thanks-own-text" data-test="redeem-thanks-own-text">
          {{ $t('redeem-thanks.own-text') }}
        </p>
        <BLink class="redeem-thanks-link" to="/transactions" data-test="redeem-thanks-own-links">
          {{ $t('redeem-thanks.own-links') }}
        </BLink>
      </template>

      <!-- A member takes the thank-you with one tap; the page books it and locks the button
           until the answer is there. -->
      <div v-else-if="isMember" class="redeem-thanks-actions">
        <BButton
          variant="gradido"
          class="redeem-thanks-accept"
          :disabled="accepting"
          data-test="redeem-thanks-accept"
          @click="$emit('accept')"
        >
          {{ $t('redeem-thanks.accept') }}
        </BButton>
      </div>

      <!-- A guest: the same button leads to the registration, with the code of the address;
           under it the way in for somebody who has an account, and the invitation.
           ⛔ No small print under the button (ZE-017, F4). -->
      <template v-else-if="isGuest">
        <div class="redeem-thanks-actions">
          <BButton
            variant="gradido"
            class="redeem-thanks-accept"
            :to="routeWithParamsAndQuery('Register')"
            data-test="redeem-thanks-accept"
          >
            {{ $t('redeem-thanks.accept') }}
          </BButton>
        </div>
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
        <div class="redeem-thanks-invite">
          <p class="redeem-thanks-invite-text" data-test="redeem-thanks-invite">
            {{ $t('redeem-thanks.invite') }}
          </p>
          <BLink
            class="redeem-thanks-link"
            :href="`https://gradido.net/${locale}`"
            target="_blank"
            rel="noopener"
            data-test="redeem-thanks-how"
          >
            {{ $t('redeem-thanks.how') }}
          </BLink>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
/**
 * What somebody sees who opens a member's redeem link: a thank-you on a sheet, and what they
 * can do with it. One view for every state such a link can be in; the page decides the state
 * (`itemType` in pages/TransactionLink.vue) and books, this view shows and asks.
 *
 * - A guest (`LOGGED_OUT`, `REDEEM_SELECT_COMMUNITY`): "accept" leads to the registration and
 *   takes the code of the address along, as the page did before; somebody with an account
 *   signs in and comes back to the link. Where a link can be redeemed in another community
 *   (`REDEEM_SELECT_COMMUNITY`, the page reads the switch), the choice of community that
 *   stood on the page for everybody stands behind "I already have an account": whoever is
 *   new gets their account here, and only somebody with one has a community to name.
 * - A member (`VALID`): one tap, and the page books.
 * - The sender (`SELF_CREATOR`): the sheet as the other person will see it.
 * - Opened later (`TEXT_REDEEMED`, `TEXT_EXPIRED`, `TEXT_DELETED`): what became of it.
 *
 * Contribution links and links from another community do not come here; they keep the page
 * they had.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BButton, BLink } from 'bootstrap-vue-next'
import CommunitySwitch from '@/components/CommunitySwitch'
import RedeemThanksPaper from '@/components/LinkInformations/RedeemThanksPaper'
import { useAuthLinks } from '@/composables/useAuthLinks'
import { useRedeemCommunity } from '@/composables/useRedeemCommunity'
import { useAppToast } from '@/composables/useToast'
import CONFIG from '@/config'
import { memberAlias } from '@/utils/gradidoAddress'

const DAY_MS = 24 * 60 * 60 * 1000

const props = defineProps({
  linkData: { type: Object, required: true },
  // The page's `itemType`.
  state: { type: String, required: true },
  // The code in the address: the token for another community is signed for it.
  redeemCode: { type: String, required: true },
  // The page's booking is on its way: the button waits for the answer.
  accepting: { type: Boolean, default: false },
})

defineEmits(['accept'])

const { t, d, locale } = useI18n()
const { routeWithParamsAndQuery } = useAuthLinks()
const { toastError } = useAppToast()

const isGuest = computed(() => ['LOGGED_OUT', 'REDEEM_SELECT_COMMUNITY'].includes(props.state))
const isMember = computed(() => props.state === 'VALID')
const isOwn = computed(() => props.state === 'SELF_CREATOR')

// Above the open sheet. The sheet itself shows the greeting (RedeemThanksPaper); the later
// states -- accepted, expired, deleted -- have no sheet and stay as they are.
const openTitle = computed(() => {
  if (isOwn.value) return t('redeem-thanks.own-title')
  return props.linkData.greeting ? t('thank-you-greeting.received-title') : t('redeem-thanks.title')
})

// "Where is your account?" The page has read the switch already; its state says it.
const asksWhere = computed(() => props.state === 'REDEEM_SELECT_COMMUNITY')
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

const senderName = computed(() =>
  memberAlias(props.linkData.senderUser?.alias, props.linkData.senderUser?.gradidoID),
)

// How long the link was open for, from the link itself: the wallet holds no number of days of
// its own. Rounded, because the server counts the days on its own clock and an hour of summer
// time may lie between the two dates.
const waitedDays = computed(() =>
  Math.round((new Date(props.linkData.validUntil) - new Date(props.linkData.createdAt)) / DAY_MS),
)

// The keys are written out here one by one: the unused-keys rule of the linter only counts
// a key it finds as a literal.
const closed = computed(() => {
  switch (props.state) {
    case 'TEXT_REDEEMED':
      return {
        name: 'accepted',
        title: t('redeem-thanks.accepted-title'),
        text: t('redeem-thanks.accepted-text', {
          date: d(new Date(props.linkData.redeemedAt), 'long'),
        }),
      }
    case 'TEXT_EXPIRED':
      return {
        name: 'expired',
        // The days twice: once as the number in the sentence, once as the form to choose --
        // Russian has three for a number of days (slavicPlural), as `transaction.onlyWith`.
        title: t('redeem-thanks.expired-title', { days: waitedDays.value }, waitedDays.value),
        text: t('redeem-thanks.expired-text', { name: senderName.value }),
      }
    case 'TEXT_DELETED':
      return {
        name: 'deleted',
        title: t('redeem-thanks.deleted-title'),
        text: t('redeem-thanks.deleted-text', {
          name: senderName.value,
          date: d(new Date(props.linkData.deletedAt), 'long'),
        }),
      }
    default:
      return null
  }
})
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it.

   The sizes are in em of the card's own size, which the "Aa" control of the layout sets: at
   the usual 16px they are the 14px and 13.5px of the drawing. Unlike the sheet, everything
   here follows the theme. */
.redeem-thanks-title {
  margin-bottom: 12px;
}

.redeem-thanks-actions {
  margin-top: 20px;
}

/* Through `:deep`: BButton renders a router-link, which renders the anchor, and Vue stamps the
   scope attribute only on the root element of a direct child component.

   The one button of the page: as wide as the sheet above it, 46px high at the usual size.
   Its label is one line in all ten languages down to a 320px phone -- measured in the built
   wallet -- and for that the letters are the card's own size and the house button's 50px of
   side padding give way: at the house's large size (20px) the label broke in seven of the
   ten languages there, and still in four at 360px. */
.redeem-thanks-actions :deep(.redeem-thanks-accept) {
  --bs-btn-font-size: 1em;

  width: 100%;
  padding: 0.6875em 0.75rem !important;
}

/* A link with the height a thumb needs. */
.redeem-thanks :deep(.redeem-thanks-link) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 12px;
  font-size: 0.875em;
}

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

/* The line above the invitation takes the colour of the text around it, thinned: it fits
   the light card and the dark one without a value of its own (as `.separator-start`). */
.redeem-thanks-invite {
  margin-top: 6px;
  padding-top: 18px;
  border-top: 1px solid color-mix(in srgb, currentcolor 22%, transparent);
}

/* `text-wrap: balance`, here and on the other centred sentences of two or three lines: lines
   of about the same length, so that no single word is left alone on the last one ("... Danke /
   sagen?" on a narrow phone). A browser that does not know the value wraps as before. */
.redeem-thanks-invite-text {
  margin: 0 0 2px;
  color: var(--bs-heading-color);
  font-size: 0.875em;
  font-weight: 600;
  line-height: 1.45;
  text-wrap: balance;
}

/* The colour of a heading on a line that is none. Bootstrap's variable for it is not switched
   in the dark theme -- the dark sheet repaints the heading elements themselves -- so this
   line is switched here: left alone it stood on the dark card at 1.2 : 1. */
.dark-mode .redeem-thanks-invite-text {
  color: var(--text);
}

.redeem-thanks-own-text {
  margin: 14px 0 2px;
  font-size: 0.8438em;
  line-height: 1.5;
  text-wrap: balance;
}

.redeem-thanks-sign {
  display: block;
  margin: 0 auto 8px;
}

.redeem-thanks-sign.is-accepted {
  color: #c58d38;
}

.redeem-thanks-sign.is-expired {
  color: #a8732a;
}

.redeem-thanks-sign.is-deleted {
  color: #7a8296;
}

.redeem-thanks-closed-title {
  margin-bottom: 6px;
  font-size: 1em;
  line-height: 1.3;
  text-wrap: balance;
}

.redeem-thanks-closed-text {
  margin: 0;
  font-size: 0.8438em;
  line-height: 1.5;
  text-wrap: balance;
}

.redeem-thanks-onward {
  margin-top: 12px;
}

/* Outlined, not golden: the thank-you is taken, and the way to the account is a quiet one.
   The house's outlined variant is blue on a near-white edge in the light theme, 3.5 : 1 on
   this card; this one takes the text's own colour, in both themes. */
.redeem-thanks-onward :deep(.redeem-thanks-to-account) {
  --bs-btn-color: var(--bs-body-color);
  --bs-btn-border-color: var(--bs-body-color);
  --bs-btn-border-width: 1.5px;
  --bs-btn-hover-color: var(--bs-body-color);
  --bs-btn-hover-border-color: var(--bs-body-color);
  --bs-btn-active-color: var(--bs-body-color);
  --bs-btn-active-border-color: var(--bs-body-color);
  --bs-btn-padding-x: 22px;
  --bs-btn-padding-y: 0.5em;
  --bs-btn-font-size: 0.875em;
  --bs-btn-border-radius: 26px;

  letter-spacing: 0.05em;
}
</style>
