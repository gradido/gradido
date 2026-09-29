<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- "Neue Gruppe" (P5, the mockup): a name, and the member's own contacts to take in. A sheet on
       a phone, a dialog on a desk whose list scrolls between the name and the buttons
       (`scrollable`). No header, so the title stands in the body and the dialog is named by
       `aria-label`; its own footer, so "Gruppe anlegen" can wait while it is on its way.

       The name field takes the focus when the dialog opens -- BModal's focus trap gives it the
       first stop -- and here that is right: the name is the first thing to write (unlike the
       question before a video call, where a field was a mere addition). -->
  <BModal
    :model-value="modelValue"
    fullscreen="sm"
    scrollable
    lazy
    no-header
    :aria-label="t('chatGroup.newTitle')"
    data-test="chat-group-create"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="h5 mb-3" data-test="chat-group-create-title">{{ t('chatGroup.newTitle') }}</p>
    <label class="form-label" :for="nameId">{{ t('chatGroup.name') }}</label>
    <input
      :id="nameId"
      v-model="title"
      type="text"
      class="form-control"
      :maxlength="CHAT_GROUP_TITLE_MAX"
      :placeholder="t('chatGroup.namePlaceholder')"
      autocomplete="off"
      data-test="chat-group-create-name"
    />
    <chat-group-picker v-model="members" class="mt-3" :contacts="contacts" />
    <!-- What taking somebody in means for them (E-049): a mail, and they can leave. -->
    <p class="small text-muted mt-3 mb-0" data-test="chat-group-create-hint">
      {{ t('chatGroup.newHint') }}
    </p>
    <p v-if="problem" class="mt-3 mb-0" role="alert" data-test="chat-group-create-problem">
      {{ problem }}
    </p>
    <template #footer>
      <BButton variant="secondary" data-test="chat-group-create-cancel" @click="close">
        {{ t('form.cancel') }}
      </BButton>
      <!-- `aria-disabled`, not `disabled`: a focused button that is disabled loses its focus, and
           the press is turned away in the handler instead. -->
      <BButton
        variant="gradido"
        class="chat-group-create-go"
        :aria-disabled="ready && !creating ? 'false' : 'true'"
        data-test="chat-group-create-go"
        @click="create"
      >
        {{ t('chatGroup.create') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { computed, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { BButton, BModal } from 'bootstrap-vue-next'
import ChatGroupPicker from '@/components/ChatGroups/ChatGroupPicker.vue'
import {
  CHAT_GROUP_TITLE_MAX,
  chatGroupRefusal,
  chatGroupTitle,
  isChatGroupTitle,
} from '@/components/ChatGroups/chatGroupDisplay'
import { createChatGroup } from '@/graphql/chatGroups.graphql'

/**
 * Opens a chat group (P5): the member names it and chooses from their own contacts (E-049); the
 * server opens it with the member as its owner and mails everybody taken in.
 *
 * `contacts` is the contact list the page holds. `created` hands the new group up -- as
 * chatGroupsQuery would deliver it -- and the page opens its window.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  contacts: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'created'])

const { t } = useI18n()
const { mutate: open } = useMutation(createChatGroup)
const nameId = `${useId()}-name`

const title = ref('')
/** The contacts chosen: their `user`s, as the picker hands them. */
const members = ref([])
const creating = ref(false)
/** Why the last try did not open a group, in the member's words; '' while nothing went wrong. */
const problem = ref('')

/** A name the server takes, and somebody to take in (the mockup). */
const ready = computed(() => isChatGroupTitle(title.value) && members.value.length > 0)

/** Every opening starts empty: a group opened, or one given up, leaves nothing behind. */
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    title.value = ''
    members.value = []
    problem.value = ''
  },
)

/** What went wrong is said until the member changes what was refused. */
watch([title, members], () => {
  problem.value = ''
})

const close = () => emit('update:modelValue', false)

const create = async () => {
  if (!ready.value || creating.value) return
  creating.value = true
  problem.value = ''
  try {
    const answer = await open({
      title: chatGroupTitle(title.value),
      members: members.value.map((user) => ({
        gradidoID: user.gradidoID,
        communityUuid: user.communityUuid ?? null,
      })),
    })
    const group = answer?.data?.createChatGroup
    if (!group) {
      problem.value = t('chatGroup.refused')
      return
    }
    emit('created', group)
    close()
  } catch (error) {
    problem.value = chatGroupRefusal(error, { t })
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.chat-group-create-go[aria-disabled='true'] {
  opacity: 0.65;
  cursor: default;
}
</style>
