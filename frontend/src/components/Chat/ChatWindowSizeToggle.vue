<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The switch between the chat window as it always was and a large one (Bernd, 12.10.2026),
       between the magnifier and the cross, in a contact's window and a group's alike.

       Its name says what a press does, and follows the state -- "enlarge" on the usual window,
       "reduce" on the large one. No `aria-pressed` beside it: a name that changes and a pressed
       state would say the same thing twice, and differently.

       Not on a phone: there the window is a sheet over the whole screen already (the
       stylesheet). -->
  <button
    type="button"
    class="chat-window-size-toggle"
    :aria-label="name"
    :title="name"
    data-test="chat-window-size"
    @click="toggleLarge"
  >
    <i-mdi-arrow-collapse v-if="large" aria-hidden="true" />
    <i-mdi-arrow-expand v-else aria-hidden="true" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChatWindowSize } from '@/composables/useChatWindowSize'

const { t } = useI18n()
const { large, toggleLarge } = useChatWindowSize()

/** Two written-out keys, not one chosen by a condition: the i18n lint counts only keys it can read. */
const name = computed(() => (large.value ? t('chatWindow.reduce') : t('chatWindow.enlarge')))
</script>

<style lang="scss" scoped>
/* Drawn as the magnifier beside it is (ContactWindow, `.contact-window-search-toggle`); the spec
   holds the two together. */
.chat-window-size-toggle {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1.15rem;
  line-height: 1;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
}

.chat-window-size-toggle:hover,
.chat-window-size-toggle:focus-visible {
  color: var(--bs-body-color);
}

/* The sheet (below `sm`, where the window is the whole screen): nothing to enlarge. */
@media (width <= 575.98px) {
  .chat-window-size-toggle {
    display: none;
  }
}
</style>

<style lang="scss">
/* The large window (E-077), for the dialog of a chat window that carries `chat-window-large`
   (ContactWindow, ChatGroupWindow). Not scoped: the dialog, its content and its body are
   BModal's own elements, and the window is teleported to the body.

   Every selector names Bootstrap's own class together with ours: on its own, ours would stand
   level with Bootstrap's rule for the same element, and which of two level rules holds is
   decided by the order the stylesheets happen to load in.

   From `sm` up only. Below it the window is a sheet over the whole screen (`fullscreen="sm"`),
   and none of this applies.

   Wide: up to 64rem -- wider, and a line of a message runs too long to read --, and never to the
   very edge of the screen: Bootstrap's dialog fills what its margins leave, and its side margins
   are `auto`, so the width keeps the dialog's own margin free on either side. */
@media (width >= 576px) {
  .modal-dialog.chat-window-large {
    max-width: min(64rem, calc(100% - var(--bs-modal-margin) * 2));
  }
}

/* High: as high as the screen lets it be, and only as high as what it holds -- a short thread
   leaves a short window. This is `modal-dialog-scrollable`'s measure; what gives way inside is
   the thread and not the body (the windows' own stylesheets), and the body scrolls only where
   even an empty thread would not fit.

   ⛔ Not on a low screen (a small window, a phone on its side). Head and compose bar take what
   they take -- some 390px with the dialog's margins --, and the thread gets the rest. The usual
   window gives its thread 45% of the screen's height: below about 700px the thread of the
   "large" window would be the LOWER one. There the large window is wide only, and the thread
   keeps the cap it always had.

   And the pictures of the messages stand higher here (ChatBubbleImage, Bernd 17.10.2026): as
   high as a greeting's picture at the window's full width -- 34rem; it is 767 x 533 px there --,
   but no higher than the thread can show it whole with a line of caption and the time under it
   (55px, and the 4px around a message): the thread is the screen's height less 383px in a
   contact's window (measured from 720 to 1200px high) and 3px less in a group's, so 29rem come
   off, with a little air. And never lower than in the usual window, 22rem -- on a screen under
   816px high that is the higher of the two, as it always was.

   ⛔ vh, not dvh. A custom property takes any value, so an engine without dvh would not drop the
   line, as it drops a plain one (the pair of vh and dvh in ChatThread): the picture would lose its
   whole measure where it reads the property. At a desk, where this applies, the two are alike;
   on a tablet they differ by the browser's own bar. */
@media (width >= 576px) and (height >= 704px) {
  .modal-dialog.chat-window-large {
    --chat-image-height: clamp(22rem, 100vh - 29rem, 34rem);

    height: calc(100% - var(--bs-modal-margin) * 2);
  }

  .modal-dialog.chat-window-large > .modal-content {
    max-height: 100%;
    overflow: hidden;
  }

  .modal-dialog.chat-window-large > .modal-content > .modal-body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
