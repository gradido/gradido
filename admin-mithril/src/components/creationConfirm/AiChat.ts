// AI-GENERATED — not an architecture reference
import classes from '@admin/components/AiChat.module.css'
import { deleteThread, resumeChat, sendMessage } from '@admin/graphql/aiChat.graphql'
import m, { type ClassComponent, type VnodeDOM } from 'mithril'
import * as v from 'valibot'
import { toastError, toastSuccess } from '@/components/Toasts'
import {
  BOOTSTRAP_COMMAND,
  chatErrorKey,
  resumed,
  signatureMissing,
  withSignature,
} from '@/data/AiChat.logic'
import { type ChatMessage, chatMessageSchema } from '@/data/AiChat.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { creaSignature } from '@/store/creaDrafts.store'
import copyIcon from '~icons/bi/copy'
import closeIcon from '~icons/ic/baseline-close'

// A new message slides in, as Vue's TransitionGroup let it; AiChat.module.css has the classes.
const slideIn = ({ dom }: VnodeDOM) => {
  dom.classList.add('chat-enter-from', 'chat-enter-active')
  requestAnimationFrame(() =>
    requestAnimationFrame(() => dom.classList.replace('chat-enter-from', 'chat-enter-to')),
  )
  dom.addEventListener(
    'transitionend',
    () => dom.classList.remove('chat-enter-active', 'chat-enter-to'),
    {
      once: true,
    },
  )
}

/**
 * Crea's chat in the corner of the contributions page: the moderator's running conversation with
 * her. The last one is taken up as the page loads; where there is none, Crea is asked for her
 * greeting at once -- on purpose: her answer takes a moment, and the moderator who has Crea is
 * meant to use her.
 */
export class AiChat implements ClassComponent {
  private open = false
  private hasBeenOpened = false
  private messages: ChatMessage[] = []
  private threadId = ''
  private draft = ''
  private loading = true
  private clearing = false
  private signature = creaSignature()
  // the messages there as the window opened: they stand, the later ones slide in
  private standing = 0
  private scrollDown = false
  private gone = false

  async oninit() {
    const answer = await graphqlRequest(resumeChat)
    if (this.gone) {
      return
    }
    if (!answer.success) {
      toastError(t('ai.error-load', { error: answer.error.message }))
      this.loading = false
    } else {
      const stored = v.parse(v.object({ resumeChat: v.array(chatMessageSchema) }), answer.value)
      if (stored.resumeChat.length > 0) {
        ;({ threadId: this.threadId, messages: this.messages } = resumed(stored.resumeChat))
        this.scrollDown = true
        this.loading = false
      } else {
        this.send(BOOTSTRAP_COMMAND)
      }
    }
    m.redraw()
  }

  onremove() {
    this.gone = true
  }

  private async send(text: string) {
    this.loading = true
    if (text !== BOOTSTRAP_COMMAND) {
      this.messages.push({ content: text, role: 'user', threadId: null, errorCode: null })
      this.scrollDown = true
    }
    const answer = await graphqlRequest(sendMessage, {
      input: { message: text, threadId: this.threadId },
    })
    if (this.gone) {
      return
    }
    this.loading = false
    if (answer.success) {
      const reply = v.parse(v.object({ sendMessage: chatMessageSchema }), answer.value).sendMessage
      // an error reply has no conversation: taking its none would cut the chat loose from it
      if (reply.threadId) {
        this.threadId = reply.threadId
      }
      this.messages.push(reply)
      this.scrollDown = true
    } else {
      toastError(t('ai.error-send', { error: answer.error.message }))
    }
    m.redraw()
  }

  private sendDraft() {
    if (this.draft.trim()) {
      const text = this.draft
      this.draft = ''
      this.send(text)
    }
  }

  // an empty window, and Crea greets anew
  private restart() {
    this.threadId = ''
    this.messages = []
    this.standing = 0
    this.draft = ''
    this.send(BOOTSTRAP_COMMAND)
  }

  private async clear() {
    // pressed twice before the redraw: two greetings would open two conversations
    if (this.loading || this.clearing) {
      return
    }
    // none stored -- nothing sent yet, or an error left none: the fresh start all the same
    if (!this.threadId) {
      this.restart()
      return
    }
    this.clearing = true
    const answer = await graphqlRequest(deleteThread, { threadId: this.threadId })
    if (this.gone) {
      return
    }
    this.clearing = false
    if (answer.success) {
      // false: gone already, swept or cleared in another tab -- nothing to tell
      if (v.parse(v.object({ deleteThread: v.boolean() }), answer.value).deleteThread) {
        toastSuccess(t('ai.chat-thread-deleted'))
      }
      this.restart()
    } else {
      // what is stored is unknown: the window stays as it is
      toastError(t('ai.error-chat-thread-deleted', { error: answer.error.message }))
    }
    m.redraw()
  }

