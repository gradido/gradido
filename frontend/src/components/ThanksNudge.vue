<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="thanks-nudge" role="group" :aria-labelledby="questionId" data-test="thanks-nudge">
    <!-- A quiet suggestion to thank (W2, utils/thanksNudge): the question, the way there, and
         "Nicht jetzt" -- under one's own video invitation in a conversation of two, and in the
         opened row of a thank-you received. One line for both places, so that the two look and
         behave alike. (Inside the root, not above it: a comment beside the root makes two roots in
         development, and the parent's `$el` would be the comment.)

         A group named by its question: a keyboard that comes to the first button hears what it is
         about, and not only "Danke sagen". The parent decides what happens and what the words are;
         nothing here is stored or sent. -->
    <p :id="questionId" class="thanks-nudge-question" data-test="thanks-nudge-question">
      {{ question }}
    </p>
    <div class="thanks-nudge-actions">
      <button
        type="button"
        class="thanks-nudge-yes"
        data-test="thanks-nudge-yes"
        @click="emit('yes')"
      >
        {{ yes }}
      </button>
      <button type="button" class="thanks-nudge-no" data-test="thanks-nudge-no" @click="emit('no')">
        {{ no }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useId } from 'vue'

defineProps({
  /** "Möchtest Du Dich bei … für das Gespräch bedanken?", "Dank weitergeben?" */
  question: { type: String, required: true },
  /** The way there: "Danke sagen", "Jemandem danken". */
  yes: { type: String, required: true },
  /** "Nicht jetzt". */
  no: { type: String, required: true },
})

/** `yes`: the way there was pressed. `no`: "Nicht jetzt" -- the line is not to come back. */
const emit = defineEmits(['yes', 'no'])

const questionId = `${useId()}-question`
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks, and a double slash is not a comment
   to it.

   Set apart from what stands above it by a thin line in the gold of one's own bubbles: the line
   is the wallet's word to the member, not part of the message or the booking. The question in
   the colour of the words around it, a little smaller. */
.thanks-nudge {
  margin-top: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid rgb(197 141 56 / 45%);
}

.thanks-nudge-question {
  margin: 0 0 0.35rem;
  color: inherit;
  font-size: 0.85rem;
  line-height: 1.35;
}

/* The two side by side where they fit, the second under the first where they do not. A button's
   words break inside it only where the button alone is wider than the line -- a narrow phone in a
   long language -- rather than hanging out of the bubble: no `nowrap`, as for "Gradido senden" in
   the contact window (coderabbit, #3987). */
.thanks-nudge-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.6rem;
}

/* The way there: flat, in the gold of the chat's send button and of "Gradido senden" in the
   contact window (Gold B, E-033/E-048), white words -- and narrow, as wide as its words, in the
   measure of the chat's small pills ("In den Kalender"). */
.thanks-nudge-yes {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.25rem 0.85rem;
  border: 1px solid #c08935;
  border-radius: 1rem;
  background: #c08935;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  cursor: pointer;
}

/* "Nicht jetzt": quiet, as a word to be tapped -- no frame, no ground, the muted colour of the
   time under a message; the same height as the button beside it, so the two stand on one line. */
.thanks-nudge-no {
  min-height: 2rem;
  padding: 0.25rem 0.35rem;
  border: 0;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8rem;
  line-height: 1.3;
  cursor: pointer;
}

.thanks-nudge-no:hover {
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

/* The dark mode's muted grey is too faint on a bubble (see ChatBubble's foot line): the body
   colour at three quarters there. */
.dark-mode .thanks-nudge-no {
  color: var(--bs-body-color);
  opacity: 0.75;
}

.thanks-nudge-yes:focus-visible,
.thanks-nudge-no:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
  opacity: 1;
}
</style>
