<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- "Weiterleiten" (Bernd, 30.09.2026, E-059, the mockup): the message it is about, the member's
       groups and contacts to choose from -- five at most together (F3), another community's
       greyed (F5) --, the words to go with it (F4) and the box. A sheet on a phone, a dialog on a
       desk whose list scrolls between the title and the buttons, as "Neue Gruppe"; over the window
       it was opened from. No header, so the dialog is named by `aria-label`; its own footer, so
       the button can wait while the copies are on their way. -->
  <BModal
    :model-value="modelValue"
    fullscreen="sm"
    scrollable
    lazy
    no-header
    :aria-label="t('chatForward.title')"
    data-test="chat-forward"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="h5 mb-3" data-test="chat-forward-title">{{ t('chatForward.title') }}</p>
    <!-- The message, two lines of it at most, with who wrote it and when. -->
    <div v-if="message" class="chat-forward-preview" data-test="chat-forward-preview">
      <i-mdi-share class="chat-forward-preview-icon" aria-hidden="true" />
      <span class="chat-forward-preview-words">
        <span class="chat-forward-preview-who" data-test="chat-forward-preview-who">
          {{ previewWho }}
        </span>
        <span class="chat-forward-preview-text" data-test="chat-forward-preview-text">
          {{ previewText }}
        </span>
      </span>
    </div>
    <chat-group-picker
      v-model="members"
      v-model:chosen-groups="groupUuids"
      :contacts="contacts"
      :groups="groups"
      :max="CHAT_FORWARD_MAX_TARGETS"
      :label="t('chatForward.to')"
      :placeholder="t('chatForward.search')"
      :no-contacts-text="t('chatForward.noContacts')"
    />
    <div class="mt-3">
      <label class="form-label" :for="wordsId">{{ t('chatForward.words') }}</label>
      <textarea
        :id="wordsId"
        v-model="words"
        class="form-control chat-forward-words"
        rows="2"
        :maxlength="MESSAGE_MAX_CHARS"
        data-test="chat-forward-words"
      />
    </div>
    <!-- The box, for the contacts chosen (E-024): the first message of a pair goes by mail in any
         case, the server sees to that. Into a group a copy goes without an announcement. -->
    <ChatCheck
      v-if="members.length"
      v-model="alsoByEmail"
      class="mt-3"
      box-test="chat-forward-email"
    >
      {{ mailWords }}
    </ChatCheck>
    <p v-if="problem" class="mt-3 mb-0" role="alert" data-test="chat-forward-problem">
      {{ problem }}
    </p>
    <template #footer>
      <BButton variant="secondary" data-test="chat-forward-cancel" @click="close">
        {{ t('form.cancel') }}
      </BButton>
      <!-- `aria-disabled`, not `disabled`: a focused button that is disabled loses its focus, and
           the press is turned away in the handler instead (ChatGroupCreate). -->
      <BButton
        variant="gradido"
        class="chat-forward-go"
        :aria-disabled="ready && !sending ? 'false' : 'true'"
        data-test="chat-forward-go"
        @click="go"
      >
        {{ goWords }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { BButton, BModal } from 'bootstrap-vue-next'
import ChatCheck from '@/components/Chat/ChatCheck.vue'
import ChatGroupPicker from '@/components/ChatGroups/ChatGroupPicker.vue'
import { useAppToast } from '@/composables/useToast'
import { forwardChatMessage } from '@/graphql/chat.graphql'
import { memberAlias } from '@/utils/gradidoAddress'

/** How many conversations at once, groups and contacts together (E-059 F3; the backend's limit). */
const CHAT_FORWARD_MAX_TARGETS = 5
/** The words' length, as any message's (MESSAGE_MAX_CHARS in `shared`, the compose bar's). */
const MESSAGE_MAX_CHARS = 2000

/**
 * Forwards a message (E-059): the member chooses where to, writes words to go with it where they
 * want to, and the server files a copy in every conversation chosen. `forwarded` tells the page it
 * went, so its lists show the new messages.
 *
 * `message` is the message of the thread; `writer` the name its writer goes by in the window it
 * came from -- one's own is "Du" here. `contacts` and `groups` are what the page holds.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  message: { type: Object, default: null },
  writer: { type: String, default: '' },
  contacts: { type: Array, required: true },
  groups: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'forwarded'])

const { t, d, locale } = useI18n()
const { toastSuccess, toastError } = useAppToast()
const { mutate: forward } = useMutation(forwardChatMessage)
const wordsId = `${useId()}-words`

/** The contacts chosen (their `user`s) and the groups chosen (their uuids), as the picker has them. */
const members = ref([])
const groupUuids = ref([])
const words = ref('')
const alsoByEmail = ref(false)
const sending = ref(false)
/** Why the last try did not go out, in the member's words; '' while nothing went wrong. */
const problem = ref('')

const ready = computed(() => members.value.length + groupUuids.value.length > 0)

/** Who wrote the message and when it arrived: "Anna-Sonne, 16:28". */
const previewWho = computed(() => {
  if (!props.message) return ''
  const time = d(new Date(props.message.createdAt), 'time')
  const who = props.message.mine ? t('chatThread.you') : props.writer
  return who ? `${who}, ${time}` : time
})

/** The message's words -- a picture without words says it is one. */
const previewText = computed(() => {
  const message = props.message
  if (!message) return ''
  const text = [message.subject, message.body].filter((part) => part?.trim()).join(' – ')
  return text || t('chatForward.picture')
})

const mailWords = computed(() =>
  members.value.length === 1
    ? t('chatForward.byEmailOne', {
        name: memberAlias(members.value[0].alias, members.value[0].gradidoID),
      })
    : t('chatForward.byEmailMany', { count: members.value.length }),
)

const goWords = computed(() => {
  const count = members.value.length + groupUuids.value.length
  return count ? t('chatForward.goTo', { count }) : t('chatForward.go')
})

/** Every opening starts empty: nothing chosen, no words, the box empty (E-024). */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    members.value = []
    groupUuids.value = []
    words.value = ''
    alsoByEmail.value = false
    problem.value = ''
  },
)

