<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="redeem-thanks-paper" data-test="redeem-thanks-paper">
    <!-- The picture of a thank-you greeting stands here; a plain link has none, and then the
         sheet holds the words alone. The room is 36 : 25 and stands before the picture has
         come, so nothing under it moves when it does.
         ⛔ An <img>, never the SVG inlined: the motifs share the ids of their gradients. -->
    <slot name="picture">
      <div v-if="motif" class="redeem-thanks-paper-picture">
        <img
          :src="motif.src"
          :alt="motif.name"
          :width="THANK_YOU_MOTIF_WIDTH"
          :height="THANK_YOU_MOTIF_HEIGHT"
          data-test="redeem-thanks-paper-motif"
        />
      </div>
    </slot>
    <div class="redeem-thanks-paper-text" :class="{ 'is-greeting': greeting }">
      <!-- A greeting names whom it is for, and sets its first line in handwriting. Both are
           what somebody else wrote: as text, never as markup. -->
      <div v-if="forWhom" class="redeem-thanks-paper-for" data-test="redeem-thanks-paper-for">
        {{ forWhom }}
      </div>
      <div
        v-if="parts.line"
        class="redeem-thanks-paper-line"
        :class="{ 'is-by-hand': byHand }"
        data-test="redeem-thanks-paper-line"
      >
        {{ parts.line }}
      </div>
      <!-- The words somebody else wrote: as text, never as markup. Under a line they are the
           memo without it; a greeting of a line alone has none, and no empty block. -->
      <div
        v-if="parts.words && !short"
        class="redeem-thanks-paper-message"
        :class="{ 'is-under-line': parts.line }"
        data-test="redeem-thanks-paper-message"
      >
        {{ parts.words }}
      </div>
      <!-- The short sheet ends here: what was just accepted, without the words that were read
           a moment ago and without the sentence the page now says itself. -->
      <template v-if="!short">
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
      </template>
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
 *
 * A thank-you greeting (`linkData.greeting`) is the same sheet with three things more: its
 * motif above the words, "FÜR {NAME}", and its first line in handwriting -- the memo without
 * that line under it. One sheet for the page a link opens as and for the last look before a
 * greeting is made, so the two cannot drift apart. Without a greeting it is the sheet it was.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
// The face of the handwriting: declared once for every place that sets a line in it.
import '@/assets/fonts/caveat/caveat.css'
import { useAmountInText } from '@/composables/useAmountInText'
import { memberAlias } from '@/utils/gradidoAddress'
import { canWriteByHand } from '@/utils/handwriting'
import { greetingParts } from '@/utils/thankYouGreeting'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'

const props = defineProps({
  linkData: { type: Object, required: true },
  // Only the picture, whom it is for and the line: the sheet as a keepsake right after the
  // thank-you was accepted ("Dein Dank ist da."), with both buttons under it on one screen.
  short: { type: Boolean, default: false },
})

const { t, locale } = useI18n()
const amountInText = useAmountInText()

const greeting = computed(() => props.linkData.greeting ?? null)

// No picture for a motif this wallet does not know, and none where a greeting has no motif.
const motif = computed(() => thankYouMotif(greeting.value?.motif, t))

// In capitals, by the rules of the language the page is in: Turkish "için" is "İÇİN", and
// Greek capitals carry no accent. `text-transform` would follow the `lang` of the document,
// which is not the wallet's language.
const forWhom = computed(() =>
  greeting.value?.recipientName
    ? t('thank-you-greeting.for', { name: greeting.value.recipientName }).toLocaleUpperCase(
        locale.value,
      )
    : '',
)

// The line and, apart from it, the words. Where the memo does not begin with the line, the
// memo stands whole and no line above it (greetingParts).
const parts = computed(() => greetingParts(props.linkData.memo, greeting.value?.line))

// The LINE decides, not the language of the page: one letter the handwriting lacks -- it has
// no Greek -- and the whole line is set in the page's font. Never mixed.
const byHand = computed(() => canWriteByHand(parts.value.line))

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

/* The room of the picture: the motifs are 360 x 250. A ground of their own colour until the
   file is there; the picture fills the room whole. */
.redeem-thanks-paper-picture {
  aspect-ratio: 36 / 25;
  background: #fbf3de;

  img {
    display: block;
    width: 100%;
    height: 100%;
  }
}

/* A greeting sits a little closer: three kinds of text above the line instead of one. */
.redeem-thanks-paper-text.is-greeting {
  gap: 8px;
  padding-top: 14px;
}

/* "FÜR SARAH": small, bold, spaced -- 11.5px at the usual 16. */
.redeem-thanks-paper-for {
  color: #8a6124;
  font-size: 0.7188em;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.08em;
  overflow-wrap: anywhere;
}

/* The first line. As it stands here it is the line with a letter the handwriting lacks: all of
   it in the page's font -- no family is named, so it is the page's -- italic, in the colour of
   the handwriting. 20px at the usual 16: the handwriting is a small face for its size, and
   20px here reads about as large as 27px there. */
.redeem-thanks-paper-line {
  color: #8a6124;
  font-size: 1.25em;
  font-style: italic;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

/* In handwriting, which is the usual case: 27px at the usual 16. Until the file is there, and
   for a character it lacks, the line stands upright in Open Sans, as the page's own text does. */
.redeem-thanks-paper-line.is-by-hand {
  font-family: Caveat, 'Open Sans', sans-serif;
  font-size: 1.6875em;
  font-style: normal;
  font-weight: 600;
  line-height: 1.1;
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

/* Under a line the words step back a little: 13.5px at the usual 16. */
.redeem-thanks-paper-message.is-under-line {
  font-size: 0.8438em;
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
