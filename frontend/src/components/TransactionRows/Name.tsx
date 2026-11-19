// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType, withModifiers } from 'vue'
import { memberAlias } from '@/utils/gradidoAddress'
import classes from './Name.module.scss'

/** What this component reads of the member a row is about. */
export type LinkedUser = {
  alias?: string | null
  gradidoID?: string | null
  communityName?: string | null
}

export const Name = defineComponent({
  name: 'Name',
  props: {
    linkedUser: {
      type: Object as PropType<LinkedUser | null>,
      required: false,
    },
    text: {
      type: String,
      required: false,
    },
    fontColor: {
      type: String,
      required: false,
      default: '',
    },
    linkId: {
      type: Number as PropType<number | null>,
      required: false,
      default: null,
    },
    /**
     * Whether the community goes behind the name, after a slash. True everywhere it has
     * always been -- in a booking row that suffix is what marks a member of ANOTHER
     * community. The contact list gives the community a line of its own instead (mockup
     * V02) and switches it off here, rather than handing this component a doctored user.
     */
    withCommunity: {
      type: Boolean,
      required: false,
      default: true,
    },
    /**
     * Whether the name is the control that opens this member's contact window.
     *
     * ⛔ False where the ROW itself already is that control: in the contact list and in the
     * contacts column a tap anywhere on the row opens the window. A button inside a button
     * is invalid HTML with no agreed behaviour, and it would make the row's accessible name
     * the sum of two controls.
     *
     * True everywhere the row means something else -- a booking row toggles its details,
     * and the column of newest bookings has its own link to the booking -- so there the
     * name has to be its own control.
     */
    opens: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  emits: ['open'],
  setup(props, { emit }) {
    // Nobody to open a window about: a row whose counterparty the backend could not
    // resolve.
    //
    // ⛔ NOT the creation rows, although they name a community rather than a member: the
    // stand-in the backend links them to carries a gradidoID like anybody else
    // (backend/src/util/communityUser.ts), so this condition says yes for them. Both lists
    // that show creations keep them away from this component instead, and print the
    // community's name as plain text (GddTransaction, RightSide/LastTransactions).
    const opensWindow = computed(() => props.opens && Boolean(props.linkedUser?.gradidoID))
    // How the wallet names a member (NU-018), plus the community they belong to.
    const itemText = computed(() => {
      if (!props.linkedUser) {
        return props.text
      }
      const alias = memberAlias(props.linkedUser.alias, props.linkedUser.gradidoID)
      return props.withCommunity && props.linkedUser.communityName
        ? alias + ' / ' + props.linkedUser.communityName
        : alias
    })

    return () => (
      <div class={['name', classes.name]}>
        <div class='gdd-transaction-list-item-name'>
          {/* ⛔ A button, not an anchor, and no longer a way into the send form. A tap on a
              member means "this person" wherever it happens (KF-010): in the contact list, in
              the column, and since 04.09.2026 in the booking rows and the column of newest
              bookings too. The send form is one of the two ways OUT of the window that opens,
              not what a tap means.

              ⚠️ `.stop`, because the name is a control inside another one. The booking row
              around it opens and closes the booking's details on click; without this, one tap
              did both. Held here rather than at each call site: this is the only place the
              control is rendered, so it is the only place the rule can be stated once. */}
          {opensWindow.value ? (
            <button
              type='button'
              class={['gdd-transaction-list-item-open', props.fontColor]}
              data-test='member-name-open'
              onClick={withModifiers(() => emit('open', props.linkedUser), ['stop'])}
            >
              {itemText.value}
            </button>
          ) : (
            <span>{itemText.value}</span>
          )}
        </div>
      </div>
    )
  },
})
