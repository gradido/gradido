<!-- AI-GENERATED — not an architecture reference -->
<template>
  <BRow align-v="center" class="chat-group-row py-2" data-test="chat-group-row">
    <BCol cols="auto">
      <!-- The group's square (E-050 F3): its letters, never a picture, so nothing to zoom. -->
      <app-avatar :size="LIST_AVATAR_SIZE" :color="'#fff'" v-bind="avatar" />
    </BCol>
    <BCol class="min-w-0">
      <!-- The whole text is one button, as in the contact row (KF-010): a tap opens the group's
           window. The gold dot stands inside it, so its sentence becomes part of the button's
           name ("Gradido-Café Berlin … 2 neue Nachrichten"). -->
      <button
        type="button"
        class="chat-group-row-open"
        data-test="chat-group-row-open"
        @click="emit('open', group)"
      >
        <span class="chat-group-row-text">
          <span class="chat-group-row-title fw-bold d-block" data-test="chat-group-title">
            {{ group.title }}
          </span>
          <!-- The community in a line of its own, as the contact row has it (E-026: in P5 the
               group's and every member's). -->
          <span
            v-if="group.communityName"
            class="small text-muted d-block"
            data-test="chat-group-community"
          >
            {{ group.communityName }}
          </span>
          <span class="small text-muted d-block" data-test="chat-group-meta">{{ meta }}</span>
        </span>
        <!-- What waits unread for the member -- also in a muted group: muting holds back the
             mails, not the messages, and the mark in the menu counts it too (E-024). -->
        <chat-unread-dot :count="group.unreadMessages" class="ms-2" />
      </button>
    </BCol>
    <!-- Where a contact has its heart: the crossed bell of a group the member muted (E-024), a
         mark and not a control -- the bell to switch it is in the group's window. -->
    <BCol cols="auto" class="chat-group-row-end">
      <span
        v-if="group.mutedByMe"
        class="chat-group-row-muted"
        role="img"
        :aria-label="t('chatGroup.muted')"
        :title="t('chatGroup.muted')"
        data-test="chat-group-muted"
      >
        <i-mdi-bell-off-outline aria-hidden="true" />
      </span>
    </BCol>
  </BRow>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BCol, BRow } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatUnreadDot from '@/components/Chat/ChatUnreadDot.vue'
import { chatGroupAvatar, chatGroupMeta } from '@/components/ChatGroups/chatGroupDisplay'
import { LIST_AVATAR_SIZE } from '@/constants'

/**
 * One chat group (P5) in the list on "Kontakte & Chat": its square, its name, its community, how
 * many are in it and when the latest message came -- the gold dot while one waits unread, the
 * crossed bell where the member muted it.
 *
 * `group` is one of `chatGroupsQuery` (graphql/chatGroups.graphql). The row says which group was
 * tapped; the page owns the window, as it does for the contacts.
 */
const props = defineProps({
  group: { type: Object, required: true },
})

const emit = defineEmits(['open'])

const { t, d } = useI18n()

const avatar = computed(() => chatGroupAvatar(props.group))
const meta = computed(() => chatGroupMeta(props.group, { t, d }))
</script>

<style scoped>
/* The contact row's measure and lines (ContactRow), so the two lists read as one. */
.chat-group-row {
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
}

.chat-group-row:last-child {
  border-bottom: 0;
}

.min-w-0 {
  min-width: 0;
}

.chat-group-row-open {
  display: flex;
  align-items: center;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  color: inherit;
  min-width: 0;
}

.chat-group-row-text {
  display: block;
  flex: 1;
  min-width: 0;
}

/* One line, however long the name (the server allows 100 characters): cut with an ellipsis, as
   the contact row cuts a long name. Every box up to the row lets it shrink (`min-width: 0`). */
.chat-group-row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The end of the row keeps the heart's room where a contact has one, so the dots of the two
   lists stand in one line. */
.chat-group-row-end {
  min-width: 2.25rem;
  text-align: center;
}

.chat-group-row-muted {
  display: inline-flex;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1.2rem;
}
</style>
