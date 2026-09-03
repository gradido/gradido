<!-- AI-GENERATED — not an architecture reference -->
<template>
  <BRow align-v="center" class="contact-row py-2" data-test="contact-row">
    <BCol cols="auto">
      <app-avatar :size="42" :color="'#fff'" v-bind="avatar" />
    </BCol>
    <BCol class="min-w-0">
      <!-- ⛔ A button, and the name inside it is no longer a link (KF-010). A tap on a
           contact opens the contact window; the send form is one of the two ways OUT of
           that window, not what a tap means any more. An anchor inside a button is invalid
           HTML with no agreed behaviour, and here it would give one word two destinations:
           the router navigating away while the window opens behind it. `Name` is told not
           to link (`:linked="false"`) rather than the click being caught out here, because
           the anchor is only ever rendered in that one component.

           The face beside it keeps what it had: where there is a picture it opens at full
           size (AS-018) and stops the click itself, so one circle keeps one meaning. Where
           there is none the circle is inert, and the name is what one taps. -->
      <button
        type="button"
        class="contact-row-open"
        data-test="contact-row-open"
        @click="emit('open', contact)"
      >
        <span class="fw-bold d-block">
          <name
            :linked-user="contact.user"
            :with-community="false"
            :linked="false"
            font-color="text-dark"
          />
        </span>
        <!-- The community in a line of its own (mockup V02) -- not behind the name, where
             the booking row puts it for a member of ANOTHER community only. -->
        <span
          v-if="contact.user.communityName"
          class="small text-muted d-block"
          data-test="contact-community"
        >
          {{ contact.user.communityName }}
        </span>
        <span class="small text-muted d-block" data-test="contact-meta">{{ meta }}</span>
      </button>
    </BCol>
    <BCol cols="auto">
      <favorite-heart :member="contact.user" />
    </BCol>
  </BRow>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BCol, BRow } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import FavoriteHeart from '@/components/FavoriteHeart.vue'
import Name from '@/components/TransactionRows/Name'
import { contactDisplay } from '@/components/Contacts/contactDisplay'

/**
 * One person in the contact list: face, name, how long and how often, and the heart.
 *
 * `contact` is what contactListQuery delivers: { user, firstAt, lastAt, bookings }. The
 * user is the booking row's shape, so face and name are drawn by the same helpers the
 * booking row uses -- the list cannot come to name somebody differently.
 */
const props = defineProps({
  contact: { type: Object, required: true },
})

// The row says which person was tapped; the LIST owns the window (one per list, not one
// per row -- the same reason the heart's confirmation is `lazy`).
const emit = defineEmits(['open'])

const { t, d } = useI18n()

// How often, and how recently -- one string, so the separator is not raw template text.
const meta = computed(
  () =>
    `${t('contacts.bookings', props.contact.bookings)} · ${t('contacts.last', {
      date: d(new Date(props.contact.lastAt), 'short'),
    })}`,
)

// Through the shared helper, so the list, the column, the strip and the window cannot come
// to draw one person four ways. The avatar stands outside the row's button here, so it may
// carry the zoom.
const avatar = computed(() => contactDisplay(props.contact, { zoomable: true }).avatar)
</script>

<style scoped>
.contact-row {
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
}

.contact-row:last-child {
  border-bottom: 0;
}

.min-w-0 {
  min-width: 0;
}

/* A button that looks like the block of text it replaced: no chrome, full width, left
   aligned -- what changes is that it is reachable by keyboard and announces itself. */
.contact-row-open {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  color: inherit;
  min-width: 0;
}
</style>
