<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="chat-group-picker" data-test="chat-group-picker">
    <label class="form-label" :for="searchId">{{ label || t('chatGroup.pickFrom') }}</label>
    <input
      :id="searchId"
      v-model="search"
      type="search"
      class="form-control"
      :placeholder="placeholder || t('chatGroup.pickSearch')"
      autocomplete="off"
      data-test="chat-group-picker-search"
    />

    <!-- Who is chosen, as small faces with their names: what the list below has ticked, at a
         glance, however far it is scrolled. Unticking in the list takes somebody out. -->
    <ul
      v-if="chosen.length || chosenGroupRows.length"
      class="chat-group-picker-chips"
      :aria-label="t('chatGroup.pickChosen')"
      data-test="chat-group-picker-chips"
    >
      <li v-for="row in chosenGroupRows" :key="row.uuid" class="chat-group-picker-chip">
        <app-avatar :size="SMALL_FACE_SIZE" :color="'#fff'" v-bind="row.avatar" />
        <span>{{ row.title }}</span>
      </li>
      <li v-for="row in chosen" :key="row.key" class="chat-group-picker-chip">
        <app-avatar :size="SMALL_FACE_SIZE" :color="'#fff'" v-bind="row.avatar" />
        <span>{{ row.alias }}</span>
      </li>
    </ul>

    <!-- As many as may be chosen together are chosen (`max`): the others wait, greyed, and this
         says why. -->
    <p v-if="full" class="chat-group-picker-none" data-test="chat-group-picker-full">
      {{ t('chatGroup.pickMax', { max }) }}
    </p>

    <!-- The member's groups, where a message may go into one as well (E-059, forwarding): a list
         of their own over the contacts, as on the page. The group's square and its line, as its
         row there shows them. -->
    <template v-if="groups.length">
      <p class="chat-group-picker-head" data-test="chat-group-picker-groups-head">
        {{ t('chatGroup.pickGroups') }}
      </p>
      <p
        v-if="groupRows.length === 0"
        class="chat-group-picker-none"
        data-test="chat-group-picker-groups-none"
      >
        {{ t('chatGroup.pickNoGroupMatch') }}
      </p>
      <ul v-else class="chat-group-picker-list" data-test="chat-group-picker-groups">
        <li v-for="row in groupRows" :key="row.uuid">
          <label
            class="chat-group-pick"
            :class="{ 'is-off': row.waits }"
            :data-test="`chat-group-pick-group-${row.uuid}`"
          >
            <input
              type="checkbox"
              class="chat-group-pick-box"
              :checked="row.chosen"
              :disabled="row.waits"
              @change="toggleGroup(row, $event.target.checked)"
            />
            <app-avatar :size="LIST_AVATAR_SIZE" :color="'#fff'" v-bind="row.avatar" />
            <span class="chat-group-pick-words">
              <span class="chat-group-pick-name">{{ row.title }}</span>
              <span class="chat-group-pick-sub">{{ row.sub }}</span>
            </span>
          </label>
        </li>
      </ul>
      <p class="chat-group-picker-head" data-test="chat-group-picker-contacts-head">
        {{ t('chatGroup.pickContacts') }}
      </p>
    </template>

    <p v-if="rows.length === 0" class="chat-group-picker-none" data-test="chat-group-picker-none">
      {{
        contacts.length === 0
          ? noContactsText || t('chatGroup.pickNoContacts')
          : t('chatGroup.pickNoMatch')
      }}
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
          :class="{ 'is-off': row.later || waits(row) }"
          :data-test="`chat-group-pick-${row.contact.user.gradidoID}`"
        >
          <input
            type="checkbox"
            class="chat-group-pick-box"
            :checked="isChosen(row)"
            :disabled="row.later || waits(row)"
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
import { chatGroupAvatar, chatGroupMeta } from '@/components/ChatGroups/chatGroupDisplay'
import { contactDisplay } from '@/components/Contacts/contactDisplay'
import { SMALL_FACE_SIZE, LIST_AVATAR_SIZE } from '@/constants'
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
  /**
   * The member's groups (chatGroupsQuery), where a message may go into one of them as well -- the
   * dialog that forwards one (E-059). A list of their own over the contacts; chosen by their uuids
   * (`chosenGroups`). None for the members of a group.
   */
  groups: { type: Array, default: () => [] },
  chosenGroups: { type: Array, default: () => [] },
  /** How many may be chosen together, groups and contacts (E-059 F3: five); 0 for no limit. */
  max: { type: Number, default: 0 },
  /** What the label over the search says, and the field, where it is not the group's members. */
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  /** What stands where there are no contacts at all, where it is not about taking them in. */
  noContactsText: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:chosenGroups'])

const { t, d } = useI18n()
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

const groupKeyOf = (uuid) => String(uuid).toLowerCase()
const chosenGroupKeys = computed(() => new Set(props.chosenGroups.map(groupKeyOf)))

/** As many as may be chosen together are chosen: the others wait. */
const full = computed(
  () => props.max > 0 && props.modelValue.length + props.chosenGroups.length >= props.max,
)
const waits = (row) => full.value && !isChosen(row)

/** The groups, drawn as their rows on the page draw them, narrowed by the search as well. */
const offeredGroups = computed(() =>
  props.groups.map((group) => {
    const chosen = chosenGroupKeys.value.has(groupKeyOf(group.groupUuid))
    return {
      uuid: group.groupUuid,
      title: group.title,
      avatar: chatGroupAvatar(group),
      sub: chatGroupMeta(group, { t, d }),
      chosen,
      waits: full.value && !chosen,
    }
  }),
)
const groupRows = computed(() =>
  offeredGroups.value.filter(
    (row) => !needle.value || row.title.toLowerCase().includes(needle.value),
  ),
)
/** The chosen groups as rows, in the order they were ticked. */
const chosenGroupRows = computed(() =>
  props.chosenGroups
    .map((uuid) => offeredGroups.value.find((row) => groupKeyOf(row.uuid) === groupKeyOf(uuid)))
    .filter(Boolean),
)

const toggle = (row, checked) => {
  if (row.later || (checked && waits(row))) return
  const others = props.modelValue.filter((user) => keyOf(user) !== row.id)
  emit('update:modelValue', checked ? [...others, row.contact.user] : others)
}

const toggleGroup = (row, checked) => {
  if (checked && row.waits) return
  const others = props.chosenGroups.filter((uuid) => groupKeyOf(uuid) !== groupKeyOf(row.uuid))
  emit('update:chosenGroups', checked ? [...others, row.uuid] : others)
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

/* "Gruppen", "Kontakte": over the two lists, as the page heads its sections. */
.chat-group-picker-head {
  margin: 1rem 0 0;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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
