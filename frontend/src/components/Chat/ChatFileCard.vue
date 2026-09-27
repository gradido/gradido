<!-- AI-GENERATED — not an architecture reference -->
<template>
  <a
    class="chat-file-card"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    data-test="chat-file-card"
  >
    <!-- One link, the whole card: a tap opens SwissTransfer's page for the files in a tab of its
         own, and no address of the thread goes with it. It names where it leads -- "File on
         SwissTransfer" over the address itself -- so a card never stands for a destination it
         does not show. (Inside the link, not above it: a comment beside the root would make two
         roots in development.) -->
    <span class="chat-file-card-icon" aria-hidden="true">
      <i-mdi-file-document-outline />
    </span>
    <span class="chat-file-card-text">
      <span class="chat-file-card-title">{{ t('chatThread.fileCard') }}</span>
      <span class="chat-file-card-where" data-test="chat-file-card-where">{{ where }}</span>
    </span>
    <i-mdi-open-in-new class="chat-file-card-go" aria-hidden="true" />
  </a>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { swissTransferLabel } from '@/utils/chatFileLink'

/**
 * A link to files on SwissTransfer, shown in the thread as a card in place of the address (E-042,
 * E-044): Gradido stores no files, the message carries the link, and the card says what it is.
 * ChatMessageText puts it where the link stood; `isSwissTransferLink` decides which links get one.
 *
 * ⛔ It shows only what the link itself says. Nothing is fetched from SwissTransfer before
 * somebody taps it -- no preview, no file names, no expiry date: any request would tell a third
 * party that the message was opened (Notiz 23.09. §5), and the page behind the link knows all of
 * that anyway.
 */
const props = defineProps({
  /** A link `isSwissTransferLink` accepts, as the message carries it. */
  href: { type: String, required: true },
})

const { t } = useI18n()

/** The destination the card names: the address without `https://` and `www.`. */
const where = computed(() => swissTransferLabel(props.href))
</script>

<style lang="scss" scoped>
/* A card of its own on either bubble: its own ground and rim, so it stands on the gold of one's own
   messages as on the grey of the other person's, light and dark. As wide as the bubble and never
   wider -- a block in the bubble's text, whose width the bubble sets (80% at most).

   `white-space: normal`: the bubble keeps a message's own line breaks (`pre-wrap`), which the card
   would otherwise inherit. */
.chat-file-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0.35rem 0;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 0.65rem;
  background: var(--surface, #fff);
  color: var(--bs-body-color);
  line-height: 1.3;
  text-decoration: none;
  white-space: normal;
}

.chat-file-card:hover {
  border-color: var(--gold, #c58d38);
  text-decoration: none;
}

.chat-file-card:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

/* The file, in the house gold on a quiet field. */
.chat-file-card-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.5rem;
  background: var(--surface-muted, #f2f4f6);
  color: var(--gold, #c58d38);
  font-size: 1.4rem;
}

/* ⛔ `min-width: 0`: the address stays on one line (below), and a flex item is no narrower than its
   content unless told so -- the whole address would run out of the card, the sign after it with it,
   instead of ending early. */
.chat-file-card-text {
  flex: 1 1 auto;
  min-width: 0;
}

/* ⚠️ Each text sets its own colour. The dark mode colours every link but a button in its green
   (`.dark-mode a:not(.btn)`, 0-2-1), which beats the card's own rule (0-2-0) -- inherited from the
   link, the words would be green. */
.chat-file-card-title {
  display: block;
  color: var(--bs-body-color);
  font-weight: 600;
}

/* The destination on one line; where the bubble is narrower than the address, it ends early. */
.chat-file-card-where {
  display: block;
  overflow: hidden;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* It opens elsewhere. */
.chat-file-card-go {
  flex: 0 0 auto;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--bs-secondary-color, #6c757d);
}

/* On the sheet (below `sm`, where the contact window covers the screen) a bubble is 80% of a
   phone's width, and the card's words got what was left: measured at 320 px, 88 px -- the title
   broke inside "SwissTransfer" and the address ended after "swisstransfe". There the card sets
   closer, with a smaller file sign, and leaves out the sign for "opens elsewhere": the whole card
   is the link. */
@media (width <= 575.98px) {
  .chat-file-card {
    gap: 0.5rem;
    padding: 0.45rem 0.55rem;
  }

  .chat-file-card-icon {
    width: 2rem;
    height: 2rem;
    font-size: 1.2rem;
  }

  .chat-file-card-go {
    display: none;
  }
}
</style>
