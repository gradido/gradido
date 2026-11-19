// AI-GENERATED — not an architecture reference
import { BButton, BLink, type ButtonVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, onBeforeUnmount, onMounted, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthLinks } from '@/composables/useAuthLinks'
import { memberAlias } from '@/utils/gradidoAddress'
import classes from './RedeemThanks.module.scss'
import { RedeemThanksAccount } from './RedeemThanksAccount'
import { RedeemThanksHaveAccount } from './RedeemThanksHaveAccount'
import { type RedeemLinkData, RedeemThanksPaper } from './RedeemThanksPaper'

const DAY_MS = 24 * 60 * 60 * 1000

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

/**
 * What somebody sees who opens a member's redeem link: a thank-you on a sheet, and what they
 * can do with it. One view for every state such a link can be in; the page decides the state
 * (`itemType` in pages/TransactionLink.tsx) and books, this view shows and asks.
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
 * And one view that belongs to the moment, which the page names with `stage`: "almost", where
 * the new account could not be signed in to. A thank-you booked on the page leads to the overview
 * instead (E-045): the page after the booking said what the overview says anyway.
 *
 * A link of another community comes here too, as that community answered it: a guest opens the
 * account in this community, and a member books it from there (disburseTransactionLink).
 * Contribution links do not come here; they keep the page they had.
 */
