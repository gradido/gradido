<template>
  <div class="chat-container">
    <b-button
      v-if="!isChatOpen"
      :class="['chat-toggle-button', 'bg-crea-img', { 'slide-up-animation': !hasBeenOpened }]"
      :variant="light"
      @click="openChat"
    ></b-button>

    <div v-if="isChatOpen" class="chat-window">
      <div class="d-flex justify-content-start">
        <b-button variant="light" class="chat-close-button mt-1 ms-1 btn-sm" @click="closeChat">
          <IIcBaselineClose />
        </b-button>
      </div>
      <div ref="chatContainer" class="messages-scroll-container">
        <TransitionGroup class="messages" tag="div" name="chat">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message', message.role, { error: message.errorCode }]"
          >
            <div class="message-content position-relative inner-container">
              <span>{{ messageText(message) }}</span>
              <b-button
                v-if="message.role === 'assistant' && !message.errorCode"
                variant="light"
                class="copy-clipboard-button"
                :title="$t('copy-to-clipboard')"
                :aria-label="$t('copy-to-clipboard')"
                @click="copyToClipboard(message)"
              >
                <IBiCopy></IBiCopy>
              </b-button>
            </div>
          </div>
        </TransitionGroup>
      </div>
      <p v-if="signatureMissing" class="signature-hint mb-0 px-2 pt-1 text-muted">
        {{ $t('ai.signature-missing') }}
      </p>
      <!--<div class="d-flex justify-content-end position-absolute top-0 start-0">
        <b-button variant="light" class="chat-close-button mt-1 ms-1 btn-sm" @click="closeChat">
          <IIcBaselineClose />
        </b-button>
      </div> -->

      <div class="input-area">
        <BFormTextarea
          ref="chatInput"
          v-model="newMessage"
          class="fs-6"
          :placeholder="textareaPlaceholder"
          rows="4"
          no-resize
          :disabled="loading"
          @keydown.ctrl.enter.prevent="sendMessage"
          @keydown.meta.enter.prevent="sendMessage"
        ></BFormTextarea>
        <b-button variant="light" :disabled="loading" @click="sendMessage">
          {{ buttonText }}
        </b-button>
      </div>
      <div class="d-flex justify-content-start">
        <b-button
          variant="light"
          class="chat-clear-button"
          :disabled="loading || clearing"
          @click="clearChat"
        >
          {{ $t('ai.chat-clear') }}
        </b-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@vue/apollo-composable'
import {
  sendMessage as sendMessageMutation,
  resumeChat,
  deleteThread,
} from '../graphql/aiChat.graphql'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()
const { toastError, toastSuccess } = useAppToast()
const response = useMutation(sendMessageMutation, { input: ref('') })
const deleteResponse = useMutation(deleteThread, { threadId: ref('') })
const { result: resumeChatResult, refetch: resumeChatRefetch } = useQuery(resumeChat)

const isChatOpen = ref(false)
const chatContainer = ref(null)
const chatInput = ref(null)
const newMessage = ref('')
const threadId = ref('')
const messages = ref([])
const loading = ref(false)
const clearing = ref(false)
const hasBeenOpened = ref(false)
const buttonText = computed(() => t('send') + (loading.value ? '...' : ''))
const textareaPlaceholder = computed(() =>
  loading.value ? t('ai.chat-placeholder-loading') : t('ai.chat-placeholder'),
)

// The one message the interface sends rather than the moderator: it opens a fresh chat
// and Crea answers it with her greeting. A fixed, untranslated marker on purpose - the
// greeting itself lives in the chat ruleset in the backend, so it is written once, and
// hiding this turn cannot break when the moderator switches the admin language.
const BOOTSTRAP_COMMAND = '/start'

// The moderator's signature lives only in the browser (E-014), exactly as in the
// contribution window: Crea closes with the placeholder and it is filled in here, so
// the moderator's own name never reaches the API.
const SIGNATURE_STORAGE_KEY = 'crea.moderatorSignature'
const SIGNATURE_PLACEHOLDER = '[SIGNATUR]'

