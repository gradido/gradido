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

/**
 * The form under an opened support request (K3): a message to the member -- "Antworten" makes the
 * request a question back to them, "Antworten und schließen" closes it, and the member gets a
 * mail either way -- or a note for the moderation, which changes nothing of the request and
 * reaches the member nowhere. Ctrl/Cmd+B sets bold, as in the contribution's thread. What the
 * request is after a write, the server says: the page asks for its list anew.
 */
export class SupportAnswerForm implements ClassComponent<Attrs> {
  private readonly id = `support-answer-${++lastId}`
  private tab = FormTab.MESSAGE
  private text = ''
  private sending = false

  private async send({ supportTicketId, onwritten }: Attrs, close: boolean) {
    // one write at a time, and only words the server takes
    if (this.sending || !sendable(this.text)) {
      return
    }
    const note = this.tab === FormTab.NOTE
    this.sending = true
    const answer = await graphqlRequest(
      adminCreateSupportTicketMessage,
      answerVariables(supportTicketId, this.text, { note, close }),
    )
    this.sending = false
    if (answer.success) {
      toastSuccess(t('message.request'))
      this.text = ''
    } else {
      // the words stay in the field: nothing of them is lost to a refusal
      toastError(refusalWords(answer.error.messages, { note }))
    }
    onwritten()
  }

  view({ attrs }: Vnode<Attrs>) {
    const tooLong = charactersOf(this.text) > MESSAGE_MAX_CHARS
    const disabled = this.sending || !sendable(this.text)
    const hintId = `${this.id}-too-long`
    const field = (placeholder: string) =>
      m('textarea.form-control', {
        placeholder,
        rows: isPhone() ? 6 : 12,
        value: this.text,
        'aria-invalid': tooLong ? 'true' : undefined,
        'aria-describedby': tooLong ? hintId : undefined,
        oninput: (event: Event) => {
          this.text = (event.target as HTMLTextAreaElement).value
        },
        onkeydown: (event: KeyboardEvent) =>
          boldShortcut(event, (value) => {
            this.text = value
          }),
      })
    // Functions, not vnodes: each tab draws its own, and Mithril draws a vnode in one place only.
    // The hint stands in the tab shown; the other one is hidden.
    const hint = (tab: FormTab) =>
      tooLong && tab === this.tab
        ? m(
            'p.mt-1.mb-0.text-danger.small',
            { id: hintId },
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
            onreset: (event: Event) => {
              event.preventDefault()
              this.text = ''
            },
          },
          [
            m(Tabs, {
              class: 'mt-3',
              contentClass: 'mt-3',
              active: this.tab,
              onchange: (tab: FormTab) => {
                this.tab = tab
              },
              tabs: [
                {
                  title: m(
                    Tooltip,
                    { title: t('moderator.message-tooltip') },
                    t('moderator.message'),
                  ),
                  content: [field(t('moderator.message')), hint(FormTab.MESSAGE)],
                },
                {
                  title: m(
                    Tooltip,
                    { title: t('moderator.notice-tooltip') },
                    t('moderator.notice'),
                  ),
                  content: [field(t('moderator.notice')), hint(FormTab.NOTE)],
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