/** What went wrong is said until the member changes what they chose. */
watch([members, groupUuids], () => {
  problem.value = ''
})

const close = () => emit('update:modelValue', false)

/** "Gradido-Café Berlin und Carla-Sonne": the conversations chosen, as the member's language lists. */
const namesOf = (names) => {
  try {
    return new Intl.ListFormat(locale.value, { style: 'long', type: 'conjunction' }).format(names)
  } catch {
    return names.join(', ')
  }
}

const go = async () => {
  if (!ready.value || sending.value || !props.message) return
  sending.value = true
  problem.value = ''
  const chosenGroups = groupUuids.value
    .map((uuid) => props.groups.find((group) => group.groupUuid === uuid))
    .filter(Boolean)
  const names = [
    ...chosenGroups.map((group) => group.title),
    ...members.value.map((user) => memberAlias(user.alias, user.gradidoID)),
  ]
  const count = members.value.length + groupUuids.value.length
  try {
    const answer = await forward({
      messageUuid: props.message.messageUuid,
      groupUuids: groupUuids.value,
      members: members.value.map((user) => ({
        gradidoID: user.gradidoID,
        communityUuid: user.communityUuid ?? null,
      })),
      words: words.value.trim() ? words.value : null,
      alsoByEmail: members.value.length > 0 && alsoByEmail.value,
    })
    const copies = answer?.data?.forwardChatMessage ?? []
    if (copies.length === 0) {
      problem.value = t('chatForward.failed')
      return
    }
    if (copies.length === count) {
      toastSuccess(t('chatForward.done', { names: namesOf(names) }))
    } else {
      // Filed in some conversations and not in others: said, and not asked again -- a second
      // press would forward it twice where it went.
      toastError(t('chatForward.partly', { done: copies.length, count }))
    }
    emit('forwarded')
    close()
  } catch {
    problem.value = t('chatForward.failed')
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
/* The message it is about: two lines of it on the muted surface, who wrote it over them. */
.chat-forward-preview {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin: 0 0 1rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.85rem;
  background: var(--surface-muted, #f2f4f6);
  font-size: 0.9rem;
  line-height: 1.4;
}

.chat-forward-preview-icon {
  flex: 0 0 auto;
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.1rem;
  color: var(--gold, #c58d38);
}

.chat-forward-preview-words {
  min-width: 0;
}

.chat-forward-preview-who {
  display: block;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.75rem;
  font-weight: 600;
}

.chat-forward-preview-text {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* ⚠️ 16 px: Safari on the iPhone zooms into any smaller field the moment it is touched. */
.chat-forward-words {
  font-size: 1rem;
}

.chat-forward-go[aria-disabled='true'] {
  opacity: 0.65;
  cursor: default;
}
</style>
