<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The members of a group (P5, the mockup), over the group's window as the picture's editor
       stands over the contact window: its own BModal, stacked. A sheet on a phone, a dialog whose
       list scrolls on a desk. No header -- the title stands in the body, the dialog is named by
       `aria-label` -- and the cross at the top, as in the windows.

       One dialog, four views: the list; taking people in; a new name; and the question before a
       step that only somebody else can undo (leaving, taking somebody out). -->
  <BModal
    :model-value="modelValue"
    fullscreen="sm"
    scrollable
    lazy
    no-header
    :aria-label="viewTitle"
    data-test="chat-group-members"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="chat-group-members-top">
      <p class="h5 mb-0" data-test="chat-group-members-title">{{ viewTitle }}</p>
      <button
        type="button"
        class="chat-group-members-close"
        :aria-label="$t('form.close')"
        :title="$t('form.close')"
        data-test="chat-group-members-close"
        @click="emit('update:modelValue', false)"
      >
        <IBiX />
      </button>
    </div>

    <!-- The list. -->
    <template v-if="view === 'list'">
      <button
        v-if="manages"
        type="button"
        class="chat-group-members-add"
        data-test="chat-group-members-add"
        @click="openView('add')"
      >
        <i-mdi-plus aria-hidden="true" />
        {{ t('chatGroup.addMembers') }}
      </button>
      <ul class="chat-group-members-list" data-test="chat-group-members-list">
        <li
          v-for="row in rows"
          :key="row.id"
          class="chat-group-member"
          :data-test="`chat-group-member-${row.member.user.gradidoID}`"
        >
          <div class="chat-group-member-line">
            <!-- At the size of every list, and it opens large where there is a picture: it stands
                 outside any button here. -->
            <app-avatar :size="LIST_AVATAR_SIZE" :color="'#fff'" v-bind="row.avatar" />
            <span class="chat-group-member-words">
              <span class="chat-group-member-name" data-test="chat-group-member-name">
                {{ row.name }}
              </span>
              <span
                v-if="row.member.user.communityName"
                class="chat-group-member-sub"
                data-test="chat-group-member-community"
              >
                {{ row.member.user.communityName }}
              </span>
            </span>
            <span
              v-if="row.part"
              class="chat-group-member-part"
              :class="{ 'is-owner': row.member.role === CHAT_GROUP_OWNER }"
              data-test="chat-group-member-part"
            >
              {{ row.part }}
            </span>
            <!-- What the member may do with this one (E-050 F4): the owner with everybody else,
                 a moderator with a plain member. A disclosure, not an ARIA menu: its entries are
                 plain buttons under the row, reached with Tab. -->
            <button
              v-if="row.touchable"
              type="button"
              class="chat-group-member-more"
              :aria-label="t('chatGroup.memberMenu', { name: row.alias })"
              :title="t('chatGroup.memberMenu', { name: row.alias })"
              :aria-expanded="menuFor === row.id ? 'true' : 'false'"
              :aria-controls="`${menuId}-${row.index}`"
              data-test="chat-group-member-more"
              @click="menuFor = menuFor === row.id ? null : row.id"
            >
              <i-mdi-dots-vertical aria-hidden="true" />
            </button>
          </div>
          <div
            v-if="menuFor === row.id"
            :id="`${menuId}-${row.index}`"
            class="chat-group-member-menu"
            data-test="chat-group-member-menu"
          >
            <!-- Two written-out keys for the two ways, for the i18n lint. -->
            <button
              v-if="role === CHAT_GROUP_OWNER"
              type="button"
              data-test="chat-group-member-moderator"
              :aria-disabled="busy ? 'true' : 'false'"
              @click="setModerator(row, row.member.role !== CHAT_GROUP_MODERATOR)"
            >
              {{
                row.member.role === CHAT_GROUP_MODERATOR
                  ? t('chatGroup.moderatorOff')
                  : t('chatGroup.moderatorOn')
              }}
            </button>
            <button
              type="button"
              class="is-danger"
              data-test="chat-group-member-remove"
              @click="askRemove(row)"
            >
              {{ t('chatGroup.remove') }}
            </button>
          </div>
        </li>
      </ul>
      <p v-if="!loaded" class="chat-group-members-quiet" data-test="chat-group-members-loading">
        {{ t('chatGroup.membersLoading') }}
      </p>
    </template>

    <!-- Taking people in: the member's own contacts, those in the group already left out. -->
    <template v-else-if="view === 'add'">
      <chat-group-picker
        v-model="chosen"
        :contacts="contacts"
        :excluded="members.map((member) => member.user)"
      />
      <p class="small text-muted mt-3 mb-0" data-test="chat-group-members-add-hint">
        {{ t('chatGroup.addHint') }}
      </p>
    </template>

    <!-- A new name. -->
    <template v-else-if="view === 'rename'">
      <label class="form-label" :for="nameId">{{ t('chatGroup.name') }}</label>
      <input
        :id="nameId"
        v-model="newTitle"
        type="text"
        class="form-control"
        :maxlength="CHAT_GROUP_TITLE_MAX"
        autocomplete="off"
        data-test="chat-group-members-name"
      />
    </template>

    <!-- The question before leaving, or before taking somebody out. -->
    <template v-else>
      <p class="mb-0" data-test="chat-group-members-question">{{ questionText }}</p>
    </template>

    <p v-if="problem" class="mt-3 mb-0" role="alert" data-test="chat-group-members-problem">
      {{ problem }}
    </p>

    <template #footer>
      <template v-if="view === 'list'">
        <BButton
          v-if="manages"
          variant="secondary"
          data-test="chat-group-members-rename"
          @click="openView('rename')"
        >
          {{ t('chatGroup.rename') }}
        </BButton>
        <BButton
          variant="outline-danger"
          data-test="chat-group-members-leave"
          @click="openView('leave')"
        >
          {{ t('chatGroup.leave') }}
        </BButton>
      </template>
      <template v-else>
        <BButton variant="secondary" data-test="chat-group-members-back" @click="openView('list')">
          {{ view === 'add' || view === 'rename' ? t('back') : t('form.cancel') }}
        </BButton>
        <!-- The step itself. `aria-disabled` while it cannot be taken or is on its way. -->
        <BButton
          :variant="view === 'leave' || view === 'remove' ? 'danger' : 'gradido'"
          class="chat-group-members-go"
          :aria-disabled="canGo ? 'false' : 'true'"
          data-test="chat-group-members-go"
          @click="go"
        >
          {{ goText }}
        </BButton>
      </template>
    </template>
  </BModal>
