<!-- AI-GENERATED — not an architecture reference -->
<template>
  <BRow align-v="center" class="contact-row py-2" data-test="contact-row">
    <BCol cols="auto">
      <app-avatar :size="42" :color="'#fff'" v-bind="avatar" />
    </BCol>
    <BCol class="min-w-0">
      <div class="fw-bold">
        <!-- The same link the booking row has: the name leads to the send form. -->
        <name :linked-user="contact.user" font-color="text-dark" />
      </div>
      <div class="small text-muted" data-test="contact-meta">{{ meta }}</div>
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
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'

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

const { t, d } = useI18n()

// How often, and how recently -- one string, so the separator is not raw template text.
const meta = computed(
  () =>
    `${t('contacts.bookings', props.contact.bookings)} · ${t('contacts.last', {
      date: d(new Date(props.contact.lastAt), 'short'),
    })}`,
)

const avatar = computed(() => {
  const base = memberAvatarProps(props.contact.user)
  return { ...base, ...avatarZoomBindings(props.contact.user, base) }
})
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
</style>
