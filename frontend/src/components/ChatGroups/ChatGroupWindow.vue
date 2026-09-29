<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- A group's window (P5), built as the contact window is (ContactWindow): a sheet over the
       whole screen on a phone (`fullscreen="sm"`), at the top of the screen on a desk, so it grows
       downwards only when the thread lands (E-031). `no-header` / `no-footer` -- NOT `hide-…`,
       which bootstrap-vue-next does not know -- and therefore a name of its own (`aria-label`).
       `lazy`: a closed window renders nothing. -->
  <BModal
    :model-value="modelValue"
    fullscreen="sm"
    lazy
    no-header
    no-footer
    :aria-label="group?.title ?? ''"
    body-class="chat-group-window-body"
    data-test="chat-group-window"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="group" class="chat-group-window-inner">
      <!-- The cross in a line of its own at the very top, as in the contact window (Bernd,
           24.09.2026): beside the name it took the room a long name needs on a phone. -->
      <div class="chat-group-window-top">
        <button
          type="button"
          class="chat-group-window-close"
          :aria-label="$t('form.close')"
          :title="$t('form.close')"
          data-test="chat-group-window-close"
          @click="emit('update:modelValue', false)"
        >
          <IBiX />
        </button>
      </div>

      <div class="chat-group-window-head">
        <!-- The group's square at the window's size (64, as the contact window's face). -->
        <app-avatar :size="64" :color="'#fff'" v-bind="avatar" />
        <div class="chat-group-window-who">
          <div class="chat-group-window-name" data-test="chat-group-window-name">
            {{ group.title }}
          </div>
          <div
            v-if="group.communityName"
            class="chat-group-window-community"
            data-test="chat-group-window-community"
          >
            {{ group.communityName }}
          </div>
          <!-- How many, and the member's own part: "5 Mitglieder · Du bist Inhaber". -->
          <div class="chat-group-window-community" data-test="chat-group-window-count">
            {{ countLine }}
          </div>
        </div>
      </div>

      <!-- Since when, and who opened it -- the contact window's "Kontakt seit …" line. -->
      <div class="chat-group-window-meta" data-test="chat-group-window-meta">{{ metaLine }}</div>

      <!-- The row under the figures, as the contact window's send row: "Mitglieder" where the
           contact window has "Gradido senden", the marks at its right end. -->
      <div class="chat-group-window-row">
        <!-- The members (the mockup): up to four small faces and the word -- the faces are the
             button's picture, not controls of their own, so none of them zooms here. -->
        <button
          type="button"
          class="chat-group-window-members"
          data-test="chat-group-window-members"
          @click="membersOpen = true"
        >
          <span class="chat-group-window-strip" aria-hidden="true">
            <app-avatar
              v-for="face in strip"
              :key="face.id"
              class="chat-group-window-strip-face"
              :size="SMALL_FACE_SIZE"
              :color="'#fff'"
              v-bind="face.avatar"
            />
          </span>
          {{ t('chatGroup.members') }}
        </button>
        <div class="chat-group-window-marks">
          <!-- The camera: a video call in the group (E-053), as with a person (V2) -- a room on a
               checked Jitsi server whose address goes to everybody in the group as an ordinary
               message. Anybody in the group may start one; by mail only the owner and the
               moderators, as the announcement. No word beside it: the question carries the words. -->
          <button
            type="button"
            class="chat-group-window-mark chat-group-window-video"
            :aria-label="videoCallName"
            :title="videoCallName"
            data-test="chat-group-window-video"
            @click="videoCall?.ask()"
          >
            <i-mdi-video-outline class="chat-group-window-video-icon" aria-hidden="true" />
          </button>
          <!-- The bell: mutes the group for oneself -- no announcement reaches one by mail; the
               thread shows every message as before (E-024). No question before switching, either
               way: nothing is lost, and it switches back as easily. -->
          <button
            type="button"
            class="chat-group-window-mark chat-group-window-bell"
            :class="{ 'is-muted': muted }"
            :aria-pressed="muted ? 'true' : 'false'"
            :aria-label="bellName"
            :title="bellName"
            data-test="chat-group-window-bell"
            @click="toggleMute"
          >
            <i-mdi-bell-off-outline
              v-if="muted"
              class="chat-group-window-bell-icon"
              aria-hidden="true"
            />
            <i-mdi-bell-outline v-else class="chat-group-window-bell-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- The group's thread and the bar to write in it (ChatThread in a group's kind). ⛔ Keyed by
           the group: the thread takes its group once, and another group is another thread. -->
      <chat-thread
        :key="group.groupUuid"
        ref="thread"
        class="chat-group-window-thread"
        :group="group"
        @open-member="emit('openMember', $event)"
      />

      <!-- The questions of a video call (ChatVideoCall), as the contact window asks them (E-053):
           the invitation goes through the group's thread; the box, for the owner and the
           moderators, sends it to everybody by mail as an announcement. -->
      <chat-video-call
        ref="videoCall"
        :name="group.title"
        group
        :can-mail="canAnnounce"
        :deliver="deliverThroughThread"
      />

      <!-- The members' dialog, over this window (P5). -->
      <chat-group-members
        v-model="membersOpen"
        :group="group"
        :members="members"
        :loaded="membersLoaded"
        :contacts="contacts"
        @changed="membersChanged"
        @left="left"
        @open-member="emit('openMember', $event)"
      />
    </div>
  </BModal>
</template>

<script setup>
import { computed, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { BModal } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatThread from '@/components/Chat/ChatThread.vue'
import ChatVideoCall from '@/components/Chat/ChatVideoCall.vue'
import ChatGroupMembers from '@/components/ChatGroups/ChatGroupMembers.vue'
import {
  chatGroupAvatar,
  chatGroupOwnPart,
  CHAT_GROUP_META_SEPARATOR,
} from '@/components/ChatGroups/chatGroupDisplay'
import { fetchMemberAvatars, memberAvatarProps } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { SMALL_FACE_SIZE } from '@/constants'
import { chatGroupMembersQuery, setChatGroupMuted } from '@/graphql/chatGroups.graphql'
import { managesChatGroup } from '@/utils/chatGroupRoles'
import { chatMemberKey } from '@/utils/chatMemberKey'
import { CHAT_VIDEO_JOIN } from '@/utils/chatVideoApp'
import { memberAlias } from '@/utils/gradidoAddress'

/**
 * One chat group (P5), opened from the list on "Kontakte & Chat". One window for the page, as for
 * the contacts (KF-010).
 *
 * `group` is one of `chatGroupsQuery`: the page hands the newest it has, so a name or a part that
 * changed shows here as soon as the list is asked again.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  group: { type: Object, default: null },
  /** The contact list the page holds: whom the members' dialog may take in. */
  contacts: { type: Array, default: () => [] },
})