</template>

<script setup>
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { BButton, BModal } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatGroupPicker from '@/components/ChatGroups/ChatGroupPicker.vue'
import {
  CHAT_GROUP_TITLE_MAX,
  chatGroupPartMark,
  chatGroupRefusal,
  chatGroupTitle,
  isChatGroupTitle,
} from '@/components/ChatGroups/chatGroupDisplay'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { LIST_AVATAR_SIZE } from '@/constants'
import {
  addChatGroupMembers,
  leaveChatGroup,
  removeChatGroupMember,
  renameChatGroup,
  setChatGroupModerator,
} from '@/graphql/chatGroups.graphql'
import { CHAT_GROUP_MODERATOR, CHAT_GROUP_OWNER, managesChatGroup } from '@/utils/chatGroupRoles'
import { chatMemberKey } from '@/utils/chatMemberKey'
import { memberAlias } from '@/utils/gradidoAddress'

/**
 * The members of a group (P5) and what the member may do about them (E-050 F4): the owner takes
 * people in and out, makes up to two moderators and renames; a moderator takes people in, takes
 * plain members out and renames; everybody may leave.
 *
 * `group` is the group as the list delivers it (its uuid, its name, the member's own part);
 * `members` its members as chatGroupMembersQuery answers, the longest-standing first; `contacts`
 * the contact list the page holds, to take people in from.
 *
 * `changed`: the members or the name are different now -- the window asks for the members again,
 * and the page for its list. `left`: the member is out of the group.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  group: { type: Object, required: true },
  members: { type: Array, required: true },
  loaded: { type: Boolean, default: true },
  contacts: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'changed', 'left'])

const { t } = useI18n()
const store = useStore()
const menuId = `${useId()}-menu`
const nameId = `${useId()}-name`

const { mutate: takeIn } = useMutation(addChatGroupMembers)
const { mutate: takeOut } = useMutation(removeChatGroupMember)
const { mutate: leave } = useMutation(leaveChatGroup)
const { mutate: moderate } = useMutation(setChatGroupModerator)
const { mutate: rename } = useMutation(renameChatGroup)

/** The member's own part in the group, as the list delivers it. */
const role = computed(() => props.group.role)
const manages = computed(() => managesChatGroup(role.value))

