<template>
  <div class="name">
    <div class="gdd-transaction-list-item-name">
      <!-- ⛔ A button, not an anchor, and no longer a way into the send form. A tap on a
           member means "this person" wherever it happens (KF-010): in the contact list, in
           the column, and since 04.09.2026 in the booking rows and the column of newest
           bookings too. The send form is one of the two ways OUT of the window that opens,
           not what a tap means.

           ⚠️ `.stop`, because the name is a control inside another one. The booking row
           around it opens and closes the booking's details on click; without this, one tap
           did both. Held here rather than at each call site: this is the only place the
           control is rendered, so it is the only place the rule can be stated once. -->
      <button
        v-if="opensWindow"
        type="button"
        class="gdd-transaction-list-item-open"
        :class="fontColor"
        data-test="member-name-open"
        @click.stop="$emit('open', linkedUser)"
      >
        {{ itemText }}
      </button>
      <span v-else>{{ itemText }}</span>
    </div>
  </div>
</template>
<script>
import { memberAlias } from '@/utils/gradidoAddress'

export default {
  name: 'Name',
  props: {
    linkedUser: {
      type: Object,
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
      type: Number,
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
  computed: {
    // Nobody to open a window about: a row whose counterparty the backend could not
    // resolve, and the creation rows, which name the community and not a member.
    opensWindow() {
      return this.opens && Boolean(this.linkedUser?.gradidoID)
    },
    // How the wallet names a member (NU-018), plus the community they belong to.
    itemText() {
      if (!this.linkedUser) return this.text
      const alias = memberAlias(this.linkedUser.alias, this.linkedUser.gradidoID)
      return this.withCommunity && this.linkedUser.communityName
        ? alias + ' / ' + this.linkedUser.communityName
        : alias
    },
  },
}
</script>
<style scoped>
/* A 36-character gradidoID fallback must not blow up the booking row on a phone:
   clipped visually with an ellipsis, while the full value stays in the text and stays
   copyable (NU-018). Both the button and the bare span form their own line, so both need
   the clipping. */
.gdd-transaction-list-item-name,
.gdd-transaction-list-item-open {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ⛔ Looks exactly like the anchor it replaced, and that is the point rather than tidiness:
   the destination changed, the affordance must not. A name that stopped looking tappable
   would hide the window from everybody who had learnt to tap it. `font: inherit` carries
   the surrounding `fw-bold` in; the colour utilities the callers pass (`text-dark`) are
   Bootstrap's own and carry `!important`, so they win here as they did over the anchor. */
.gdd-transaction-list-item-open {
  display: block;
  max-width: 100%;
  appearance: none;
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  text-align: inherit;
  color: var(--bs-link-color, #0d6efd);
  text-decoration: underline;
  cursor: pointer;
}

.gdd-transaction-list-item-open:hover,
.gdd-transaction-list-item-open:focus-visible {
  color: var(--bs-link-hover-color, #0a58ca);
}
</style>