/**
 * `changed`: something about the group is different now -- muted or lifted, a member in or out, a
 * part or the name changed, the member left -- and the page asks for its list again.
 *
 * `openMember`: a member whose name was tapped, in the list or over their message (E-053). The page
 * knows who is a contact, and leads there: their window over this one, or the send form.
 */
const emit = defineEmits(['update:modelValue', 'changed', 'openMember'])

const { t, d } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()
const { mutate: saveMuted } = useMutation(setChatGroupMuted)
const { client: apolloClient } = useApolloClient()

/**
 * The group's members (chatGroupMembersQuery), asked when the window opens or comes to another
 * group, and again after a change in the members' dialog -- the longest-standing first. Their
 * faces are asked for as the lists ask for theirs. Only the newest answer counts.
 */
const members = ref([])
const membersLoaded = ref(false)
const membersOpen = ref(false)
let membersAsked = 0

const loadMembers = async () => {
  const groupUuid = props.group?.groupUuid
  if (!groupUuid) return
  const mine = ++membersAsked
  try {
    const { data } = await apolloClient.query({
      query: chatGroupMembersQuery,
      variables: { groupUuid },
      fetchPolicy: 'network-only',
    })
    if (mine !== membersAsked) return
    members.value = data?.chatGroupMembers ?? []
    membersLoaded.value = true
    fetchMemberAvatars(
      apolloClient,
      members.value.map((member) => member.user),
    )
  } catch {
    // The members as they were; the dialog says it is still asking where there are none.
  }
}