/** By the Gradido ID, as the group's window asks it (every member is of this community, E-026). */
const isMe = (user) =>
  String(user?.gradidoID ?? '').toLowerCase() === String(store.state.gradidoID ?? '').toLowerCase()

/**
 * Whom the member may do something with (E-050 F4): the owner with everybody else; a moderator
 * with a plain member; nobody with themselves -- leaving is its own button.
 */
const touchable = (member) => {
  if (isMe(member.user) || member.role === CHAT_GROUP_OWNER) return false
  if (role.value === CHAT_GROUP_OWNER) return true
  return role.value === CHAT_GROUP_MODERATOR && member.role !== CHAT_GROUP_MODERATOR
}

/** One row a member: the face through the lists' helper, "Du (Bernd)" for oneself. */
const rows = computed(() =>
  props.members.map((member, index) => {
    const base = memberAvatarProps(member.user)
    const alias = memberAlias(member.user.alias, member.user.gradidoID)
    return {
      member,
      index,
      id: chatMemberKey(member.user),
      alias,
      name: isMe(member.user) ? t('chatGroup.memberYou', { name: alias }) : alias,
      part: chatGroupPartMark(member.role, { t }),
      avatar: { ...base, ...avatarZoomBindings(member.user, base) },
      touchable: touchable(member),
    }
  }),
)

/** Which view the dialog shows: the list, 'add', 'rename', 'leave' or 'remove'. */
const view = ref('list')
const menuFor = ref(null)
const chosen = ref([])
const newTitle = ref('')
/** The member the question before taking somebody out is about. */
const toRemove = ref(null)
const busy = ref(false)
const problem = ref('')

const openView = (next) => {
  view.value = next
  menuFor.value = null
  problem.value = ''
  if (next === 'add') chosen.value = []
  if (next === 'rename') newTitle.value = props.group.title
}

/** Every opening shows the list, with nothing left over from the last one. */
watch(
  () => props.modelValue,
  (open) => {
    if (open) openView('list')
  },
)

const viewTitle = computed(() => {
  switch (view.value) {
    case 'add':
      return t('chatGroup.addMembers')
    case 'rename':
      return t('chatGroup.renameTitle')
    case 'leave':
      return t('chatGroup.leaveTitle', { name: props.group.title })
    case 'remove':
      return t('chatGroup.removeTitle', { name: toRemove.value?.alias ?? '' })
    default:
      return t('chatGroup.membersTitle', { n: props.members.length })
  }
})

/**
 * Who takes over where the owner leaves: the longest-standing moderator, else the longest-standing
 * member (the server's rule, P5a) -- the list comes longest-standing first.
 */
const successor = computed(() => {
  const others = props.members.filter((member) => !isMe(member.user))
  const next = others.find((member) => member.role === CHAT_GROUP_MODERATOR) ?? others[0] ?? null
  return next ? memberAlias(next.user.alias, next.user.gradidoID) : ''
})

/** The question's sentence: what the step means, and that only somebody else can undo it. */
const questionText = computed(() => {
  if (view.value === 'remove') {
    return t('chatGroup.removeBody', { name: toRemove.value?.alias ?? '' })
  }
  if (role.value === CHAT_GROUP_OWNER && successor.value) {
    return t('chatGroup.leaveBodyOwner', { name: successor.value })
  }
  return t('chatGroup.leaveBody')
})

const goText = computed(() => {
  switch (view.value) {
    case 'add':
      return t('chatGroup.addGo')
    case 'rename':
      return t('chatGroup.renameGo')
    case 'remove':
      return t('chatGroup.remove')
    default:
      return t('chatGroup.leave')
  }
})

const canGo = computed(() => {
  if (busy.value) return false
  if (view.value === 'add') return chosen.value.length > 0
  if (view.value === 'rename') {
    return isChatGroupTitle(newTitle.value) && chatGroupTitle(newTitle.value) !== props.group.title
  }
  return true
})

