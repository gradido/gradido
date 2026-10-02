<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="redeem-thanks-paper" data-test="redeem-thanks-paper">
    <!-- The picture of a thank-you greeting stands here; a plain link has none, and then the
         sheet holds the words alone. -->
    <slot name="picture" />
    <div class="redeem-thanks-paper-text">
      <!-- The words somebody else wrote: as text, never as markup. -->
      <div class="redeem-thanks-paper-message" data-test="redeem-thanks-paper-message">
        {{ linkData.memo }}
      </div>
      <div class="redeem-thanks-paper-rule"></div>
      <div class="redeem-thanks-paper-sender">
        <span class="redeem-thanks-paper-initial" aria-hidden="true">{{ initial }}</span>
        <!-- One sentence with two bold parts, and the ten languages put them in different
             places: through <i18n-t> with slots, not by cutting the sentence around them. The
             amount takes its unit along, so both stand bold as one. -->
        <i18n-t
          keypath="redeem-thanks.from"
          tag="span"
          scope="global"
          class="redeem-thanks-paper-from"
          data-test="redeem-thanks-paper-from"
        >
          <template #name>
            <b>{{ senderName }}</b>
          </template>
          <template #amount>
            <b class="redeem-thanks-paper-amount">
              {{ amountInText(linkData.amount) }} {{ $t('GDD-long') }}
            </b>
          </template>
        </i18n-t>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * The sheet a thank-you arrives on: the words, a fine line, and who thanks with how much.
 *
 * The sender stands under their user name, never under their real name (NU-021): the redeem
 * page is the one place somebody who is not signed in sees a sender at all. `memberAlias` is
 * how the wallet names a member everywhere, the fallback for a member without a user name
 * included.
 *
 * The amount is written as the text that carried the link says it (`gdd_per_link.share-line1`):
 * the number with the decimal mark of the reader's language, then "Gradido". Both go through
 * `useAmountInText`, so whoever taps the link reads the same figure on the sheet as in the
 * message it came in.
 */
import { computed } from 'vue'
import { useAmountInText } from '@/composables/useAmountInText'
import { memberAlias } from '@/utils/gradidoAddress'

const props = defineProps({
  linkData: { type: Object, required: true },
})

const amountInText = useAmountInText()

const senderName = computed(() =>
  memberAlias(props.linkData.senderUser?.alias, props.linkData.senderUser?.gradidoID),
)

// By code point, not by code unit: the first letter whole, whatever it is.
const initial = computed(() => (Array.from(senderName.value)[0] ?? '').toUpperCase())
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it.

   ⛔ The sheet stays light in dark mode, on purpose: it is paper, and paper lying on a dark
   table is still cream. So every colour here is written out and none follows the theme --
   no token, no Bootstrap variable, nothing inherited. That is also why nothing in it is a
   card, a heading, a link or a rule: the dark sheet repaints all four
   (gradido-template-dark.scss), and the text colour a dark page hands down is near white.

   The sizes are in em, of the card's own size: the "Aa" control of the layout sets that one,
   and the words on the sheet grow with it. At the usual 16px they come to 15px and 13.5px. */
.redeem-thanks-paper {
  overflow: hidden;
  border-radius: 14px;
  background: #fffdf8;
  box-shadow: 0 8px 24px rgb(90 70 30 / 16%);
  text-align: left;
}

.redeem-thanks-paper-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px 16px;
}

/* The lines the sender wrote are kept as lines, and a word longer than the sheet breaks
   instead of pushing the sheet wider than the phone. */
.redeem-thanks-paper-message {
  color: #4a4a4a;
  font-size: 0.9375em;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.redeem-thanks-paper-rule {
  height: 1px;
  background: #ecdfc2;
}

.redeem-thanks-paper-sender {
  display: flex;
  gap: 9px;
  align-items: center;
}

.redeem-thanks-paper-initial {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #8a6124;
  color: #fffdf8;
  font-size: 13px;
  font-weight: 700;
}

.redeem-thanks-paper-from {
  min-width: 0;
  color: #383838;
  font-size: 0.8438em;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

/* The figure and its unit stay on one line: with a long name the sentence broke between
   "20" and "Gradido". A short run, far narrower than the sheet on any phone. */
.redeem-thanks-paper-amount {
  white-space: nowrap;
}
</style>