export const RedeemThanks = defineComponent({
  name: 'RedeemThanks',
  props: {
    linkData: { type: Object as PropType<RedeemLinkData>, required: true },
    // The page's `itemType`.
    state: { type: String, required: true },
    // The code in the address: the redeem page of another community gets it.
    redeemCode: { type: String, required: true },
    // The page's booking is on its way: the button waits for the answer.
    accepting: { type: Boolean, default: false },
    // What just happened on this page: 'almost' (see above). Null otherwise.
    stage: { type: String as PropType<string | null>, default: null },
    // The photo of a greeting that carries one, as the page fetched it once from the address of
    // the open link: the sheet and the strip over the account form show the same one. Null where
    // none has come.
    picture: { type: String as PropType<string | null>, default: null },
  },
  emits: ['accept', 'open-account'],
  setup(props, { emit }) {
    const { t, d, locale } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const { routeWithParamsAndQuery } = useAuthLinks()

    const isGuest = computed(() => ['LOGGED_OUT', 'REDEEM_SELECT_COMMUNITY'].includes(props.state))
    const isMember = computed(() => props.state === 'VALID')
    const isOwn = computed(() => props.state === 'SELF_CREATOR')

    // Above the open sheet. The sheet itself shows the greeting (RedeemThanksPaper); the later
    // states -- accepted, expired, deleted -- have no sheet and stay as they are.
    const openTitle = computed(() => {
      if (isOwn.value) {
        return t('redeem-thanks.own-title')
      }
      return props.linkData.greeting
        ? t('thank-you-greeting.received-title')
        : t('redeem-thanks.title')
    })

    // "Where is your account?" The page has read the switch already; its state says it.
    const asksWhere = computed(() => props.state === 'REDEEM_SELECT_COMMUNITY')

    // See ACCOUNT_FORM above.
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

    const senderName = computed<string>(() =>
      memberAlias(props.linkData.senderUser?.alias, props.linkData.senderUser?.gradidoID),
    )

    // How long the link was open for, from the link itself: the wallet holds no number of days of
    // its own. Rounded, because the server counts the days on its own clock and an hour of summer
    // time may lie between the two dates.
    const waitedDays = computed(() =>
      Math.round(
        (new Date(props.linkData.validUntil as string).getTime() -
          new Date(props.linkData.createdAt as string).getTime()) /
          DAY_MS,
      ),
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
              date: d(new Date(props.linkData.redeemedAt as string), 'long'),
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
              date: d(new Date(props.linkData.deletedAt as string), 'long'),
            }),
          }
        default:
          return null
      }
    })

    // The way in for somebody who has an account: under the thank-you and under the form.
    const haveAccount = () => (
      <RedeemThanksHaveAccount
        linkData={props.linkData}
        redeemCode={props.redeemCode}
        asksWhere={asksWhere.value}
      />
    )

    // The account could not be signed in to. ⛔ One view for every reason, and it names none
    // (E-017): an address that is taken and a link that did not vouch read the same.
    const almost = () => (
      <div class='redeem-thanks-closed' data-test='redeem-thanks-almost'>
        <svg
          class='redeem-thanks-sign is-almost'
          viewBox='0 0 20 20'
          width='26'
          height='26'
          fill='none'
          stroke='currentColor'
          stroke-width='1.6'
          stroke-linecap='round'
          stroke-linejoin='round'
          aria-hidden='true'
        >
          <rect x='2.5' y='4.5' width='15' height='11' rx='2' />
          <path d='M3 6l7 5.2L17 6' />
        </svg>
        <h2 class='redeem-thanks-closed-title' data-test='redeem-thanks-title'>
          {t('redeem-thanks.almost-title')}
        </h2>
        <p class='redeem-thanks-closed-text' data-test='redeem-thanks-text'>
          {t('redeem-thanks.almost-text')}
        </p>
        <p
          class='redeem-thanks-closed-text redeem-thanks-almost-second'
          data-test='redeem-thanks-almost-have-account'
        >
          {t('redeem-thanks.almost-have-account')}
        </p>
        <div class='redeem-thanks-onward'>
          <BButton
            variant={null}
            class='redeem-thanks-to-account'
            to={routeWithParamsAndQuery('Login')}
            data-test='redeem-thanks-almost-sign-in'
          >
            {t('signin')}
          </BButton>
        </div>
      </div>
    )

    // The link opened later: a sign, what became of the thank-you, and one sentence.
    const later = (became: NonNullable<typeof closed.value>) => (
      <div class='redeem-thanks-closed' data-test={`redeem-thanks-${became.name}`}>
        {became.name === 'accepted' ? (
          <svg
            class='redeem-thanks-sign is-accepted'
            viewBox='0 0 20 20'
            width='26'
            height='26'
            aria-hidden='true'
          >
            <path
              fill='currentColor'
              d='M10 17C5.5 13.8 3 11.4 3 8.6C3 6.4 4.7 5 6.5 5C8 5 9.2 5.9 10 7.2C10.8 5.9 12 5 13.5 5C15.3 5 17 6.4 17 8.6C17 11.4 14.5 13.8 10 17Z'
            />
          </svg>
        ) : (
          <svg
            class={['redeem-thanks-sign', `is-${became.name}`]}
            viewBox='0 0 20 20'
            width='26'
            height='26'
            fill='none'
            stroke='currentColor'
            stroke-width='1.6'
            stroke-linecap='round'
            stroke-linejoin='round'
            aria-hidden='true'
          >
            <circle cx='10' cy='10' r='7.5' />
            <path d={became.name === 'expired' ? 'M10 5.5V10l3 2' : 'M6.5 10h7'} />
          </svg>
        )}
        <h2 class='redeem-thanks-closed-title' data-test='redeem-thanks-title'>
          {became.title}
        </h2>
        <p class='redeem-thanks-closed-text' data-test='redeem-thanks-text'>
          {became.text}
        </p>
        {became.name === 'accepted' ? (
          <div class='redeem-thanks-onward'>
            <BButton
              variant={null}
              class='redeem-thanks-to-account'
              to='/overview'
              data-test='redeem-thanks-to-account'
            >
              {t('redeem-thanks.to-account')}
            </BButton>
          </div>
        ) : null}
      </div>
    )

    // What this visitor can do with the open link, under the sheet.
    const whatToDo = () => {
      if (isOwn.value) {
        return (
          <>
            <p class='redeem-thanks-own-text' data-test='redeem-thanks-own-text'>
              {t('redeem-thanks.own-text')}
            </p>
            <BLink
              class='redeem-thanks-link'
              to='/transactions'
              data-test='redeem-thanks-own-links'
            >
              {t('redeem-thanks.own-links')}
            </BLink>
          </>
        )
      }
      if (isMember.value) {
        // A member takes the thank-you with one tap; the page books it and locks the button
        // until the answer is there.
        return (
          <div class='redeem-thanks-actions'>
            <BButton
              variant={'gradido' as ButtonVariant}
              class='redeem-thanks-accept'
              disabled={props.accepting}
              data-test='redeem-thanks-accept'
              onClick={() => emit('accept')}
            >
              {t('redeem-thanks.accept')}
            </BButton>
          </div>
        )
      }
      if (isGuest.value) {
        // A guest: the same button opens the form an account is opened with, on this page;
        // under it the way in for somebody who has an account, and the invitation.
        // ⛔ No small print under the button (ZE-017, F4).
        return (
          <>
            <div class='redeem-thanks-actions'>
              <BButton
                variant={'gradido' as ButtonVariant}
                class='redeem-thanks-accept'
                data-test='redeem-thanks-accept'
                onClick={openAccountForm}
              >
                {t('redeem-thanks.accept')}
              </BButton>
            </div>
            {haveAccount()}
            <div class='redeem-thanks-invite'>
              <p class='redeem-thanks-invite-text' data-test='redeem-thanks-invite'>
                {t('redeem-thanks.invite')}
              </p>
              <BLink
                class='redeem-thanks-link'
                href={`https://gradido.net/${locale.value}`}
                target='_blank'
                rel='noopener'
                data-test='redeem-thanks-how'
              >
                {t('redeem-thanks.how')}
              </BLink>
            </div>
          </>
        )
      }
      return null
    }

    const content = () => {
      if (props.stage === 'almost') {
        return almost()
      }
      if (closed.value) {
        return later(closed.value)
      }
      if (isGuest.value && accountFormOpen.value) {
        // A guest who tapped "accept": the account is opened right here (ZE-017 F5), under the
        // same address. The form is no state of the link, so a reload shows the sheet again.
        return (
          <RedeemThanksAccount
            linkData={props.linkData}
            accepting={props.accepting}
            picture={props.picture}
            // What was typed (RedeemThanksAccountValues), handed on as it came.
            onSubmit={(typed: unknown) => emit('open-account', typed)}
          >
            {haveAccount()}
          </RedeemThanksAccount>
        )
      }
      // The link is open: the sheet, and under it what this visitor can do with it.
      return (
        <>
          {/* A link that carries a greeting says so; the sender's own keeps its sentence. */}
          <h2 class='h4 redeem-thanks-title' data-test='redeem-thanks-title'>
            {openTitle.value}
          </h2>
          <RedeemThanksPaper linkData={props.linkData} picture={props.picture} />
          {whatToDo()}
        </>
      )
    }

    return () => (
      <div class={['redeem-thanks text-center', classes['redeem-thanks']]}>{content()}</div>
    )
  },
})