const refOf = (user) => ({ gradidoID: user.gradidoID, communityUuid: user.communityUuid ?? null })

/**
 * One step against the server. The dialog waits while it is on its way; what went wrong stands
 * in the dialog, in the member's words (chatGroupRefusal).
 */
const step = async (ask, then) => {
  if (busy.value) return
  busy.value = true
  problem.value = ''
  try {
    await ask()
    then()
  } catch (error) {
    problem.value = chatGroupRefusal(error, { t })
  } finally {
    busy.value = false
  }
}

const askRemove = (row) => {
  toRemove.value = row
  openView('remove')
}

const setModerator = (row, moderator) => {
  if (busy.value) return
  step(
    () =>
      moderate({
        groupUuid: props.group.groupUuid,
        member: refOf(row.member.user),
        moderator,
      }),
    () => {
      menuFor.value = null
      emit('changed')
    },
  )
}

const go = () => {
  if (!canGo.value) return
  const groupUuid = props.group.groupUuid
  switch (view.value) {
    case 'add':
      step(
        () => takeIn({ groupUuid, members: chosen.value.map(refOf) }),
        () => {
          openView('list')
          emit('changed')
        },
      )
      break
    case 'rename':
      step(
        () => rename({ groupUuid, title: chatGroupTitle(newTitle.value) }),
        () => {
          openView('list')
          emit('changed')
        },
      )
      break
    case 'remove':
      step(
        () => takeOut({ groupUuid, member: refOf(toRemove.value.member.user) }),
        () => {
          toRemove.value = null
          openView('list')
          emit('changed')
        },
      )
      break
    default:
      step(
        () => leave({ groupUuid }),
        () => {
          emit('update:modelValue', false)
          emit('left')
        },
      )
  }
}
</script>

<style scoped>
/* The title and the cross on one line at the top. */
.chat-group-members-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.chat-group-members-close {
  appearance: none;
  flex: 0 0 auto;
  margin: -0.25rem -0.25rem 0 0;
  padding: 0.25rem;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
}

.chat-group-members-close:hover,
.chat-group-members-close:focus-visible {
  color: var(--bs-body-color);
}

/* "+ Mitglieder hinzufügen": a quiet outlined pill in the gold of the house, as "In den Kalender". */
.chat-group-members-add {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.25rem;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.9rem;
  border: 1px solid var(--gold, #c58d38);
  border-radius: 1.2rem;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 0.9rem;
}

.chat-group-members-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.chat-group-member {
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
}

.chat-group-member:last-child {
  border-bottom: 0;
}

.chat-group-member-line {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0;
}

/* The face keeps its size however long the name beside it: the name gives way. Measured in the
   bundle at 320 px (29.09.2026): beside "Moderator" and the dots a face had shrunk to 43 px. */
.chat-group-member-line .app-avatar {
  flex: 0 0 auto;
}

.chat-group-member-words {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.chat-group-member-name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-group-member-sub,
.chat-group-members-quiet {
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.8rem;
}

/* "Inhaber", "Moderator": a small mark at the end of the name's line; the owner's in gold. */
.chat-group-member-part {
  flex: 0 0 auto;
  padding: 0 0.5rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 1rem;
  font-size: 0.75rem;
  line-height: 1.6;
}

.chat-group-member-part.is-owner {
  border-color: var(--gold, #c58d38);
}

/* The three dots: round, a finger's size, drawn as the window's bell. */
.chat-group-member-more {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1.25rem;
}

/* The row's entries, under it and indented to the name. */
.chat-group-member-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0 0 0.6rem calc(48px + 0.65rem);
}

.chat-group-member-menu button {
  min-height: 2.25rem;
  padding: 0.25rem 0.8rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 1.2rem;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 0.85rem;
}

.chat-group-member-menu button.is-danger {
  border-color: var(--bs-danger, #dc3545);
  color: var(--bs-danger-text-emphasis, #b02a37);
}

/* Every control of the dialog shows where the keyboard is. */
.chat-group-members-add:focus-visible,
.chat-group-member-more:focus-visible,
.chat-group-member-menu button:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-group-members-go[aria-disabled='true'] {
  opacity: 0.65;
  cursor: default;
}
</style>
