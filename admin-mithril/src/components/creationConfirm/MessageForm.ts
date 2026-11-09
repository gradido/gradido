// AI-GENERATED — not an architecture reference
import creaLogo from '@admin/../public/img/crea-logo.jpg'
import classes from '@admin/components/ContributionMessages/ContributionMessagesFormular.module.css'
import timeClasses from '@admin/components/input/TimePicker.module.css'
import BootstrapTooltip from 'bootstrap/js/dist/tooltip'
import m, { type ClassComponent, type Vnode, type VnodeDOM } from 'mithril'
import { boldShortcut } from '@/components/boldShortcut'
import { Tabs } from '@/components/bootstrap/Tabs'
import { toastError, toastSuccess } from '@/components/Toasts'
import type { ListedContribution } from '@/data/Contribution.schema'
import { dayOf } from '@/data/Figures.logic'
import { FormTab } from '@/data/FormTab.enum'
import {
  dayAndTime,
  isTime,
  MEMO_MAX_LENGTH,
  momentOf,
  submission,
  wholeTime,
  withCreaNote,
} from '@/data/MessageForm.logic'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { creaDraft, creaNote } from '@/store/creaDrafts.store'
import { isPhone } from '@/viewport'

/** A save of a resubmission: the page may offer it for the member's other contributions. */
export type ResubmissionSaved = { id: number; resubmissionAt: string | null; unchanged: boolean }

interface Attrs {
  contribution: ListedContribution
  /** whether the list hides what waits for a resubmission */
  hideResubmission: boolean
  /** who asked the open question, where it was a colleague */
  colleagueQuestion: { name: string } | null
  /** the thread anew */
  onthread: () => void
  /** the list anew: a change it shows, or a resubmission that takes the contribution out of it */
  onlist: () => void
  onresubmission: (saved: ResubmissionSaved) => void
}

let lastId = 0

// a word with what it is for under the pointer
const withTooltip = (word: string, tooltip: string) =>
  m(
    'span',
    {
      oncreate: ({ dom }: VnodeDOM) => new BootstrapTooltip(dom, { title: tooltip }),
      onremove: ({ dom }: VnodeDOM) => BootstrapTooltip.getInstance(dom)?.dispose(),
    },
    word,
  )

/**
 * The form under an open contribution's thread: a message to the member, a note for the
 * moderation, or a change of the contribution's text -- each with a resubmission, which may also
 * be set or taken away alone. The amount is not to be changed here, nor anywhere in moderation: a
 * wrong one is denied and entered anew.
 */
export class MessageForm implements ClassComponent<Attrs> {
  private readonly id = `message-form-${++lastId}`
  private tab = FormTab.MESSAGE
  private text = ''
  private memo = ''
  private box = false
  private day = ''
  private time = '00:00'
  private sending = false
  // the model of a Crea draft in the text, sent along so the thread records whose words they are
  private creaModel: string | null = null
  // the field the draft goes into, at its caret
  private creaField?: HTMLTextAreaElement

  oninit({ attrs: { contribution } }: Vnode<Attrs>) {
    this.reset(contribution)
  }

  // the form as the contribution came: no words, its text, its resubmission
  private reset({ memo, resubmissionAt }: ListedContribution) {
    this.text = ''
    this.creaModel = null
    this.memo = memo
    this.box = resubmissionAt !== null
    const { day, time } = resubmissionAt
      ? dayAndTime(new Date(resubmissionAt))
      : { day: '', time: '00:00' }
    this.day = day
    this.time = time
  }

  // the resubmission as it came, to the minute
  private asItCame({ resubmissionAt }: ListedContribution) {
    return (
      resubmissionAt !== null &&
      this.box &&
      this.day !== '' &&
      Math.floor(momentOf(this.day, this.time).getTime() / 60000) ===
        Math.floor(new Date(resubmissionAt).getTime() / 60000)
    )
  }

  private typeText(text: string) {
    this.text = text
    if (!text) {
      this.creaModel = null
    }
  }

  // Crea's draft into an empty field, at the caret of one with words, or below them
  private insertDraft() {
    const { text: draft, model } = creaDraft()
    this.creaModel = model || null
    const field = this.creaField
    if (!this.text) {
      this.text = draft
    } else if (field) {
      const start = field.selectionStart ?? this.text.length
      const end = field.selectionEnd ?? start
      this.text = this.text.slice(0, start) + draft + this.text.slice(end)
      m.redraw.sync()
      field.focus()
      field.setSelectionRange(start + draft.length, start + draft.length)
    } else {
      this.text = `${this.text}\n${draft}`
    }
  }

