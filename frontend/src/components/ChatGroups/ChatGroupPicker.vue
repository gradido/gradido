<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="chat-group-picker" data-test="chat-group-picker">
    <label class="form-label" :for="searchId">{{ t('chatGroup.pickFrom') }}</label>
    <input
      :id="searchId"
      v-model="search"
      type="search"
      class="form-control"
      :placeholder="t('chatGroup.pickSearch')"
      autocomplete="off"
      data-test="chat-group-picker-search"
    />

    <!-- Who is chosen, as small faces with their names: what the list below has ticked, at a
         glance, however far it is scrolled. Unticking in the list takes somebody out. -->
    <ul
      v-if="chosen.length"
      class="chat-group-picker-chips"
      :aria-label="t('chatGroup.pickChosen')"
      data-test="chat-group-picker-chips"
    >
      <li v-for="row in chosen" :key="row.key" class="chat-group-picker-chip">
        <app-avatar :size="CHAT_BUBBLE_FACE_SIZE" :color="'#fff'" v-bind="row.avatar" />
        <span>{{ row.alias }}</span>
      </li>
    </ul>

    <p v-if="rows.length === 0" class="chat-group-picker-none" data-test="chat-group-picker-none">
      {{ contacts.length === 0 ? t('chatGroup.pickNoContacts') : t('chatGroup.pickNoMatch') }}
    </p>

    <!-- One row a contact: the box, the face, the name, where they belong. The whole row is the
         box's label, so a tap anywhere on it ticks it. ⛔ The face is not zoomable here: a
         zoomable face is a button of its own and would swallow the tap meant for the box -- and
         only for members with a picture (contactDisplay's default).

         A contact of another community stands greyed with the reason (E-050 F2): groups across
         the border come later (P6). -->
    <ul v-else class="chat-group-picker-list" data-test="chat-group-picker-list">
      <li v-for="row in rows" :key="row.key">
        <label
          class="chat-group-pick"
          :class="{ 'is-off': row.later }"
          :data-test="`chat-group-pick-${row.contact.user.gradidoID}`"
        >
          <input
            type="checkbox"
            class="chat-group-pick-box"
            :checked="isChosen(row)"
            :disabled="row.later"
            @change="toggle(row, $event.target.checked)"
          />
          <app-avatar :size="LIST_AVATAR_SIZE" :color="'#fff'" v-bind="row.avatar" />
          <span class="chat-group-pick-words">
            <span class="chat-group-pick-name">{{ row.alias }}</span>
            <span class="chat-group-pick-sub">
              {{
                row.later
                  ? t('chatGroup.pickLater', { community: row.contact.user.communityName ?? '' })
                  : (row.contact.user.communityName ?? '')
              }}
            </span>
          </span>
        </label>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import AppAvatar from '@/components/AppAvatar.vue'
import { contactDisplay } from '@/components/Contacts/contactDisplay'
import { CHAT_BUBBLE_FACE_SIZE, LIST_AVATAR_SIZE } from '@/constants'
import { chatMemberKey } from '@/utils/chatMemberKey'

/**
 * The member's own contacts to choose from, for a new group or to take into one (P5, E-049: only
 * one's own contacts; the server checks it too). Search, a box a contact, the chosen ones as small
 * faces over the list.
 *
 * `contacts` is the contact list the page holds (contactListQuery); `excluded` the members already
 * in the group (their `user`s). `modelValue` is what is chosen: the contacts' `user`s, in the order
 * they were ticked. People are compared by the pair, without regard to case, as the server
 * compares them (chatMemberKey).
 */
const props = defineProps({
  contacts: { type: Array, required: true },
  excluded: { type: Array, default: () => [] },
  modelValue: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const searchId = `${useId()}-search`
const search = ref('')

const needle = computed(() => search.value.trim().toLowerCase())

const keyOf = (user) => chatMemberKey(user)

/** Every contact that may be offered, drawn by the helper every list uses. */
const offered = computed(() => {
  const excluded = new Set(props.excluded.map(keyOf))
  return props.contacts
    .map((contact) => ({
      ...contactDisplay(contact),
      id: keyOf(contact.user),
      // E-050 F2: another community's members come with P6.
      later: contact.homeCommunity === false,
    }))
    .filter((row) => !excluded.has(row.id))
})

const rows = computed(() =>
  offered.value.filter(
    (row) =>
      !needle.value ||
      `${row.alias} ${row.contact.user.gradidoID}`.toLowerCase().includes(needle.value),
  ),
)

const chosenKeys = computed(() => new Set(props.modelValue.map((user) => keyOf(user))))

/** The chosen ones as rows, in the order they were ticked. */
const chosen = computed(() =>
  props.modelValue
    .map((user) => offered.value.find((row) => row.id === keyOf(user)))
    .filter(Boolean),
)

const isChosen = (row) => chosenKeys.value.has(row.id)

const toggle = (row, checked) => {
  if (row.later) return
  const others = props.modelValue.filter((user) => keyOf(user) !== row.id)
  emit('update:modelValue', checked ? [...others, row.contact.user] : others)
}
</script>

<style scoped>
/* The chosen ones: small faces with their names, wrapped over as many lines as they need. */
.chat-group-picker-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.6rem 0 0;
  padding: 0;
  list-style: none;
}

.chat-group-picker-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 100%;
  padding: 0.15rem 0.6rem 0.15rem 0.15rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 1rem;
  font-size: 0.85rem;
}

/* A face keeps its size however long the name beside it: the name gives way. Measured in the
   bundle (29.09.2026): beside a name of 30 characters a row's face had shrunk to 31 px at 320 px
   and to 41 px at 390. */
.chat-group-picker-chip .app-avatar,
.chat-group-pick .app-avatar {
  flex: 0 0 auto;
}

.chat-group-picker-chip span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-group-picker-none {
  margin: 0.75rem 0 0;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.85rem;
}

.chat-group-picker-list {
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}

/* A row: the box, the face at the size of every list, the name over where they belong. The whole
   row is the box's label; at least a finger's height. */
.chat-group-pick {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3rem;
  margin: 0;
  padding: 0.35rem 0.25rem;
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
  cursor: pointer;
}

.chat-group-pick-box {
  flex: 0 0 auto;
  width: 1.15rem;
  height: 1.15rem;
  accent-color: var(--gold, #c58d38);
}

.chat-group-pick-box:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-group-pick-words {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.chat-group-pick-name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-group-pick-sub {
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8rem;
}

/* Another community's contact (E-050 F2): there, but not to be chosen yet. The box, the face and
   the name are greyed; the line that says why keeps its colour -- greyed with the rest it stood at
   2.8:1 on the dark surface (measured in the bundle, 29.09.2026). */
.chat-group-pick.is-off {
  cursor: default;
}

.chat-group-pick.is-off .chat-group-pick-box,
.chat-group-pick.is-off .app-avatar,
.chat-group-pick.is-off .chat-group-pick-name {
  opacity: 0.6;
}
</style>