const loadSignature = () => {
  try {
    return localStorage.getItem(SIGNATURE_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}
const moderatorSignature = ref(loadSignature())

// An error reaches us as a code, not as a sentence — the backend has no business
// picking the moderator's language. Spelled out one by one so an unknown code falls
// back to a real sentence instead of showing a raw key.
function errorText(code) {
  if (code === 'api_inactive') {
    return t('ai.error-api-inactive')
  }
  if (code === 'thread_not_found') {
    return t('ai.error-thread-not-found')
  }
  if (code === 'output_too_long') {
    return t('ai.error-output-too-long')
  }
  if (code === 'send_failed') {
    return t('ai.error-send-failed')
  }
  return t('ai.error-unknown')
}

// What the moderator reads, and what the copy button copies: the same string, so he
// never mails a placeholder he could not see. Rendered as text, not markup - Crea
// writes plain prose and the line breaks are handled by `white-space: pre-wrap`.
//
// Only Crea's own messages are substituted. The placeholder is her convention, and what
// the moderator pasted is someone else's words - rewriting those would put his signature
// into a participant's sentence.
function messageText(message) {
  if (message.errorCode) {
    return errorText(message.errorCode)
  }
  return moderatorSignature.value && message.role === 'assistant'
    ? message.content.split(SIGNATURE_PLACEHOLDER).join(moderatorSignature.value)
    : message.content
}

// The placeholder is only left standing when there is no signature to put in its place.
// Saying so is better than quietly dropping it: the moderator is about to copy this text
// into a mail, and the field that fixes it sits in the Crea window of any contribution.
const signatureMissing = computed(
  () =>
    !moderatorSignature.value &&
    messages.value.some(
      (message) => message.role === 'assistant' && message.content?.includes(SIGNATURE_PLACEHOLDER),
    ),
)

function copyToClipboard(message) {
  navigator.clipboard.writeText(messageText(message))
  toastSuccess(t('copied-to-clipboard'))
}

function openChat() {
  isChatOpen.value = true
  // The signature may have been changed in the contribution window since we loaded it.
  moderatorSignature.value = loadSignature()
  if (messages.value.length > 0) {
    scrollDown()
  }
}

function closeChat() {
  hasBeenOpened.value = true
  isChatOpen.value = false
}

// Empties the window and lets Crea greet again. Separate from clearChat because the
// button has to do this whether or not there was a stored thread to delete.
function restartChat() {
  threadId.value = ''
  messages.value = []
  newMessage.value = BOOTSTRAP_COMMAND
  sendMessage()
}

function clearChat() {
  // The button is disabled while either of these runs, so this only catches the double
  // click that lands before Vue repaints. It matters most before the first answer: with
  // no thread yet, clearing goes straight to `restartChat`, and two of those send two
  // `/start` messages whose answers then open two threads for one moderator.
  if (loading.value || clearing.value) {
    return
  }
  // No stored thread — either nothing has been sent yet, or an error reply left us
  // without an id. The button still has to give the fresh start it promises; the
  // thread_not_found text sends the moderator here for exactly that.
  if (!threadId.value) {
    restartChat()
    return
  }
  clearing.value = true
  deleteResponse
    .mutate({ threadId: threadId.value })
    .then(({ data }) => {
      // `false` means the row was already gone (swept, or cleared in another tab).
      // Nothing to report, but the window still starts over.
      if (data?.deleteThread) {
        toastSuccess(t('ai.chat-thread-deleted'))
      }
      restartChat()
    })
    .catch((error) => {
      // The delete failed, so we do not know what is stored. Leave the window as it is
      // rather than showing an empty chat over a thread that still exists.
      toastError(t('ai.error-chat-thread-deleted', { error }))
    })
    .finally(() => {
      clearing.value = false
    })
}

function scrollDown() {
  nextTick(() => {
    if (!chatContainer.value) return
    chatContainer.value.scrollTo({
      top: chatContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  })
}

const sendMessage = () => {
  if (newMessage.value.trim()) {
    // Take the focus off the field before clearing it, or the text comes back.
    // Why: `loading` puts the field on `disabled` right away, a disabled field loses the
    // focus, and the browser fires `change` with the DOM value while it does. That value
    // is still the old text, because Vue only writes the clearing on the next tick — and
    // bootstrap-vue-next's `change` handler writes back into the model any value that
    // differs from it. Blur first and model and field still agree at `change`, so nothing
    // is written back. This is exactly why the send button was never affected: a click
    // takes the focus away by itself.
    chatInput.value?.element?.blur()
    loading.value = true
    if (newMessage.value !== BOOTSTRAP_COMMAND) {
      messages.value.push({ content: newMessage.value, role: 'user' })
      scrollDown()
    }
    response
      .mutate({ input: { message: newMessage.value, threadId: threadId.value } })
      .then(({ data }) => {
        const reply = data?.sendMessage
        if (reply) {
          // An error reply carries no thread id. Taking it would cut us loose from the
          // running thread — and with it disable the very button the error text asks the
          // moderator to press.
          if (reply.threadId) {
            threadId.value = reply.threadId
          }
          messages.value.push(reply)
        }
        scrollDown()
      })
      .catch((error) => {
        toastError(t('ai.error-send', { error: error.message }))
      })
      .finally(() => {
        loading.value = false
      })
    newMessage.value = ''
  }
}

onMounted(async () => {
  if (messages.value.length > 0) {
    return
  }
  loading.value = true
  try {
    await resumeChatRefetch()
  } catch (error) {
    // Every failure ends here, including one without graphQLErrors. Falling through
    // would open a second thread over a conversation we simply could not load.
    toastError(t('ai.error-load', { error: error.graphQLErrors?.[0]?.message ?? error }))
    loading.value = false
    return
  }
  // A refetch can fail without throwing, which used to blow up on the next line.
  const messagesFromServer = resumeChatResult.value?.resumeChat
  if (messagesFromServer && messagesFromServer.length > 0) {
    // An error reply carries no thread id either; an empty one means the next message
    // opens a fresh thread instead of writing into one we could not read.
    threadId.value = messagesFromServer[0].threadId ?? ''
    messages.value = messagesFromServer.filter((message) => message.content !== BOOTSTRAP_COMMAND)
    scrollDown()
    loading.value = false
  } else {
    newMessage.value = BOOTSTRAP_COMMAND
    sendMessage()
  }
})
</script>

<style scoped>
.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  font-size: 12px;
}

.chat-toggle-button {
  position: absolute;
  bottom: 0;
  right: 0;
  border: 1px solid darkblue;
}

.chat-clear-button {
  font-size: 12px;
}

/* Half the former 250x142: the button sat over the contribution list and got in the way. */
.bg-crea-img {
  background-image: url('../../public/img/Crea.webp');
  background-size: cover;
  background-position: center;
  width: 125px;
  height: 71px;
  z-index: 100;
}

.chat-window {
  width: 550px;

  /* Crea's chat answers are letters now - paragraphs, a salutation and a closing line,
     the same shape as in the contribution window. Half again as much room for the
     conversation, and a four-row input, because what gets pasted in here is a whole
     contribution. */
  height: 480px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgb(0 0 0 / 10%);
  display: flex;
  flex-direction: column;
}

.copy-clipboard-button {
  position: absolute;
  top: 20%;
  right: -12%;
  padding-top: 2px;
  padding-left: 6px;
  padding-right: 6px;
}

.messages-scroll-container {
  border-radius: 8px;
  flex: 1;
  overflow-y: auto;
}

.messages {
  padding: 10px;
  background-color: #f9f9f9;
}

.message {
  margin-bottom: 10px;
}

.message-content {
  padding: 8px;
  border-radius: 8px;
  max-width: 80%;
  word-wrap: break-word;

  /* Crea's line breaks come through as text, so the message needs no markup at all. */
  white-space: pre-wrap;
}

.signature-hint {
  font-size: 11px;
}

.message.user {
  text-align: right;
}

.message.user .message-content {
  background-color: white;
  color: black;
  margin-left: auto;
  border: 1px solid #e9ecef;
}

.message.assistant {
  text-align: left;
}

.message.assistant .message-content {
  background-color: #e9ecef;
  color: black;
  margin-right: auto;
}

.message.error {
  text-align: center;
}

.message.error .message-content {
  background-color: #f1e5e5;
  color: rgb(194 12 12);
  margin-left: auto;
  margin-right: auto;
}

.input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #ccc;
  background-color: white;
}

.input-area textarea {
  flex: 1;
  margin-right: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  padding: 8px;
}

.input-area button {
  border-radius: 4px;
}

/* Animations für den Einblendeffekt */
.chat-enter-active,
.chat-leave-active {
  transition:
    transform 0.5s ease-out,
    opacity 0.5s;
}

.chat-enter-from {
  transform: translateY(30px);
  opacity: 0;
}

.chat-enter-to {
  transform: translateY(0);
  opacity: 1;
}

.slide-up-animation {
  animation: slide-up 1s ease-out;
  opacity: 1;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}
</style>
