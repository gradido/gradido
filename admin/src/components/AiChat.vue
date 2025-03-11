<template>
  <div class="chat-container">
    <!-- Chat-Toggle-Button -->
    <b-button class="chat-toggle-button" variant="primary" @click="toggleChat">
      {{ isChatOpen ? 'Schließen' : 'Chat öffnen' }}
    </b-button>

    <!-- Chat-Fenster -->
    <div v-if="isChatOpen" class="chat-window">
      <!-- Nachrichtenbereich -->
      <div class="messages">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.sender]">
          <div class="message-content">
            {{ message.text }}
          </div>
        </div>
      </div>

      <!-- Eingabebereich -->
      <div class="input-area">
        <BFormTextarea
          v-model="newMessage"
          placeholder="Schreibe eine Nachricht..."
          rows="3"
          no-resize
          @keyup.enter="sendMessage"
        ></BFormTextarea>
        <b-button variant="primary" @click="sendMessage">Senden</b-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Zustand für den Chat
const isChatOpen = ref(false)
const newMessage = ref('')
const messages = ref([])

// Funktionen
const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value
}

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.value.push({ text: newMessage.value, sender: 'user' })
    newMessage.value = ''
    // Hier könntest du eine Antwort vom Server simulieren
    setTimeout(() => {
      messages.value.push({ text: 'Das ist eine automatische Antwort.', sender: 'bot' })
    }, 1000)
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
}

.chat-window {
  width: 300px;
  height: 400px;
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

.message.bot {
  text-align: left;
}

.message.bot .message-content {
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
