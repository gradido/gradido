// AI-GENERATED — not an architecture reference
import timeClasses from '@admin/components/input/TimePicker.module.css'
import { adminCreateSupportTicketMessage } from '@admin/graphql/supportTickets.graphql'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { boldShortcut } from '@/components/boldShortcut'
import { Tabs } from '@/components/bootstrap/Tabs'
import { Tooltip } from '@/components/bootstrap/Tooltip'
import { toastError, toastSuccess } from '@/components/Toasts'
import { dayOf } from '@/data/Figures.logic'
import { FormTab } from '@/data/FormTab.enum'
import { dayAndTime, isTime, momentOf, wholeTime } from '@/data/MessageForm.logic'
import {
  answerVariables,
  charactersOf,
  MESSAGE_MAX_CHARS,
  refusalWords,
  sendable,
  waitingUntil,
} from '@/data/SupportTicket.logic'
import type { ListedSupportTicket } from '@/data/SupportTicket.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { isPhone } from '@/viewport'

interface Attrs {
  ticket: ListedSupportTicket
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
 *
 * Above the tabs the box of the resubmission (K4), as on a contribution: it opens as the request
 * came, with its moment while that is still to come, and goes with every answer and note -- set,
 * kept or taken away. A closed request waits for nothing: with the box set nothing closes, and
 * under a closed request a note has no box (the server takes a note with a moment into an open
 * request only).
 */
export class SupportAnswerForm implements ClassComponent<Attrs> {
  private readonly id = `support-answer-${++lastId}`
  private tab: AnswerTab = FormTab.MESSAGE
  private readonly texts: Record<AnswerTab, string> = { [FormTab.MESSAGE]: '', [FormTab.NOTE]: '' }
  private sending = false
  private box = false
  private day = ''
  private time = '00:00'

  oninit({ attrs: { ticket } }: Vnode<Attrs>) {
    const waiting = waitingUntil(ticket)
    this.box = waiting !== null
    if (waiting) {
      ;({ day: this.day, time: this.time } = dayAndTime(waiting))
    }
  }

  // whether the box goes with what the tab sends: a closed request's note has none
  private waits({ ticket }: Attrs) {
    return this.box && (this.tab === FormTab.MESSAGE || ticket.status !== 'CLOSED')
  }

  private async send(attrs: Attrs, close: boolean) {
    const { ticket, onwritten } = attrs
    const tab = this.tab
    const text = this.texts[tab]
    const waits = this.waits(attrs)
    // one write at a time, only words the server takes, and no moment that is none
    if (this.sending || !sendable(text) || (waits && (close || !this.day || !isTime(this.time)))) {
      return
    }
    const resubmission = waits ? momentOf(this.day, this.time) : null
    if (resubmission && resubmission < new Date()) {
      toastError(t('contributionMessagesForm.resubmissionDateInPast'))
      return
    }
    const note = tab === FormTab.NOTE
    this.sending = true
    const answer = await graphqlRequest(
      adminCreateSupportTicketMessage,
      answerVariables(ticket.id, text, {
        note,
        close,
        resubmissionAt: resubmission?.toISOString() ?? null,
      }),
    )
    this.sending = false
    if (answer.success) {
      toastSuccess(t('message.request'))
      // the draft that went, the other tab's stays -- and words typed while it went stay too
      if (this.texts[tab] === text) {
        this.texts[tab] = ''
      }
    } else {
      // the words stay in the field: nothing of them is lost to a refusal
      toastError(
        refusalWords(
          answer.error.messages,
          note ? 'support.notesReached' : 'support.messagesReached',
        ),
      )
    }
    onwritten()
  }

  view({ attrs }: Vnode<Attrs>) {
    const waits = this.waits(attrs)
    // a time that is no hh:mm, or a box without a day, sends nothing: what was meant is not guessed
    const disabled =
      this.sending ||
      !sendable(this.texts[this.tab]) ||
      (waits && (!this.day || !isTime(this.time)))
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
    // the box and its moment, as on a contribution's form: a day not before today, a time hh:mm
    const resubmission =
      this.tab === FormTab.MESSAGE || attrs.ticket.status !== 'CLOSED'
        ? [
            m(
              'fieldset.b-form-group',
              m('.form-check', [
                m('input.form-check-input', {
                  id: `${this.id}-box`,
                  type: 'checkbox',
                  checked: this.box,
                  'data-test': 'support-resubmission-box',
                  onchange: (event: Event) => {
                    this.box = (event.target as HTMLInputElement).checked
                  },
                }),
                m(
                  'label.form-check-label',
                  { for: `${this.id}-box` },
                  t('moderator.show-submission-form'),
                ),
              ]),
            ),
            this.box
              ? m(
                  'fieldset.b-form-group',
                  m('.d-flex.flex-wrap.gap-2.my-2', [
                    m(
                      'div',
                      m('input.form-control', {
                        type: 'date',
                        min: dayOf(new Date()),
                        value: this.day,
                        'aria-label': t('moderator.show-submission-form'),
                        'data-test': 'support-resubmission-day',
                        oninput: (event: Event) => {
                          this.day = (event.target as HTMLInputElement).value
                        },
                      }),
                    ),
                    m(
                      'div',
                      m('input', {
                        class: timeClasses.timerInput,
                        type: 'text',
                        placeholder: 'hh:mm',
                        value: this.time,
                        'data-test': 'support-resubmission-time',
                        // only numbers and ":"; made whole as the field is left
                        oninput: (event: Event) => {
                          const field = event.target as HTMLInputElement
                          this.time = field.value.replace(/[^0-9:]/g, '')
                          field.value = this.time
                        },
                        onblur: () => {
                          this.time = wholeTime(this.time)
                        },
                      }),
                    ),
                  ]),
                )
              : null,
          ]
        : null

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
            resubmission,
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
                    // A disabled button takes no pointer: the reason stands on what holds it.
                    m(
                      'span.d-inline-block',
                      { title: waits ? t('support.closingWaits') : undefined },
                      m(
                        'button.btn.btn-md.btn-success',
                        {
                          type: 'button',
                          disabled: disabled || waits,
                          'aria-describedby': waits ? `${this.id}-closing-waits` : undefined,
                          'data-test': 'support-answer-and-close',
                          onclick: () => this.send(attrs, true),
                        },
                        t('support.answerAndClose'),
                      ),
                    ),
                    waits
                      ? m(
                          'span.visually-hidden',
                          { id: `${this.id}-closing-waits` },
                          t('support.closingWaits'),
                        )
                      : null,
                  ]),
                ]),
          ],
        ),
      ),
    )
  }
}