watch(
  () => [props.modelValue, props.group?.groupUuid],
  ([open, groupUuid], before) => {
    if (!open || !groupUuid) return
    if (before && before[0] && before[1] === groupUuid) return
    members.value = []
    membersLoaded.value = false
    membersOpen.value = false
    loadMembers()
  },
  { immediate: true },
)

/** Up to four faces for the button: the longest-standing members, oneself included. */
const strip = computed(() =>
  members.value.slice(0, 4).map((member) => ({
    id: chatMemberKey(member.user),
    avatar: memberAvatarProps(member.user),
  })),
)

/** The dialog changed the members or the name: both asked again. */
const membersChanged = () => {
  loadMembers()
  emit('changed')
}

/** The member left the group: the window closes, and the page's list lets the group go. */
const left = () => {
  emit('update:modelValue', false)
  emit('changed')
}

const avatar = computed(() => chatGroupAvatar(props.group))

/** "5 Mitglieder · Du bist Inhaber". */
const countLine = computed(() =>
  [t('chatGroup.memberCount', props.group.memberCount), chatGroupOwnPart(props.group.role, { t })]
    .filter(Boolean)
    .join(CHAT_GROUP_META_SEPARATOR),
)

/**
 * Whether the member signed in is the one named. By the Gradido ID alone, without regard to case as
 * the server compares it: in P5 every member of a group is of this community (E-026), and a store
 * from before `communityUuid` holds none to pair it with.
 */
const isMe = (user) =>
  Boolean(user?.gradidoID) &&
  user.gradidoID.toLowerCase() === String(store.state.gradidoID ?? '').toLowerCase()

/**
 * "Gruppe seit September 2026 · angelegt von Anna" -- the month, as the contact window says since
 * when somebody is a contact. "von Dir" for one's own group; nothing about the opener where their
 * users row is gone.
 */
const metaLine = computed(() => {
  const since = t('chatGroup.since', {
    date: d(new Date(props.group.createdAt), 'monthAndYear'),
  })
  const opener = props.group.createdBy
  let by = ''
  if (isMe(opener)) {
    by = t('chatGroup.openedByYou')
  } else if (opener?.gradidoID) {
    by = t('chatGroup.openedBy', { name: memberAlias(opener.alias, opener.gradidoID) })
  }
  return [since, by].filter(Boolean).join(CHAT_GROUP_META_SEPARATOR)
})

/** The bell's state: the member's own mark on the group, as they switched it last. */
const muted = ref(false)
let mutingInFlight = false

/**
 * The mark as the list delivers it -- when the window opens, when it comes to another group, and
 * when the list is asked again. Not while a switch of the member's own is on its way: the list
 * asked in between would put back what the member has just changed.
 */
watch(
  () => [props.group?.groupUuid, props.group?.mutedByMe],
  ([, mutedByMe]) => {
    if (!mutingInFlight) muted.value = Boolean(mutedByMe)
  },
  { immediate: true },
)

const bellName = computed(() =>
  muted.value ? t('chatGroup.muteOff', { name: props.group?.title ?? '' }) : t('chatThread.muteOn'),
)

/**
 * Switched here first and confirmed by the server after, put back where it fails -- as the contact
 * window's bell does. `false` from the server is no change: put back, and nothing said.
 */
const toggleMute = async () => {
  if (mutingInFlight || !props.group) return
  mutingInFlight = true
  const { groupUuid, title: name } = props.group
  const wanted = !muted.value
  muted.value = wanted
  try {
    const answer = await saveMuted({ groupUuid, muted: wanted })
    if (props.group?.groupUuid !== groupUuid) return
    if (answer?.data?.setChatGroupMuted) {
      // Two written-out keys, for the i18n lint.
      toastSuccess(
        wanted ? t('chatGroup.mutedHint', { name }) : t('chatGroup.unmutedHint', { name }),
      )
      emit('changed')
    } else {
      muted.value = !wanted
    }
  } catch (error) {
    if (props.group?.groupUuid !== groupUuid) return
    muted.value = !wanted
    toastError(error.message)
  } finally {
    mutingInFlight = false
  }
}
/** The thread of the group: a video invitation goes out through it (`deliver`), as a message. */
const thread = ref(null)
/** The questions of a video call (ChatVideoCall, E-053). */
const videoCall = ref(null)
const videoCallName = computed(() => t('chatGroup.videoCall', { name: props.group?.title ?? '' }))