  private async submit(attrs: Attrs) {
    const { contribution, hideResubmission, colleagueQuestion } = attrs
    // A note on a colleague's question takes the resubmission back, where it is left as it came:
    // the contribution comes back to the moderator who asked.
    const wakes =
      this.text !== '' &&
      this.tab === FormTab.NOTE &&
      colleagueQuestion !== null &&
      this.asItCame(contribution)
    const removing = !this.box && contribution.resubmissionAt !== null
    const resubmission = this.box && !wakes ? momentOf(this.day, this.time) : null
    if (resubmission && resubmission < new Date()) {
      toastError(t('contributionMessagesForm.resubmissionDateInPast'))
      return
    }
    // what the box shows as it goes: it is unticked after only where it still shows that
    const boxShows = () => (this.box && this.day ? momentOf(this.day, this.time).getTime() : null)
    const boxAsSent = boxShows()
    const { kind, mutation, variables } = submission({
      tab: this.tab,
      text: this.text,
      memo: this.memo,
      originalMemo: contribution.memo,
      contributionId: contribution.id,
      resubmissionAt: resubmission ? resubmission.toString() : null,
      aiModel: this.creaModel,
    })
    this.sending = true
    const answer = await graphqlRequest(mutation, variables)
    this.sending = false
    const saved = { id: contribution.id, resubmissionAt: resubmission?.toString() ?? null }
    if (!answer.success) {
      // a resubmission saved as it was: no failure, the page may offer it for the others
      if (kind === 'resubmission' && answer.error.message.includes("wasn't changed")) {
        attrs.onresubmission({ ...saved, unchanged: true })
      } else {
        toastError(answer.error.message)
      }
      return
    }
    if ((hideResubmission && resubmission && resubmission > new Date()) || kind === 'memo') {
      attrs.onlist()
    } else {
      attrs.onthread()
      // The row takes in place what the message did on the server -- the list anew would close
      // it --, with the resubmission it went out with, which the next opening shows.
      const resubmissionAt = resubmission?.toISOString() ?? null
      if (variables.messageType === 'DIALOG') {
        // the newest word is a question to the member now, not a colleague's note
        Object.assign(contribution, {
          messagesCount: contribution.messagesCount + 1,
          contributionStatus: 'IN_PROGRESS',
          colleagueNoteOnQuestion: false,
          resubmissionAt,
        })
      } else if (variables.messageType === 'MODERATOR') {
        Object.assign(contribution, {
          messagesCount: contribution.messagesCount + 1,
          colleagueNoteOnQuestion: colleagueQuestion !== null,
          resubmissionAt,
        })
      }
    }
    if (resubmission || removing) {
      attrs.onresubmission({ ...saved, unchanged: false })
    }
    if (wakes && boxShows() === boxAsSent) {
      this.box = false
    }
    toastSuccess(t('message.request'))
    this.typeText('')
    this.memo = contribution.memo
  }

