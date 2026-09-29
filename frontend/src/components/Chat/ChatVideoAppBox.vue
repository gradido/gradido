<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- On a line of its own under the button it changes (Bernd, 26.09.2026), at the right, where
       the button ends. The same box in both questions: starting a call and joining one. -->
  <div class="w-100 d-flex justify-content-end">
    <ChatCheck
      v-model="inApp"
      box-test="chat-video-app-box"
      :title="$t('chatThread.videoInAppHint')"
      @change="(ticked) => rememberChatVideoInApp(store.state.gradidoID, ticked)"
    >
      {{ $t('chatThread.videoStartInApp') }}
    </ChatCheck>
  </div>
</template>

<script setup>
import { defineModel } from 'vue'
import { useStore } from 'vuex'
import ChatCheck from '@/components/Chat/ChatCheck.vue'
import { rememberChatVideoInApp } from '@/utils/chatVideoApp'

/**
 * The box "Start in the Jitsi app" under a video call's button (V4b, on a computer only):
 * ticked, the call is opened in the app instead of the browser. What it is ticked at comes from
 * the dialog, which reads what the member left it at when it opens (`readChatVideoInApp`); every
 * change is remembered at once, for the member on this device (chatVideoApp).
 */
const inApp = defineModel({ type: Boolean, default: false })
const store = useStore()
</script>
