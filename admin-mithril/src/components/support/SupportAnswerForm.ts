// AI-GENERATED — not an architecture reference
import { adminCreateSupportTicketMessage } from '@admin/graphql/supportTickets.graphql'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { boldShortcut } from '@/components/boldShortcut'
import { Tabs } from '@/components/bootstrap/Tabs'
import { Tooltip } from '@/components/bootstrap/Tooltip'
import { toastError, toastSuccess } from '@/components/Toasts'
import { FormTab } from '@/data/FormTab.enum'
import {
  answerVariables,
  charactersOf,
  MESSAGE_MAX_CHARS,
  refusalWords,
  sendable,
} from '@/data/SupportTicket.logic'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { isPhone } from '@/viewport'

interface Attrs {
  supportTicketId: number
  /** after every write, done or refused: the thread, the list and the count anew */
  onwritten: () => void
}

let lastId = 0

type AnswerTab = FormTab.MESSAGE | FormTab.NOTE

/**
 * The form under an opened support request (K3): a message to the member -- "Antworten" makes the
 * request a question back to them, "Antworten und schließen" closes it, and the member gets a
 * mail either way -- or a note for the moderation, which changes nothing of the request and
 * reaches the member nowhere. Each tab keeps a draft of its own: words begun as a note never go
 * to the member, and by mail, because the tab was switched before "Antworten". Ctrl/Cmd+B sets
 * bold, as in the contribution's thread. What the request is after a write, the server says: the
 * page asks for its list anew.
 */
export class SupportAnswerForm implements ClassComponent<Attrs> {
  private readonly id = `support-answer-${++lastId}`
  private tab: AnswerTab = FormTab.MESSAGE
  private readonly texts: Record<AnswerTab, string> = { [FormTab.MESSAGE]: '', [FormTab.NOTE]: '' }
  private sending = false

  private async send({ supportTicketId, onwritten }: Attrs, close: boolean) {
    const tab = this.tab
    const text = this.texts[tab]
    // one write at a time, and only words the server takes
    if (this.sending || !sendable(text)) {
      return
    }
    const note = tab === FormTab.NOTE
    this.sending = true
    const answer = await graphqlRequest(
      adminCreateSupportTicketMessage,
      answerVariables(supportTicketId, text, { note, close }),
    )
    this.sending = false
    if (answer.success) {
      toastSuccess(t('message.request'))
      // the draft that went, the other tab's stays
      this.texts[tab] = ''
    } else {
      // the words stay in the field: nothing of them is lost to a refusal
      toastError(refusalWords(answer.error.messages, { note }))
    }
    onwritten()
  }

  view({ attrs }: Vnode<Attrs>) {
    const disabled = this.sending || !sendable(this.texts[this.tab])
    const tooLong = (tab: AnswerTab) => charactersOf(this.texts[tab]) > MESSAGE_MAX_CHARS
    const hintId = (tab: AnswerTab) => `${this.id}-too-long-${tab}`
    // Functions, not vnodes: each tab draws its own field, with its own draft, and Mithril draws a
    // vnode in one place only.
    const field = (tab: AnswerTab, placeholder: string) =>
      m('textarea.form-control', {
        placeholder,
        rows: isPhone() ? 6 : 12,
        value: this.texts[tab],
        'aria-invalid': tooLong(tab) ? 'true' : undefined,
        'aria-describedby': tooLong(tab) ? hintId(tab) : undefined,
        oninput: (event: Event) => {
          this.texts[tab] = (event.target as HTMLTextAreaElement).value
        },
        onkeydown: (event: KeyboardEvent) =>
          boldShortcut(event, (value) => {
            this.texts[tab] = value
          }),
      })
    const hint = (tab: AnswerTab) =>
      tooLong(tab)
        ? m(
            'p.mt-1.mb-0.text-danger.small',
            { id: hintId(tab) },
            t('support.tooLong', { max: MESSAGE_MAX_CHARS }),
          )
        : null
    const cancel = m('.col', m('button.btn.btn-md.btn-danger', { type: 'reset' }, t('form.cancel')))

    return m(
      '.contribution-messages-formular.support-answer-form',
      m(
        '.mt-5',
        m(
          'form',
          {
            // no submit: the buttons say what is sent, and Enter in the field is a new line
            // "Abbrechen" empties the draft shown, not the other tab's
            onreset: (event: Event) => {
              event.preventDefault()
              this.texts[this.tab] = ''
            },
          },
          [
            m(Tabs, {
              class: 'mt-3',
              contentClass: 'mt-3',
              active: this.tab,
              onchange: (tab: AnswerTab) => {
                this.tab = tab
              },
              tabs: [
                {
                  title: m(
                    Tooltip,
                    { title: t('moderator.message-tooltip') },
                    t('moderator.message'),
                  ),
                  content: [field(FormTab.MESSAGE, t('moderator.message')), hint(FormTab.MESSAGE)],
                },
                {
                  title: m(
                    Tooltip,
                    { title: t('moderator.notice-tooltip') },
                    t('moderator.notice'),
                  ),
                  content: [field(FormTab.NOTE, t('moderator.notice')), hint(FormTab.NOTE)],
                },
              ],
            }),
            this.tab === FormTab.NOTE
              ? m('.row.mt-4.mb-6', [
                  cancel,
                  m(
                    '.col.text-end',
                    m(
                      'button.btn.btn-md.btn-primary',
                      {
                        type: 'button',
                        disabled,
                        'data-test': 'support-save-note',
                        onclick: () => this.send(attrs, false),
                      },
                      t('save'),
                    ),
                  ),
                ])
              : m('.row.mt-4.mb-6', [
                  cancel,
                  m('.col.d-flex.flex-wrap.justify-content-end.gap-2', [
                    m(
                      'button.btn.btn-md.btn-outline-primary',
                      {
                        type: 'button',
                        disabled,
                        'data-test': 'support-answer',
                        onclick: () => this.send(attrs, false),
                      },
                      t('support.answer'),
                    ),
                    m(
                      'button.btn.btn-md.btn-success',
                      {
                        type: 'button',
                        disabled,
                        'data-test': 'support-answer-and-close',
                        onclick: () => this.send(attrs, true),
                      },
                      t('support.answerAndClose'),
                    ),
                  ]),
                ]),
          ],
        ),
      ),
    )
  }
}
