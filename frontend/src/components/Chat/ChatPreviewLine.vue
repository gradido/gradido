<!-- AI-GENERATED — not an architecture reference -->
<template>
  <span
    class="chat-preview-line small d-block"
    :class="unread ? 'fw-semibold' : 'text-muted'"
    data-test="chat-preview-line"
  >
    <!-- One line, cut off where it ends, in the size and colour of the lines around it -- dark and
         bold while what it shows waits unread. The name and the words are two pieces with a space
         IN the first: Vue drops the space between two elements, and a screen reader would hear
         the two run together. (Inside the line, not over it: a comment at the top would make the
         component a fragment, and the classes the row hands it would have nowhere to go.) -->
    <span v-if="line.by" class="chat-preview-line-by" data-test="chat-preview-by">
      {{ `${t('chatPreview.by', { name: line.by })} ` }}
    </span>
    <i-mdi-image-outline
      v-if="line.picture"
      class="chat-preview-line-icon"
      aria-hidden="true"
      data-test="chat-preview-picture"
    />
    <span data-test="chat-preview-text">{{ line.text }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { chatPreviewLine } from '@/utils/chatPreview'

/**
 * The line under a name on "Kontakte & Chat" (E-083, Bernd, 23.10.2026): the beginning of the
 * latest message -- or, with a person, of the latest booking, where that came later --, so that
 * one sees at once what was last said. "Du: Danke, bis morgen!", "Elfi: Morgen um zehn?",
 * "20,00 GDD · Danke für Deine Hilfe".
 *
 * `preview` is a ChatPreview of the contact list or of the list of groups; `unread` whether it
 * waits unread for the member -- the row knows, from its own count.
 */
const props = defineProps({
  preview: { type: Object, required: true },
  unread: { type: Boolean, default: false },
})

const { t, n } = useI18n()

const line = computed(() => chatPreviewLine(props.preview, { t, n }))
</script>

<style scoped>
/* One line, whatever the length: cut with an ellipsis, as a group's long name is cut. ⛔ And
   `contain: inline-size`, so that the length of the words never becomes the width the row asks
   for -- a line kept on one line otherwise widens every flex box up to the page (the memo of a
   booking row, #3884). */
.chat-preview-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  contain: inline-size;
}

/* The picture's sign in front of the words, as the quotation over an answer has it. */
.chat-preview-line-icon {
  width: 1.05em;
  height: 1.05em;
  margin-inline-end: 0.25em;
  vertical-align: -0.15em;
}
</style>
