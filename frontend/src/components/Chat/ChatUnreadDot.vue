<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- A dot to the eye and a sentence to a screen reader, in ONE element: it stands inside the
       button that opens the person, so the button's name says it -- "Lena … 2 new messages" --
       and a dot without its sentence cannot come about. -->
  <span v-if="count > 0" class="chat-unread-contact-dot" data-test="chat-unread-contact-dot">
    <span class="visually-hidden">
      {{ $t('contacts.unreadChatMessages', { n: count }, count) }}
    </span>
  </span>
</template>

<script setup>
/**
 * The gold dot at a contact who wrote something not read yet (mockup V03) -- a dot and not a
 * figure: how many conversations wait is the mark in the menu, this says which person.
 *
 * The number is the server's (`Contact.unreadChatMessages`), read off the row the list
 * delivered: the wallet keeps no book of its own, it asks again when the chat's beat sees
 * something move (useChatUpdates). Nothing below 1 is drawn, and nothing about the other
 * side -- their read pointer is theirs (E-016).
 */
defineProps({
  /** Messages from this person above the member's own read pointer. */
  count: { type: Number, default: 0 },
})
</script>

<style scoped>
/* Gold B, the colour of the mark in the menu (E-032 point 5), at the size of mockup V03. */
.chat-unread-contact-dot {
  display: inline-block;
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #c08935;
}
</style>
