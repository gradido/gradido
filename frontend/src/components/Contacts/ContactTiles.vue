<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="contact-tiles" data-test="contact-tiles">
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
      <app-avatar :size="44" :color="'#fff'" v-bind="row.avatar" />
      <span class="contact-tile-name">{{ row.alias }}</span>
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
      <span class="contact-tile-more" aria-hidden="true">
        <i-mdi-chevron-right />
      </span>
      <span class="contact-tile-name">{{ $t('contacts.allShort') }}</span>
    </router-link>
  </div>
</template>

<script setup>
import AppAvatar from '@/components/AppAvatar.vue'

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

.contact-tile-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px dashed var(--bs-border-color, #dee2e6);
  color: var(--bs-secondary-color, #6c757d);
}
</style>
