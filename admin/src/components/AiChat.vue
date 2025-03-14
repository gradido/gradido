<template>
  <div class="chat-container">
    <b-button class="chat-toggle-button" :variant="toggleButtonVariant" @click="toggleChat">
      {{ isChatOpen ? $t('close') : $t('ai.chat-open') }}
    </b-button>

    <div v-if="isChatOpen" class="chat-window">
      <div class="messages">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
          <div class="message-content">
            {{ message.content }}
          </div>
        </div>
      </div>

      <div class="input-area">
        <BFormTextarea
          v-model="newMessage"
          :placeholder="$t('ai.chat-placeholder')"
          rows="3"
          no-resize
          :disabled="loading"
          @keyup.enter="sendMessage"
        ></BFormTextarea>
        <b-button variant="primary" :disabled="loading" @click="sendMessage">
          {{ buttonText }}
        </b-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { sendMessage as sendMessageMutation } from '../graphql/aiChat.graphql'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()
const { toastError } = useAppToast()
const response = useMutation(sendMessageMutation, { input: ref('') })

const isChatOpen = ref(false)
const newMessage = ref('')
const threadId = ref('')
const messages = ref([])
const loading = ref(false)
const buttonText = computed(() => t('send') + (loading.value ? '...' : ''))
const toggleButtonVariant = computed(() => (isChatOpen.value ? 'secondary' : 'primary'))

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value
}

const sendMessage = () => {
  if (newMessage.value.trim()) {
    loading.value = true
    messages.value.push({ content: newMessage.value, role: 'user' })
    response
      .mutate({ input: { message: newMessage.value, threadId: threadId.value } })
      .then(({ data }) => {
        if (data && data.sendMessage) {
          threadId.value = data.sendMessage.threadId
          messages.value.push(data.sendMessage)
        }
        loading.value = false
      })
      .catch((error) => {
        loading.value = false
        toastError('Error sending message:', error)
      })
    newMessage.value = ''
  }
}
</script>

<style scoped>
.chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chat-toggle-button {
  position: absolute;
  bottom: 0;
  right: 0;
  border: 1px solid darkblue;
}

.chat-window {
  width: 450px;
  height: 600px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
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
  background-color: #007bff;
  color: white;
  margin-left: auto;
}

.message.assistant {
  text-align: left;
}

.message.assistant .message-content {
  background-color: #e9ecef;
  color: black;
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
</style>
