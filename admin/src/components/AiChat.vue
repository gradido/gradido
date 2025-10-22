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
            :class="['message', message.role, { 'message-error': message.isError }]"
          >
            <div class="message-content position-relative inner-container">
              <span v-html="formatMessage(message)"></span>
              <b-button
                v-if="message.role === 'assistant'"
                variant="light"
                class="copy-clipboard-button"
                :title="$t('copy-to-clipboard')"
                @click="copyToClipboard(message.content)"
              >
                <IBiCopy></IBiCopy>
              </b-button>
            </div>
          </div>
        </TransitionGroup>
      </div>
      <!--<div class="d-flex justify-content-end position-absolute top-0 start-0">
        <b-button variant="light" class="chat-close-button mt-1 ms-1 btn-sm" @click="closeChat">
          <IIcBaselineClose />
        </b-button>
      </div> -->

      <div class="input-area">
        <BFormTextarea
          v-model="newMessage"
          class="fs-6"
          :placeholder="textareaPlaceholder"
          rows="2"
          no-resize
          :disabled="loading"
          @keydown.ctrl.enter="sendMessage"
          @keydown.meta.enter="sendMessage"
        ></BFormTextarea>
        <b-button variant="light" :disabled="loading" @click="sendMessage">
          {{ buttonText }}
        </b-button>
      </div>
      <div class="d-flex justify-content-start">
        <b-button variant="light" class="chat-clear-button" @click="clearChat">
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
const newMessage = ref('')
const threadId = ref('')
const messages = ref([])
const loading = ref(false)
const hasBeenOpened = ref(false)
const buttonText = computed(() => t('send') + (loading.value ? '...' : ''))
const textareaPlaceholder = computed(() =>
  loading.value ? t('ai.chat-placeholder-loading') : t('ai.chat-placeholder'),
)

function formatMessage(message) {
  return message.content.replace(/\n/g, '<br>')
}

function copyToClipboard(content) {
  navigator.clipboard.writeText(content)
  toastSuccess(t('copied-to-clipboard'))
}

function openChat() {
  isChatOpen.value = true
  if (messages.value.length > 0) {
    scrollDown()
  }
}

function closeChat() {
  hasBeenOpened.value = true
  isChatOpen.value = false
}

// clear
function clearChat() {
  if (threadId.value && threadId.value.length > 0) {
    // delete thread on closing chat
    deleteResponse
      .mutate({ threadId: threadId.value })
      .then((result) => {
        threadId.value = ''
        messages.value = []
        if (result.data.deleteThread) {
          toastSuccess(t('ai.chat-thread-deleted'))
          newMessage.value = t('ai.start-prompt')
          sendMessage()
        }
      })
      .catch((error) => {
        toastError(t('ai.error-chat-thread-deleted', { error }))
      })
  }
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
    loading.value = true
    if (newMessage.value !== t('ai.start-prompt')) {
      messages.value.push({ content: newMessage.value, role: 'user' })
      scrollDown()
    }
    response
      .mutate({ input: { message: newMessage.value, threadId: threadId.value } })
      .then(({ data }) => {
        if (data && data.sendMessage) {
          threadId.value = data.sendMessage.threadId
          messages.value.push(data.sendMessage)
        }
        loading.value = false
        scrollDown()
      })
      .catch((error) => {
        loading.value = false
        toastError('Error sending message:', error)
      })
    newMessage.value = ''
  }
}

onMounted(async () => {
  if (messages.value.length === 0) {
    loading.value = true
    try {
      await resumeChatRefetch()
    } catch (error) {
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        toastError(`Error loading chat: ${error.graphQLErrors[0].message}`)
        return
      } else {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(error, null, 2))
        toastError(`Error loading chat: ${error}`)
      }
    }
    const messagesFromServer = resumeChatResult.value.resumeChat
    if (messagesFromServer && messagesFromServer.length > 0) {
      threadId.value = messagesFromServer[0].threadId
      messages.value = messagesFromServer.filter(
        (message) => message.content !== t('ai.start-prompt'),
      )
      scrollDown()
      loading.value = false
    } else {
      newMessage.value = t('ai.start-prompt')
      sendMessage()
    }
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

.bg-crea-img {
  background-image: url('../../public/img/Crea.webp');
  background-size: cover;
  background-position: center;
  width: 250px;
  height: 142px;
  z-index: 100;
}

.chat-window {
  width: 550px;
  height: 330px;
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
