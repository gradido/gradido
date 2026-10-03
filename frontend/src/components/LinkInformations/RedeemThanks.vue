<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="redeem-thanks text-center">
    <!-- The thank-you was accepted on this page, a moment ago: where it is now, the greeting
         in short, and the two ways on. It belongs to the moment -- whoever loads the page
         again reads "Dieser Dank ist angenommen." below. -->
    <div v-if="stage === 'arrived'" class="redeem-thanks-closed" data-test="redeem-thanks-arrived">
      <svg
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
      <h2 class="redeem-thanks-closed-title" data-test="redeem-thanks-title">
        {{ $t('redeem-thanks.arrived-title') }}
      </h2>
      <p class="redeem-thanks-closed-text" data-test="redeem-thanks-text">{{ arrivedText }}</p>
      <redeem-thanks-paper
        v-if="linkData.greeting"
        class="redeem-thanks-arrived-paper"
        :link-data="linkData"
        short
      />
      <!-- The answer is a message in the conversation with whoever thanked; the greeting
           stands there as a bubble, and the heart is there (ZE-017 F6). -->
      <div class="redeem-thanks-actions">
        <BButton
          variant="gradido"
          class="redeem-thanks-accept"
          :to="answerTo"
          data-test="redeem-thanks-answer"
        >
          <span ref="answerLine" class="redeem-thanks-answer-line">{{ answerLabel }}</span>
        </BButton>
      </div>
      <div class="redeem-thanks-onward">
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

    <!-- The account could not be signed in to. ⛔ One view for every reason, and it names none
         (E-017): an address that is taken and a link that did not vouch read the same. -->
    <div
      v-else-if="stage === 'almost'"
      class="redeem-thanks-closed"
      data-test="redeem-thanks-almost"
    >
      <svg
        class="redeem-thanks-sign is-almost"
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
        <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
        <path d="M3 6l7 5.2L17 6" />
      </svg>
      <h2 class="redeem-thanks-closed-title" data-test="redeem-thanks-title">
        {{ $t('redeem-thanks.almost-title') }}
      </h2>
      <p class="redeem-thanks-closed-text" data-test="redeem-thanks-text">
        {{ $t('redeem-thanks.almost-text') }}
      </p>
      <p
        class="redeem-thanks-closed-text redeem-thanks-almost-second"
        data-test="redeem-thanks-almost-have-account"
      >
        {{ $t('redeem-thanks.almost-have-account') }}
      </p>
      <div class="redeem-thanks-onward">
        <BButton
          :variant="null"
          class="redeem-thanks-to-account"
          :to="routeWithParamsAndQuery('Login')"
          data-test="redeem-thanks-almost-sign-in"
        >
          {{ $t('signin') }}
        </BButton>
      </div>
    </div>

    <!-- The link opened later: a sign, what became of the thank-you, and one sentence. -->
    <div
      v-else-if="closed"
      class="redeem-thanks-closed"
      :data-test="`redeem-thanks-${closed.name}`"
    >
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

    <!-- A guest who tapped "accept": the account is opened right here (ZE-017 F5), under the
         same address. The form is no state of the link, so a reload shows the sheet again. -->
    <redeem-thanks-account
      v-else-if="isGuest && accountFormOpen"
      :link-data="linkData"
      :accepting="accepting"
      @submit="$emit('open-account', $event)"
    >
      <redeem-thanks-have-account
        :link-data="linkData"
        :redeem-code="redeemCode"
        :asks-where="asksWhere"
      />
    </redeem-thanks-account>

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

      <!-- A guest: the same button opens the form an account is opened with, on this page;
           under it the way in for somebody who has an account, and the invitation.
           ⛔ No small print under the button (ZE-017, F4). -->
      <template v-else-if="isGuest">
        <div class="redeem-thanks-actions">
          <BButton
            variant="gradido"
            class="redeem-thanks-accept"
            data-test="redeem-thanks-accept"
            @click="openAccountForm"
          >
            {{ $t('redeem-thanks.accept') }}
          </BButton>
        </div>
        <redeem-thanks-have-account
          :link-data="linkData"
          :redeem-code="redeemCode"
          :asks-where="asksWhere"
        />
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
 * - A guest (`LOGGED_OUT`, `REDEEM_SELECT_COMMUNITY`): "accept" opens the form an account is
 *   opened with, on this page and under this address (RedeemThanksAccount); the page opens
 *   the account, signs in and books. Somebody with an account signs in and comes back to the
 *   link. Where a link can be redeemed in another community (`REDEEM_SELECT_COMMUNITY`, the
 *   page reads the switch), the choice of community that stood on the page for everybody
 *   stands behind "I already have an account" (RedeemThanksHaveAccount): whoever is new gets
 *   their account here, and only somebody with one has a community to name.
 * - A member (`VALID`): one tap, and the page books.
 * - The sender (`SELF_CREATOR`): the sheet as the other person will see it.
 * - Opened later (`TEXT_REDEEMED`, `TEXT_EXPIRED`, `TEXT_DELETED`): what became of it.
 *
 * And two views that belong to the moment, which the page names with `stage`: "arrived", once
 * the thank-you was booked on this page -- for a new member and for one who had an account --
 * and "almost", where the new account could not be signed in to.
 *
 * Contribution links and links from another community do not come here; they keep the page
 * they had.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { BButton, BLink } from 'bootstrap-vue-next'
