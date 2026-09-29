<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div data-test="chat-video-app-missed">
    <!-- `role="alert"`: said when it is put in, as the question's other problems are. -->
    <p class="mb-2" role="alert">{{ $t('chatThread.videoAppMissed') }}</p>
    <p class="mb-1">
      <a
        :href="room"
        target="_blank"
        rel="noopener noreferrer"
        data-test="chat-video-app-missed-room"
      >
        {{ $t('chatThread.videoOpenInBrowser') }}
      </a>
    </p>
    <p class="mb-0">
      <a
        :href="JITSI_APP_DOWNLOADS"
        target="_blank"
        rel="noopener noreferrer"
        data-test="chat-video-app-download"
      >
        {{ $t('chatThread.videoAppDownload') }}
      </a>
    </p>
  </div>
</template>

<script setup>
import { JITSI_APP_DOWNLOADS } from '@/utils/chatVideoApp'

/**
 * Where the room was handed to the Jitsi app and no sign came that it opened
 * (`watchJitsiAppOpening`, V4b): the question says so, and offers the room in the browser and the
 * app's download page. Perhaps the app is not installed; perhaps it opened unseen -- the sentence
 * asks rather than claims.
 */
defineProps({
  /** The room's address for the browser. ⛔ The call's secret: shown here, kept nowhere. */
  room: { type: String, required: true },
})
</script>
