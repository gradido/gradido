<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div
    class="chat-message-menu"
    :class="{ 'is-mine': mine, 'is-below': below }"
    role="group"
    :aria-label="t('chatThread.menuLabel')"
    data-test="chat-message-menu"
  >
    <!-- The menu at a message (Bernd, 30.09.2026, E-059): drawn as the paperclip's menu is
         (ChatComposeBar) -- the sign in gold, the word, a quieter line under it -- over the
         message, at its side; under it where there is no room above. A group of buttons, as the
         paperclip's: Tab reaches them, Esc closes (the bubble handles it). Inside the root, not
         over it: one root element takes the bubble's listener. -->
    <!-- "Antworten" first (Bernd, 09.10.2026), at every message of the conversation: the next
         message quotes this one. -->
    <button
      v-if="canReply"
      type="button"
      class="chat-message-menu-item"
      data-test="chat-message-reply"
      @click="emit('reply')"
    >
      <i-mdi-reply-outline class="chat-message-menu-icon" aria-hidden="true" />
      <span class="chat-message-menu-words">
        <span class="chat-message-menu-label">{{ t('chatThread.reply') }}</span>
        <span class="chat-message-menu-hint">{{ t('chatThread.replyHint') }}</span>
      </span>
    </button>
    <!-- "Bearbeiten" (Bernd, 01.10.2026, E-060), at one's own message only: its text -- or, at a
         video invitation, its topic and its time. -->
    <button
      v-if="canEdit"
      type="button"
      class="chat-message-menu-item"
      data-test="chat-message-edit"
      @click="emit('edit')"
    >
      <i-mdi-pencil-outline class="chat-message-menu-icon" aria-hidden="true" />
      <span class="chat-message-menu-words">
        <span class="chat-message-menu-label">{{ t('chatThread.edit') }}</span>
        <span class="chat-message-menu-hint">
          {{ video ? t('chatThread.editVideoHint') : t('chatThread.editHint') }}
        </span>
      </span>
    </button>
    <button
      v-if="canForward"
      type="button"
      class="chat-message-menu-item"
      data-test="chat-message-forward"
      @click="emit('forward')"
    >
      <i-mdi-share-outline class="chat-message-menu-icon" aria-hidden="true" />
      <span class="chat-message-menu-words">
        <span class="chat-message-menu-label">{{ t('chatThread.forward') }}</span>
        <span class="chat-message-menu-hint">{{ t('chatThread.forwardHint') }}</span>
      </span>
    </button>
    <button
      v-if="canCopy"
      type="button"
      class="chat-message-menu-item"
      data-test="chat-message-copy"
      @click="emit('copy')"
    >
      <i-mdi-content-copy class="chat-message-menu-icon" aria-hidden="true" />
      <span class="chat-message-menu-words">
        <span class="chat-message-menu-label">{{ t('chatThread.copyText') }}</span>
        <span class="chat-message-menu-hint">{{ t('chatThread.copyTextHint') }}</span>
      </span>
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

/**
 * The entries of the menu at a message (E-059, E-060). What may be done, the bubble decides: only
 * one's own words are changed, a transfer is neither answered nor forwarded, a picture without
 * words has no text to copy.
 */
defineProps({
  /** One's own message: the menu keeps to the right, as the bubble does. */
  mine: { type: Boolean, default: false },
  /** No room above the message in the thread: the menu opens under it. */
  below: { type: Boolean, default: false },
  canReply: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
  /** The message is a video invitation: "Bearbeiten" changes its topic and its time. */
  video: { type: Boolean, default: false },
  canForward: { type: Boolean, default: false },
  canCopy: { type: Boolean, default: false },
})

const emit = defineEmits(['reply', 'edit', 'forward', 'copy'])

const { t } = useI18n()
</script>

<style scoped>
/* The paperclip's menu (ChatComposeBar), over the message -- on the menus' own grey
   (`--menu-surface`), as that one. */
.chat-message-menu {
  position: absolute;
  bottom: calc(100% + 0.35rem);
  left: 0;
  z-index: 6;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 16rem;
  max-width: 100%;
  padding: 0.35rem;
  border: 1px solid var(--menu-border, #b3bac2);
  border-radius: 0.85rem;
  background: var(--menu-surface, #dde1e6);
  box-shadow: 0 8px 28px rgb(0 0 0 / 22%);
}

.chat-message-menu.is-mine {
  right: 0;
  left: auto;
}

.chat-message-menu.is-below {
  top: calc(100% + 0.35rem);
  bottom: auto;
}

/* An entry: at least 44 px high, a finger's size -- 3rem is 48. */
.chat-message-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3rem;
  margin: 0;
  padding: 0.4rem 0.65rem;
  border: 0;
  border-radius: 0.6rem;
  background: transparent;
  color: var(--bs-body-color);
  font: inherit;
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
}

@media (hover: hover) {
  .chat-message-menu-item:hover {
    background: var(--menu-hover, #eef0f3);
  }
}

.chat-message-menu-item:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-message-menu-icon {
  flex: 0 0 auto;
  width: 1.4rem;
  height: 1.4rem;
  color: var(--menu-icon, #a8732a);
}

.chat-message-menu-words {
  min-width: 0;
}

.chat-message-menu-label {
  display: block;
  font-weight: 600;
}

.chat-message-menu-hint {
  display: block;
  color: var(--menu-text-muted, #4d555d);
  font-size: 0.8rem;
}
</style>