import RedeemThanksAccount from '@/components/LinkInformations/RedeemThanksAccount'
import RedeemThanksHaveAccount from '@/components/LinkInformations/RedeemThanksHaveAccount'
import RedeemThanksPaper from '@/components/LinkInformations/RedeemThanksPaper'
import { useAmountInText } from '@/composables/useAmountInText'
import { useAuthLinks } from '@/composables/useAuthLinks'
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
  // What just happened on this page: 'arrived' or 'almost' (see above). Null otherwise.
  stage: { type: String, default: null },
})

defineEmits(['accept', 'open-account'])

const { t, d, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { routeWithParamsAndQuery } = useAuthLinks()
const amountInText = useAmountInText()

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

/**
 * The form an account is opened with stands on this page, under this address. It gets an entry
 * of its own in the browser's history -- the same address, marked in the entry's state -- so
 * that the way back leads from the form to the sheet, as a guest on a phone expects, and not
 * away from the thank-you.
 *
 * ⛔ Not a state of the link, and not kept: whoever loads the page again sees the sheet. The
 * history keeps an entry's state across a reload, so an entry that was the form forgets it
 * when the view is built.
 */
const ACCOUNT_FORM = 'redeemThanksAccount'
const accountFormOpen = ref(false)

const openAccountForm = async () => {
  accountFormOpen.value = true
  // `force`: the address is the one the page stands on, which the router would not go to again.
  await router.push({
    path: route.path,
    query: route.query,
    hash: route.hash,
    force: true,
    state: { [ACCOUNT_FORM]: true },
  })
}

const followHistory = () => {
  accountFormOpen.value = window.history.state?.[ACCOUNT_FORM] === true
}

onMounted(() => {
  if (window.history.state?.[ACCOUNT_FORM]) {
    window.history.replaceState({ ...window.history.state, [ACCOUNT_FORM]: false }, '')
  }
  window.addEventListener('popstate', followHistory)
})
onBeforeUnmount(() => window.removeEventListener('popstate', followHistory))

const senderName = computed(() =>
  memberAlias(props.linkData.senderUser?.alias, props.linkData.senderUser?.gradidoID),
)

// "Dein Dank ist da.": the amount as the sheet writes it, with the decimal mark of the language.
const arrivedText = computed(() =>
  t('redeem-thanks.arrived-text', {
    amount: amountInText(props.linkData.amount),
    name: senderName.value,
  }),
)

// The conversation with whoever thanked, as the button of their mail opens it. A missing
// community is this one.
const answerTo = computed(() => ({
  path: '/contacts',
  query: { with: props.linkData.senderUser?.gradidoID },
}))

/**
 * "… antworten" names whoever thanked while the label stays one line, and goes without the name
 * where it does not: a user name may be 20 characters, and the button of a 320px phone holds
 * fewer. Measured at the label itself rather than counted in letters -- how wide a name is
 * depends on its letters, on the language around it and on the size the reader chose ("Aa").
 *
 * The line cuts what does not fit (see the style), so a label too wide is one whose content is
 * wider than its box. Tried with the name each time, before the browser paints.
 */
const answerLine = ref(null)
const nameFits = ref(true)
const answerWithName = computed(() => t('redeem-thanks.answer', { name: senderName.value }))
const answerLabel = computed(() =>
  nameFits.value ? answerWithName.value : t('redeem-thanks.answer-short'),
)

const fitAnswer = async () => {
  nameFits.value = true
  await nextTick()
  const line = answerLine.value
  if (line && line.scrollWidth > line.clientWidth) nameFits.value = false
}

// The width of the page and the size of the letters both change the line's box.
const lineWatcher = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fitAnswer)
watch(answerLine, (line, before) => {
  if (before) lineWatcher?.unobserve(before)
  if (!line) return
  lineWatcher?.observe(line)
  fitAnswer()
})
onBeforeUnmount(() => lineWatcher?.disconnect())
// Another language, another length.
watch(answerWithName, fitAnswer)
// The house's letters may arrive after the view: they are not as wide as the ones that stood in.
document.fonts?.ready?.then(fitAnswer)

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

.redeem-thanks-actions,
.redeem-thanks :deep(.redeem-thanks-actions) {
  margin-top: 20px;
}

/* Through `:deep`: BButton renders a router-link, which renders the anchor, and Vue stamps the
   scope attribute only on the root element of a direct child component. From the root of the
   view, so that the button under the form an account is opened with is the same one.

   The one button of the page: as wide as the sheet above it, 46px high at the usual size.
   Its label is one line in all ten languages down to a 320px phone -- measured in the built
   wallet -- and for that the letters are the card's own size and the house button's 50px of
   side padding give way: at the house's large size (20px) the label broke in seven of the
   ten languages there, and still in four at 360px. */
.redeem-thanks :deep(.redeem-thanks-accept) {
  --bs-btn-font-size: 1em;

  width: 100%;
  padding: 0.6875em 0.75rem !important;
}

/* One line, whatever the name: what does not fit is cut here, and the view then leaves the
   name out (`fitAnswer`). */
.redeem-thanks-answer-line {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* A letter is on its way: the colour of the thank-you that waits. */
.redeem-thanks-sign.is-almost {
  color: #a8732a;
}

/* The greeting in short, between the sentence and the two ways on. */
.redeem-thanks-arrived-paper {
  margin-top: 14px;
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

/* The second sentence of "Fast geschafft" stands apart from the first: it speaks to somebody
   else. After the rule above, which sets every margin of such a sentence to none. */
.redeem-thanks-almost-second {
  margin-top: 10px;
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
