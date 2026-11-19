// AI-GENERATED — not an architecture reference
import { defineComponent, useModel } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatCheck } from '@/components/Chat/ChatCheck'
import { useWalletStore } from '@/store/useWalletStore'
import { rememberChatVideoInApp } from '@/utils/chatVideoApp'

/**
 * The box "Start in the Jitsi app" under a video call's button (V4b, on a computer only):
 * ticked, the call is opened in the app instead of the browser. What it is ticked at comes from
 * the dialog, which reads what the member left it at when it opens (`readChatVideoInApp`); every
 * change is remembered at once, for the member on this device (chatVideoApp).
 */
export const ChatVideoAppBox = defineComponent({
  name: 'ChatVideoAppBox',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props) {
    const { t } = useI18n()
    const inApp = useModel(props, 'modelValue')
    const store = useWalletStore()

    return () => (
      // On a line of its own under the button it changes (Bernd, 26.09.2026), at the right, where
      // the button ends. The same box in both questions: starting a call and joining one.
      <div class='w-100 d-flex justify-content-end'>
        <ChatCheck
          v-model={inApp.value}
          boxTest='chat-video-app-box'
          title={t('chatThread.videoInAppHint')}
          // `change` carries the box's own state (ChatCheck). The attribute is typed as the native
          // event's as well (vue-attributes.d.ts), which never comes here: only `true` is a tick.
          onChange={(ticked: boolean | Event) =>
            rememberChatVideoInApp(store.gradidoID, ticked === true)
          }
        >
          {t('chatThread.videoStartInApp')}
        </ChatCheck>
      </div>
    )
  },
})
