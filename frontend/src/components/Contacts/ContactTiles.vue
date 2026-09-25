<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div
    class="contact-tiles"
    :style="{ '--contact-tile-face': `${LIST_AVATAR_SIZE}px` }"
    data-test="contact-tiles"
  >
    <button
      v-for="row in rows"
      :key="row.key"
      type="button"
      class="contact-tile"
      :data-test="`contact-tile-${row.contact.user.gradidoID}`"
      @click="emit('open', row.contact)"
    >
      <!-- ⛔ Not zoomable here (contactDisplay's default). A zoomable avatar renders its
           own button and stops the click, so the face -- most of the tile -- would open
           the picture instead of the person, and only for members who have one. -->
      <app-avatar :size="LIST_AVATAR_SIZE" :color="'#fff'" v-bind="row.avatar" />
      <span class="contact-tile-name">{{ row.alias }}</span>
      <!-- The gold dot while a message from them waits unread: drawn on the face's upper
           corner, as the mark in the menu sits on its symbol, but standing AFTER the name in
           the button, so a screen reader says who first and then "2 new messages". -->
      <chat-unread-dot :count="row.contact.unreadChatMessages" class="contact-tile-dot" />
    </button>

    <!-- The way to everybody else. On the phone strip this is the only route to the full
         list, so it stands whether or not there is anybody in the row -- see ContactsStrip,
         which renders these tiles even when the row itself is empty. -->
    <router-link
      v-if="withAllLink"
      to="/contacts"
      class="contact-tile"
      data-test="contact-tiles-all"
    >
      <!-- The size of the faces beside it, from the same constant: a circle of its own size
           would stand out of line at the end of the row. -->
      <span
        class="contact-tile-more"
        :style="{ width: `${LIST_AVATAR_SIZE}px`, height: `${LIST_AVATAR_SIZE}px` }"
        aria-hidden="true"
      >
        <i-mdi-chevron-right />
      </span>
      <span class="contact-tile-name">{{ $t('contacts.allShort') }}</span>
    </router-link>
  </div>
</template>

<script setup>
import AppAvatar from '@/components/AppAvatar.vue'
import ChatUnreadDot from '@/components/Chat/ChatUnreadDot.vue'
import { LIST_AVATAR_SIZE } from '@/constants'

/**
 * A row of faces, sideways: the favourites, in the column and on the phone strip.
 *
 * It holds no state and asks nothing -- it is handed rows that `contactDisplay` has already
 * prepared and says which one was tapped. Both places that show favourites use it, so the
 * two cannot come to draw them differently.
 */
defineProps({
  /** Rows from `contactDisplay`: `{ contact, key, alias, avatar }`. */
  rows: { type: Array, required: true },
  /** Whether the row ends with a tile leading to the full list. */
  withAllLink: { type: Boolean, default: false },
})

const emit = defineEmits(['open'])
</script>

<style lang="scss" scoped>
/* Sideways rather than wrapping: a second line of faces in a column three of twelve wide
   pushes the list below it out of sight. */
.contact-tiles {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.contact-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 4rem;
  flex: 0 0 auto;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--bs-body-color);
  text-decoration: none;
}

.contact-tile-name {
  font-size: 0.7rem;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The face's upper right corner. The face is centred in the tile, so its right edge stands
   half a face right of the middle; the dot sits just inside it, over the empty corner of the
   circle's box. The ring is the colour of the page the tiles stand on, as around the dot on
   the phone's menu opener, so the dot stands off a photo too. */
.contact-tile-dot {
  position: absolute;
  top: 1px;
  left: calc(50% + var(--contact-tile-face) / 2 - 10px);
  box-shadow: 0 0 0 2px var(--bg, #f5f5f5);
}

.contact-tile-more {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px dashed var(--bs-border-color, #dee2e6);
  color: var(--bs-secondary-color, #6c757d);
}
</style>