  private async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toastSuccess(t('copied-to-clipboard'))
    } catch {
      toastError(t('crea.copyFailed'))
    }
  }

  view() {
    return m('div', { class: classes.chatContainer }, [
      this.open
        ? this.chatWindow()
        : // a picture of Crea and no word: the name and the title say what it does
          m('button.btn.btn-md.btn-secondary', {
            type: 'button',
            class: [
              classes.chatToggleButton,
              classes.bgCreaImg,
              this.hasBeenOpened ? '' : classes.slideUpAnimation,
            ].join(' '),
            'aria-label': t('ai.chat-open'),
            title: t('ai.chat-open'),
            onclick: () => {
              this.open = true
              // the signature may have changed in Crea's window meanwhile
              this.signature = creaSignature()
              this.standing = this.messages.length
              this.scrollDown = this.messages.length > 0
            },
          }),
    ])
  }

  private chatWindow() {
    const scroll = ({ dom }: VnodeDOM) => {
      if (this.scrollDown) {
        this.scrollDown = false
        dom.scrollTo({ top: dom.scrollHeight, behavior: 'smooth' })
      }
    }
    return m('div', { class: classes.chatWindow }, [
      m(
        '.d-flex.justify-content-start',
        m(
          'button.btn.btn-md.btn-light.chat-close-button.phone-icon-btn.mt-1.ms-1.btn-sm',
          {
            type: 'button',
            'aria-label': t('close'),
            onclick: () => {
              this.open = false
              this.hasBeenOpened = true
            },
          },
          m.trust(closeIcon),
        ),
      ),
      m(
        'div',
        { class: classes.messagesScrollContainer, oncreate: scroll, onupdate: scroll },
        m(
          'div',
          { class: classes.messages },
          this.messages.map((message, index) => this.message(message, index)),
        ),
      ),
      signatureMissing(this.messages, this.signature)
        ? m(
            'p.mb-0.px-2.pt-1.text-muted',
            { class: classes.signatureHint },
            t('ai.signature-missing'),
          )
        : null,
      m('div', { class: classes.inputArea }, [
        m('textarea.form-control.fs-6', {
          placeholder: t(this.loading ? 'ai.chat-placeholder-loading' : 'ai.chat-placeholder'),
          rows: 4,
          wrap: 'soft',
          style: { resize: 'none' },
          disabled: this.loading,
          value: this.draft,
          oninput: (event: Event) => {
            this.draft = (event.target as HTMLTextAreaElement).value
          },
          // Ctrl+Enter, on a Mac Cmd+Enter, sends; Enter alone starts a new line
          onkeydown: (event: KeyboardEvent) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault()
              this.sendDraft()
            }
          },
        }),
        m(
          'button.btn.btn-md.btn-light',
          { type: 'button', disabled: this.loading, onclick: () => this.sendDraft() },
          t('send') + (this.loading ? '...' : ''),
        ),
      ]),
      m(
        '.d-flex.justify-content-start',
        m(
          'button.btn.btn-md.btn-light',
          {
            type: 'button',
            class: classes.chatClearButton,
            disabled: this.loading || this.clearing,
            onclick: () => this.clear(),
          },
          t('ai.chat-clear'),
        ),
      ),
    ])
  }

  private message(message: ChatMessage, index: number) {
    const text = message.errorCode
      ? t(chatErrorKey(message.errorCode))
      : withSignature(message, this.signature)
    return m(
      'div',
      {
        // by position: messages carry no id
        key: index,
        class: [classes.message, message.role, message.errorCode ? 'error' : ''].join(' '),
        oncreate: index >= this.standing ? slideIn : undefined,
      },
      m('.position-relative.inner-container', { class: classes.messageContent }, [
        m('span', text),
        message.role === 'assistant' && !message.errorCode
          ? m(
              'button.btn.btn-md.btn-light.phone-icon-btn',
              {
                type: 'button',
                class: classes.copyClipboardButton,
                title: t('copy-to-clipboard'),
                'aria-label': t('copy-to-clipboard'),
                onclick: () => this.copy(text),
              },
              m.trust(copyIcon),
            )
          : null,
      ]),
    )
  }
}
