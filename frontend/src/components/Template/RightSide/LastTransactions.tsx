// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
// ⚠️ The real `BAvatar`, in the tests too: the gift square is measured at what the real
// component makes of `rounded` and `variant`, so no spec of this column stubs it. (As a .vue
// file this had to import it by hand for that -- the build auto-imported it, vitest did not.)
import { BAvatar, BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { AppAvatar } from '@/components/AppAvatar'
import { ContactWindow } from '@/components/Contacts/ContactWindow'
import { FavoriteHeart } from '@/components/FavoriteHeart'
import MemoText from '@/components/TransactionRows/MemoText'
import { Name } from '@/components/TransactionRows/Name'
import { VariantIcon } from '@/components/VariantIcon'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { useContactWindow } from '@/composables/useContactWindow'
import { useFilters } from '@/composables/useFilters'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { LAST_TRANSACTIONS_ROWS, LIST_AVATAR_SIZE } from '@/constants'
import { useWalletStore } from '@/store/useWalletStore'
import { memberAlias } from '@/utils/gradidoAddress'
import classes from './LastTransactions.module.scss'

/** The counterparty of a booking, as far as this column reads them. */
type LinkedUser = {
  gradidoID?: string | null
  alias?: string | null
  communityUuid?: string | null
  communityName?: string | null
}

/** A row of `transactionList`, as far as this column reads it. */
type Booking = {
  id: number
  typeId: string
  amount: string | number
  balanceDate: string
  memo?: string | null
  // null where the backend could not resolve the counterparty
  linkedUser: LinkedUser | null
}

export const LastTransactions = defineComponent({
  name: 'LastTransactions',
  props: {
    transactions: {
      default: () => [],
      type: Array as PropType<Booking[]>,
    },
  },
  setup(props) {
    const { t, d } = useI18n()
    const { signedAmount } = useFilters()
    const router = useRouter()
    const route = useRoute()
    const store = useWalletStore()
    const { client: apolloClient } = useApolloClient()

    /**
     * The contact window this column opens, and the lookup that fills in its three figures.
     *
     * A booking row names a member; how many bookings there were with them, and since when, is
     * a grouping over all of them -- see useContactWindow.openMember.
     */
    const { windowOpen, selected, openMember } = useContactWindow(apolloClient)

    const handleRedirect = (id: number) => {
      store.changeTransactionToHighlightId(id)
      if (route.name !== 'Transactions') {
        router.replace({ name: 'Transactions' })
      }
    }

    // The avatar is worked out once per row, in a computed, rather than by calling helpers from
    // the template. Two reasons, and both bit here before:
    //
    //   * the letters and the colour seed have to come from ONE call, or a later edit can leave
    //     them describing different members. Calling the helper once per prop is exactly the
    //     split it exists to prevent.
    //   * `memberAvatarProps` reads the picture store, which is reactive. Called from the
    //     template it makes the whole list re-render on every change to any member's picture and
    //     rebuild eight ~11 KB data URIs; behind a computed, an unchanged value stops there.
    //
    // `linkedUser` may be null -- a booking whose counterparty the backend could not resolve --
    // and everything downstream of here is written for that.
    const rows = computed(() =>
      props.transactions
        // The two rows the backend puts on top of page one and this column does not show: the
        // decay of the member's own balance, and the summary of their open links. Both are
        // about the whole account rather than a booking, and neither has a memo.
        //
        // ⛔ Creations DO stand here, since 12.09.2026. They are bookings like any other, and
        // dropping them made "the newest bookings" a list with holes in it -- a member who had
        // just been given a creation found it missing from the column beside the overview.
        .filter(
          (transaction) => transaction.typeId !== 'DECAY' && transaction.typeId !== 'LINK_SUMMARY',
        )
        // ⚠️ The fetch that feeds this is sized in `constants.js` and must never be smaller than
        // this cut, or the column simply shows fewer rows than it means to. Since 21.09.2026 it
        // is larger (eight fetched, five shown) -- see the constant.
        .slice(0, LAST_TRANSACTIONS_ROWS)
        .map((transaction) => {
          const isCreation = transaction.typeId === 'CREATION'
          const avatar = isCreation ? null : memberAvatarProps(transaction.linkedUser)
          return {
            transaction,
            isCreation,
            // ⛔ Worked out here, once per row, rather than from `linkedUser.gradidoID` in the
            // template: a creation is linked to the community's STAND-IN, and that stand-in
            // carries a gradidoID like any member. Asking the field would put a heart beside
            // every creation and let a member mark the community as a favourite. Same
            // condition, same reason, as `hasCounterparty` in the booking list.
            hasCounterparty: !isCreation && Boolean(transaction.linkedUser?.gradidoID),
            // The COMMUNITY's name (NU-020) -- a creation is approved by a moderator, but it
            // is the community that gives, and the backend swaps its stand-in in for exactly
            // that reason. `memberAlias` falls back to the gradidoID, as everywhere else.
            communityName: isCreation
              ? memberAlias(transaction.linkedUser?.alias, transaction.linkedUser?.gradidoID)
              : '',
            // The member's community, for the line under the name. Not on a creation, whose name
            // line is the community's already.
            memberCommunity: isCreation ? '' : (transaction.linkedUser?.communityName ?? ''),
            // Spread into one object, so the template still binds a single `row.avatar`. The
            // zoom half is empty for a member without a picture, which leaves that circle
            // exactly as it was (AS-018). A creation has no face at all, so nothing is worked
            // out for it -- not even the letters of the community's name.
            avatar:
              isCreation || avatar === null
                ? null
                : { ...avatar, ...avatarZoomBindings(transaction.linkedUser, avatar) },
          }
        }),
    )

    return () => (
      <div
        class={[
          'rightside-last-transactions d-none d-lg-block',
          classes['rightside-last-transactions'],
        ]}
      >
        {/* ⛔ The column's name, for a screen reader only. The switch above carries it on
            screen, but a group of pressed buttons is not a heading: the "next heading" jump
            has nothing to land on, so the column had no title to navigate to.

            ⚠️ It is not a heading that was lost here -- the markup this replaced was
            `<BCol class="h3">`, and `h3` is a Bootstrap STYLING class on a div
            (`tag: { default: 'div' }`), so the jump never found it either. This adds what was
            never there, rather than restoring something. (coderabbit, PR #3837.)

            ⚠️ `visually-hidden` is Bootstrap's own and ships in the stylesheet (verified in
            the built CSS); it clips the element instead of hiding it, so the text stays
            readable to assistive technology. `d-none` would take it away from that too. */}
        <h2 class='visually-hidden'>{t('transaction.lastTransactions')}</h2>

        {/* ⛔ ONE row per booking, three columns: face, text, heart. It used to be a row inside
            a row, with the heart in the inner one -- and that nesting is both halves of what
            was reported on 04.09.2026. A nested `.row` carries its own negative margins, so
            the heart sat 7 points OUTSIDE this column's right edge whenever it did stay up;
            and being in a second row is what let it wrap away from the booking it belongs to.
            (Measured in a browser on this component's own rendered markup against the built
            Bootstrap, at column widths from 220 to 340 points.) */}
        {rows.value.map((row) => (
          <BRow key={row.transaction.id} alignV='center' class='g-0 last-transactions-row'>
            <BCol cols='auto'>
              {row.isCreation ? (
                // A creation has no face, because there is no person on the other side: the
                // community is. The gift square is the booking list's own (GddTransaction), at
                // the size every face in this column has.
                <BAvatar
                  size={LIST_AVATAR_SIZE}
                  rounded='lg'
                  variant='success'
                  data-test='creation-gift'
                >
                  <VariantIcon icon='gift' variant='white' />
                </BAvatar>
              ) : (
                // The size every list of people in the wallet uses, the contacts in the other
                // position of the switch above included. See the constant for why 48.
                <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...row.avatar} />
              )}
            </BCol>
            <BCol class='min-w-0'>
              {/* The name opens the contact window (KF-010), the same one the contact list
                  opens -- it is not a way into the send form any more, here as little as
                  anywhere else. The button under it still leads to the booking itself, so the
                  two things this row can mean stay two controls. */}
              <div class='fw-bold last-transactions-name'>
                {/* ⛔ A creation's name is NOT handed to `Name`, and not because of the words it
                    would print. `Name` makes itself a button wherever it is given a member with
                    a gradidoID -- and the community's stand-in carries one
                    (backend/src/util/communityUser.ts), so it would offer a contact window about
                    "the community". The booking list keeps the two apart in the same way. */}
                {row.isCreation ? (
                  <span class='last-transactions-community'>{row.communityName}</span>
                ) : (
                  <Name
                    linkedUser={row.transaction.linkedUser}
                    withCommunity={false}
                    fontColor='text-dark'
                    onOpen={openMember}
                  />
                )}
              </div>
              {/* The community on a line of its own, small and thin, as the contacts in the other
                  position of the switch have it -- no longer behind the name after a slash
                  (Bernd, 21.09.2026). A creation names the community already, one line up. The
                  line costs height, which is why the column shows five bookings now
                  (LAST_TRANSACTIONS_ROWS). */}
              {row.memberCommunity ? (
                <div
                  class='last-transactions-member-community'
                  data-test='last-transactions-community'
                >
                  {row.memberCommunity}
                </div>
              ) : null}
              <button
                class='transaction-details-link d-flex'
                role='link'
                data-href={`/transactions#transaction-${row.transaction.id}`}
                onClick={() => handleRedirect(row.transaction.id)}
              >
                {/* ⛔ No currency here, unlike everywhere else in the wallet. This column
                    is three of twelve wide, and `− 45,00 GDD` broke over two lines as soon
                    as the window narrowed -- while every amount in this list is in GDD, so
                    the unit was saying nothing and costing exactly the width that made it
                    wrap.

                    ⛔ The sign stays, and it carries this ALONE in light mode. The first
                    version of this note said "together with the colour" -- but
                    `.received-amount` has exactly one rule in the whole project, under
                    `.dark-mode`, so in light mode there is no colour signal at all. Whoever
                    next thinks the plus is noise should know that removing it leaves
                    nothing. (Bernd, 27.08.2026) */}
                <span
                  class={[
                    'transaction-amount',
                    { 'received-amount': Number(row.transaction.amount) > 0 },
                  ]}
                >
                  {signedAmount(row.transaction.amount)}
                </span>
                {/* ⚠️ The gap to the amount is a `column-gap` on the button, not a margin here:
                    where this line has to wrap, a margin would leave the date indented under
                    nothing. */}
                <span class='text-end'>{d(new Date(row.transaction.balanceDate), 'short')}</span>
              </button>
              {/* ⛔ The memo's first line, readable without leaving the overview -- the booking
                  list has shown it in its rows since 11.09.2026, and this column is the same
                  list in short. No heading over it: the italics and the muted colour say what it
                  is. A tap leads to the booking, as the line above does, and there the whole
                  memo stands.

                  Never as markup (`innerHTML`): a memo is written by the OTHER side of the
                  booking. `MemoText` cuts it into text and addresses and renders both through
                  Vue, which escapes them (see utils/memoParts). A link inside it keeps its own
                  click, so following it does not also navigate. */}
              {row.transaction.memo ? (
                <div
                  class='last-transactions-memo'
                  data-test='last-transactions-memo'
                  onClick={() => handleRedirect(row.transaction.id)}
                >
                  <MemoText memo={row.transaction.memo} />
                </div>
              ) : null}
            </BCol>
            {/* The heart at the row's end (KF-005), where there is somebody to mark. A creation
                names the community's stand-in, which carries a gradidoID like any member -- so
                "has a counterparty" is worked out in `rows` above and not from that field. */}
            {row.hasCounterparty ? (
              <BCol cols='auto'>
                {/* `hasCounterparty` says the member is there and carries a gradidoID */}
                <FavoriteHeart
                  member={row.transaction.linkedUser as LinkedUser & { gradidoID: string }}
                />
              </BCol>
            ) : null}
          </BRow>
        ))}

        {/* ONE window for the whole column, as every other list has one. */}
        <ContactWindow
          modelValue={windowOpen.value}
          contact={selected.value}
          onUpdate:modelValue={(value: boolean) => {
            windowOpen.value = value
          }}
        />
      </div>
    )
  },
})
