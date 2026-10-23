// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { BButton, BFormTextarea } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  ref,
  TransitionGroup,
  withKeys,
  withModifiers,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import IBiCopy from '~icons/bi/copy'
import IIcBaselineClose from '~icons/ic/baseline-close'
import {
  deleteThread,
  resumeChat,
  sendMessage as sendMessageMutation,
} from '../graphql/aiChat.graphql'
import classes from './AiChat.module.css'

interface ChatMessage {
  content: string
  role: 'user' | 'assistant'
  threadId?: string | null
  errorCode?: string | null
}

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

export const AiChat = defineComponent({
  name: 'AiChat',
  setup() {
    const { t } = useI18n()
    const { toastError, toastSuccess } = useAppToast()
    // Every call passes its variables to mutate(). The .vue also handed `{ input: ref('') }`
    // and `{ threadId: ref('') }` as the second argument, which is useMutation's options, not
    // its variables, so Apollo ignored them; TypeScript rejects them, and they are gone.
    const response = useMutation(sendMessageMutation)
    const deleteResponse = useMutation(deleteThread)
    const { result: resumeChatResult, refetch: resumeChatRefetch } = useQuery(resumeChat)

    const isChatOpen = ref(false)
    const chatContainer = ref<HTMLElement | null>(null)
    const chatInput = ref<{ element?: HTMLTextAreaElement | null } | null>(null)
    const newMessage = ref('')
    const threadId = ref('')
    const messages = ref<ChatMessage[]>([])
    const loading = ref(false)
    const clearing = ref(false)
    const hasBeenOpened = ref(false)
    const buttonText = computed(() => t('send') + (loading.value ? '...' : ''))
    const textareaPlaceholder = computed(() =>
      loading.value ? t('ai.chat-placeholder-loading') : t('ai.chat-placeholder'),
    )

    const moderatorSignature = ref(loadSignature())

    // An error reaches us as a code, not as a sentence — the backend has no business
    // picking the moderator's language. Spelled out one by one so an unknown code falls
    // back to a real sentence instead of showing a raw key.
    const errorText = (code: string) => {
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
    const messageText = (message: ChatMessage) => {
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
          (message) =>
            message.role === 'assistant' && message.content?.includes(SIGNATURE_PLACEHOLDER),
        ),
    )

    const copyToClipboard = (message: ChatMessage) => {
      navigator.clipboard.writeText(messageText(message))
      toastSuccess(t('copied-to-clipboard'))
    }

    const scrollDown = () => {
      nextTick(() => {
        if (!chatContainer.value) {
          return
        }
        chatContainer.value.scrollTo({
          top: chatContainer.value.scrollHeight,
          behavior: 'smooth',
        })
      })
    }

    const openChat = () => {
      isChatOpen.value = true
      // The signature may have been changed in the contribution window since we loaded it.
      moderatorSignature.value = loadSignature()
      if (messages.value.length > 0) {
        scrollDown()
      }
    }

    const closeChat = () => {
      hasBeenOpened.value = true
      isChatOpen.value = false
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
          .then((result) => {
            const reply = result?.data?.sendMessage
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

    // Empties the window and lets Crea greet again. Separate from clearChat because the
    // button has to do this whether or not there was a stored thread to delete.
    const restartChat = () => {
      threadId.value = ''
      messages.value = []
      newMessage.value = BOOTSTRAP_COMMAND
      sendMessage()
    }

    const clearChat = () => {
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
        .then((result) => {
          // `false` means the row was already gone (swept, or cleared in another tab).
          // Nothing to report, but the window still starts over.
          if (result?.data?.deleteThread) {
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
        const failure = error as { graphQLErrors?: { message: string }[] }
        toastError(t('ai.error-load', { error: failure.graphQLErrors?.[0]?.message ?? error }))
        loading.value = false
        return
      }
      // A refetch can fail without throwing, which used to blow up on the next line.
      const messagesFromServer: ChatMessage[] | undefined = resumeChatResult.value?.resumeChat
      if (messagesFromServer && messagesFromServer.length > 0) {
        // An error reply carries no thread id either; an empty one means the next message
        // opens a fresh thread instead of writing into one we could not read.
        threadId.value = messagesFromServer[0].threadId ?? ''
        messages.value = messagesFromServer.filter(
          (message) => message.content !== BOOTSTRAP_COMMAND,
        )
        scrollDown()
        loading.value = false
      } else {
        newMessage.value = BOOTSTRAP_COMMAND
        sendMessage()
      }
    })

    const renderMessage = (message: ChatMessage, index: number) => (
      <div
        // Keyed by position: messages carry no id, as in the .vue.
        key={index}
        // The role and `error` stay plain class names: they come from the data, and the
        // module's rules reach them through :global (AiChat.module.css).
        class={[classes.message, message.role, { error: message.errorCode }]}
      >
        <div class={[classes.messageContent, 'position-relative inner-container']}>
          <span>{messageText(message)}</span>
          {message.role === 'assistant' && !message.errorCode ? (
            <BButton
              variant='light'
              class={classes.copyClipboardButton}
              onClick={() => copyToClipboard(message)}
              title={t('copy-to-clipboard')}
              aria-label={t('copy-to-clipboard')}
            >
              <IBiCopy />
            </BButton>
          ) : null}
        </div>
      </div>
    )

    const renderWindow = () => (
      <div class={classes.chatWindow}>
        <div class='d-flex justify-content-start'>
          {/* A symbol and nothing else: the name is all a screen reader has of it. */}
          <BButton
            variant='light'
            class='chat-close-button mt-1 ms-1 btn-sm'
            aria-label={t('close')}
            onClick={closeChat}
          >
            <IIcBaselineClose />
          </BButton>
        </div>
        <div ref={chatContainer} class={classes.messagesScrollContainer}>
          <TransitionGroup
            tag='div'
            name='chat'
            // Falls through to the <div> the group renders; the types of TransitionGroup know no
            // `class`.
            {...{ class: classes.messages }}
          >
            {messages.value.map(renderMessage)}
          </TransitionGroup>
        </div>
        {signatureMissing.value ? (
          <p class={[classes.signatureHint, 'mb-0 px-2 pt-1 text-muted']}>
            {t('ai.signature-missing')}
          </p>
        ) : null}

        <div class={classes.inputArea}>
          <BFormTextarea
            ref={chatInput}
            v-model={newMessage.value}
            class='fs-6'
            placeholder={textareaPlaceholder.value}
            rows='4'
            noResize
            disabled={loading.value}
            // Ctrl+Enter and, on a Mac, Cmd+Enter send; Enter alone starts a new line. Two
            // listeners, as the template had them -- an array the types of onKeydown do not take.
            {...({
              onKeydown: [
                withKeys(withModifiers(sendMessage, ['ctrl', 'prevent']), ['enter']),
                withKeys(withModifiers(sendMessage, ['meta', 'prevent']), ['enter']),
              ],
            } as object)}
          />
          <BButton variant='light' disabled={loading.value} onClick={sendMessage}>
            {buttonText.value}
          </BButton>
        </div>
        <div class='d-flex justify-content-start'>
          <BButton
            variant='light'
            class={classes.chatClearButton}
            disabled={loading.value || clearing.value}
            onClick={clearChat}
          >
            {t('ai.chat-clear')}
          </BButton>
        </div>
      </div>
    )

    return () => (
      <div class={classes.chatContainer}>
        {!isChatOpen.value ? (
          // ⚠️ No variant: the .vue bound `:variant="light"`, a name defined nowhere, so the
          // button has always had BButton's default. Kept as it was.
          // A picture of Crea and no word: the name and the tooltip say what it does.
          <BButton
            class={[
              classes.chatToggleButton,
              classes.bgCreaImg,
              { [classes.slideUpAnimation]: !hasBeenOpened.value },
            ]}
            aria-label={t('ai.chat-open')}
            title={t('ai.chat-open')}
            onClick={openChat}
          />
        ) : null}

        {isChatOpen.value ? renderWindow() : null}
      </div>
    )
  },
})
