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

      <!-- The row under the figures: the marks at its right end, as in the contact window. -->
      <div class="chat-group-window-row">
        <div class="chat-group-window-marks">
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
      <chat-thread :key="group.groupUuid" class="chat-group-window-thread" :group="group" />
    </div>
  </BModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { BModal } from 'bootstrap-vue-next'
import AppAvatar from '@/components/AppAvatar.vue'
import ChatThread from '@/components/Chat/ChatThread.vue'
import {
  chatGroupAvatar,
  chatGroupOwnPart,
  CHAT_GROUP_META_SEPARATOR,
} from '@/components/ChatGroups/chatGroupDisplay'
import { useAppToast } from '@/composables/useToast'
import { setChatGroupMuted } from '@/graphql/chatGroups.graphql'
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
})

/**
 * `changed`: something about the group is different now -- the member muted it, or lifted it -- and
 * the page asks for its list again, which draws the crossed bell in the row.
 */
const emit = defineEmits(['update:modelValue', 'changed'])

const { t, d } = useI18n()
const store = useStore()
const { toastSuccess, toastError } = useAppToast()
const { mutate: saveMuted } = useMutation(setChatGroupMuted)

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

.chat-group-window-name {
  min-width: 0;
  font-weight: 700;
  font-size: 1.1rem;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.chat-group-window-bell.is-muted {
  border-color: var(--gold, #c58d38);
  background: rgb(197 141 56 / 18%);
  color: var(--bs-body-color);
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