  view({ attrs }: Vnode<Attrs>) {
    const { contribution, colleagueQuestion } = attrs
    const rows = isPhone() ? 6 : 12
    const { text: draft } = creaDraft()
    const note = creaNote()
    const removing = !this.box && contribution.resubmissionAt !== null
    const memoTooLong = this.memo.length > MEMO_MAX_LENGTH
    const wordsMissing =
      this.tab === FormTab.MEMO ? this.memo.length < 5 || memoTooLong : this.text === ''
    // something to save: a resubmission to set or to take away, or the words of the tab
    // A time that is no hh:mm saves nothing: what was meant is not to be guessed. Fixed: the old
    // admin sent "Invalid Date" where Enter in the field sent the form before it was left.
    const disabled =
      this.sending ||
      (this.box && !isTime(this.time)) ||
      (!(this.box && this.day) && !removing && wordsMissing)
    const wakesHint =
      this.tab === FormTab.NOTE && colleagueQuestion !== null && this.asItCame(contribution)
    const hintId = `${this.id}-wakes`
    const textField = (placeholder: string, describedBy?: string) =>
      m('textarea.form-control', {
        placeholder,
        rows,
        value: this.text,
        'aria-describedby': describedBy,
        oninput: (event: Event) => this.typeText((event.target as HTMLTextAreaElement).value),
        onkeydown: (event: KeyboardEvent) => boldShortcut(event, (value) => this.typeText(value)),
        onfocus: (event: FocusEvent) => {
          this.creaField = event.target as HTMLTextAreaElement
        },
      })

    return m(
      '.contribution-messages-formular',
      m(
        '.mt-5',
        m(
          'form',
          {
            onsubmit: (event: SubmitEvent) => {
              event.preventDefault()
              this.submit(attrs)
            },
            onreset: (event: Event) => {
              event.preventDefault()
              this.reset(contribution)
            },
          },
          [
            m(
              'fieldset.b-form-group',
              m('.form-check', [
                m('input.form-check-input', {
                  id: `${this.id}-box`,
                  type: 'checkbox',
                  checked: this.box,
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
                    // Fixed: a field of the browser in place of vue3-datepicker -- not before today
                    m(
                      'div',
                      m('input.form-control', {
                        type: 'date',
                        min: dayOf(new Date()),
                        value: this.day,
                        'aria-label': t('moderator.show-submission-form'),
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
            // Crea's last draft into the message or the note; her note for the text into it
            (draft && this.tab !== FormTab.MEMO) || note
              ? m('.mt-3.d-flex.gap-2.align-items-center', [
                  draft && this.tab !== FormTab.MEMO
                    ? [
                        m('img', {
                          src: creaLogo,
                          alt: t('crea.column'),
                          class: classes.creaInlineLogo,
                        }),
                        m(
                          'button.btn.btn-sm.btn-outline-info',
                          {
                            type: 'button',
                            'data-test': 'crea-insert-draft',
                            onclick: () => this.insertDraft(),
                          },
                          t('crea.insertDraft'),
                        ),
                      ]
                    : null,
                  note
                    ? m(
                        'button.btn.btn-sm.btn-outline-info',
                        {
                          type: 'button',
                          'data-test': 'crea-append-memo',
                          onclick: () => {
                            this.memo = withCreaNote(
                              this.memo,
                              adminStore.moderator?.alias ?? null,
                              note,
                            )
                            // the text to read in place, and to save
                            this.tab = FormTab.MEMO
                          },
                        },
                        t('crea.appendToMemo'),
                      )
                    : null,
                ])
              : null,
            m(Tabs, {
              class: 'mt-3',
              contentClass: 'mt-3',
              active: this.tab,
              onchange: (tab: FormTab) => {
                this.tab = tab
              },
              tabs: [
                {
                  title: withTooltip(t('moderator.message'), t('moderator.message-tooltip')),
                  content: textField(t('contributionLink.memo')),
                },
                {
                  title: withTooltip(t('moderator.notice'), t('moderator.notice-tooltip')),
                  content: [
                    textField(t('moderator.notice'), wakesHint ? hintId : undefined),
                    wakesHint
                      ? m(
                          'p.mt-1.mb-0.small',
                          { id: hintId, 'data-test': 'note-wakes-resubmission' },
                          colleagueQuestion?.name
                            ? t('contributionMessagesForm.noteWakesResubmission', {
                                name: colleagueQuestion.name,
                              })
                            : t('contributionMessagesForm.noteWakesResubmissionPlain'),
                        )
                      : null,
                  ],
                },
                {
                  title: withTooltip(t('moderator.memo'), t('moderator.memo-tooltip')),
                  content: [
                    m('textarea.form-control', {
                      placeholder: t('contributionLink.memo'),
                      rows,
                      value: this.memo,
                      oninput: (event: Event) => {
                        this.memo = (event.target as HTMLTextAreaElement).value
                      },
                      onkeydown: (event: KeyboardEvent) =>
                        boldShortcut(event, (value) => {
                          this.memo = value
                        }),
                    }),
                    memoTooLong
                      ? m(
                          'p.mt-1.mb-0.text-danger.small',
                          t('crea.memoTooLong', { max: MEMO_MAX_LENGTH }),
                        )
                      : null,
                  ],
                },
              ],
            }),
            m('.row.mt-4.mb-6', [
              m('.col', m('button.btn.btn-md.btn-danger', { type: 'reset' }, t('form.cancel'))),
              m(
                '.col.text-end',
                m(
                  'button.btn.btn-md.btn-primary',
                  { type: 'submit', disabled, 'data-test': 'submit-dialog' },
                  t('save'),
                ),
              ),
            ]),
          ],
        ),
      ),
    )
  }
}