/**
 * Whether the question offers to send the invitation by mail to everybody: the owner and the
 * moderators (E-050 F5, as the bar's box), and only where anybody else is in the group.
 */
const canAnnounce = computed(
  () => managesChatGroup(props.group?.role) && (props.group?.memberCount ?? 0) > 1,
)

/** The invitation through the group's thread; nothing goes where there is none. */
const deliverThroughThread = (message) =>
  thread.value ? thread.value.deliver(message) : Promise.resolve(false)

/** The question before joining a call, asked by the link of an invitation in the group's thread. */
provide(CHAT_VIDEO_JOIN, (roomUrl) => videoCall.value?.askJoin(roomUrl))

// Another group in the window: a question about a call in the last one is let go. (A new name is
// the same group: its uuid stays, and the question with it.)
watch(
  () => props.group?.groupUuid,
  () => videoCall.value?.letGo(),
)
</script>

<style lang="scss" scoped>
/* ⛔ From here to the sheet: the contact window's measure, rule for rule (ContactWindow.vue), under
   the group window's own names -- `ChatGroupWindow.spec.js` holds the two together, so the two
   windows cannot come to look different by a change to one of them. */
.chat-group-window-top {
  display: flex;
  justify-content: flex-end;
  margin: -0.5rem -0.5rem 0.25rem 0;
}

.chat-group-window-close {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 1.15rem;
  line-height: 1;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
}

.chat-group-window-close:hover,
.chat-group-window-close:focus-visible {
  color: var(--bs-body-color);
}

.chat-group-window-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-group-window-who {
  flex: 1;
  min-width: 0;
}

/* The contact window's name in its font -- but where a person's name is cut, a group's wraps: it
   may run to 100 characters and is nowhere else to be read in full (the list cuts it, as it cuts
   a contact's). Measured in the bundle (29.09.2026), see the spec. */
.chat-group-window-name {
  min-width: 0;
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.chat-group-window-community {
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-group-window-meta {
  font-size: 0.8rem;
  color: var(--bs-secondary-color, #6c757d);
  margin: 0.75rem 0 1rem;
  min-height: 1.5em;
}

.chat-group-window-marks {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.chat-group-window-mark {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted, #6c757d);
  line-height: 1;
}

.chat-group-window-mark:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-group-window-bell-icon {
  width: 1.35em;
  height: 1.35em;
}

/* The camera: in the bell's round and at the heart's glyph size, as in the contact window. */
.chat-group-window-video-icon {
  width: 1.35em;
  height: 1.35em;
}

.chat-group-window-bell.is-muted {
  border-color: var(--gold, #c58d38);
  background: rgb(197 141 56 / 18%);
  color: var(--bs-body-color);
}

/* "Mitglieder" with its faces: a quiet outlined pill, the faces overlapping a little, as a group of
   people is drawn. At least a finger's height. */
.chat-group-window-members {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.25rem 0.9rem 0.25rem 0.35rem;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 1.5rem;
  background: transparent;
  color: var(--bs-body-color);
  font-size: 0.9rem;
  font-weight: 600;
}

.chat-group-window-members:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-group-window-strip {
  display: inline-flex;
}

/* Each face with a ring in the window's colour that sets it off, and each after the first a
   third over the one before it. */
.chat-group-window-strip-face {
  box-shadow: 0 0 0 2px var(--surface, #fff);
}

.chat-group-window-strip-face + .chat-group-window-strip-face {
  margin-left: -0.55rem;
}

/* The row under the figures, as the contact window's send row: its parts in one line, and on a
   second only where the window is too narrow for them. */
.chat-group-window-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

/* ⛔ The sheet (below `sm`): one column over the whole height -- head, figures, the thread -- in
   which only the thread gives way, as in the contact window. */
@media (width <= 575.98px) {
  .chat-group-window-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .chat-group-window-top,
  .chat-group-window-head,
  .chat-group-window-meta,
  .chat-group-window-row {
    flex-shrink: 0;
  }

  .chat-group-window-thread {
    flex: 0 1 auto;
  }

  .chat-group-window-thread :deep(.chat-thread-scroll) {
    max-height: none;
  }
}
</style>
