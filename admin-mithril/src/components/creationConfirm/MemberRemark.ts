// AI-GENERATED — not an architecture reference
import classes from '@admin/components/MemberRemark.module.css'
import walletLinkClasses from '@admin/components/MemberWalletLink.module.css'
import { CONFIG } from '@admin/config'
import m, { type ClassComponent, type Vnode, type VnodeDOM } from 'mithril'
import { icon } from '@/components/icon'
import { USER_REMARK_MAX_CHARS } from '@/data/UserRemark.logic'
import { d, t } from '@/i18n'
import { type RemarkCard, retryRemark, typeRemark } from '@/store/userRemarks.store'
import noteIcon from '~icons/mdi/note-text'
import noteOutlineIcon from '~icons/mdi/note-text-outline'

/**
 * The moderation's remark on a member -- "Bemerkung", apart from the note on one contribution:
 * the button behind the pin and the arrow, the remark under the member line, and the field in its
 * place while it is written.
 */
export const remarkToggle = (
  card: RemarkCard,
  name: string,
  controls: string,
  onclick: () => void,
  oncreate: (vnode: VnodeDOM) => void,
) =>
  m(
    'button',
    {
      type: 'button',
      class: walletLinkClasses.memberWalletLink,
      // the 2px the button before gives back, taken again: edge to edge
      style: { marginLeft: '0.125rem' },
      'data-test': 'member-remark-toggle',
      title: t('remark.title', { name }),
      'aria-label': t('remark.title', { name }),
      'aria-expanded': String(card.open),
      'aria-controls': card.open ? controls : undefined,
      // not to be pressed until the remark is read
      disabled: !card.entry.loaded,
      onclick,
      oncreate,
    },
    icon(card.entry.saved ? noteIcon : noteOutlineIcon, { 'aria-hidden': 'true' }),
  )

/**
 * The remark under the member line, line breaks kept; nothing where there is none. `plain`:
 * without the frame of a list row, where the place has a frame of its own (Crea's window).
 */
export const remarkLine = ({ entry: { saved } }: RemarkCard, plain = false) =>
  saved
    ? m(
        plain ? 'div' : '.list-group-item',
        {
          class: [classes.remarkLine, plain ? classes.plain : ''].join(' '),
          'data-test': 'member-remark',
        },
        [
          icon(noteIcon, { 'aria-hidden': 'true' }),
          m('span', { class: classes.remarkText }, [
            m('span.visually-hidden', `${t('remark.label')}: `),
            saved.remark,
          ]),
        ],
      )
    : null

interface Attrs {
  card: RemarkCard
  name: string
  fieldId: string
  ondone: () => void
  /** without the frame of a list row, as remarkLine */
  plain?: boolean
}

let lastId = 0

/**
 * The field: the words, who sees them, who wrote them last and when, and whether they are saved.
 * It takes the keyboard as it opens; "Fertig" and Escape close it.
 */
export class RemarkEditor implements ClassComponent<Attrs> {
  private readonly id = ++lastId

  oncreate({ dom }: VnodeDOM<Attrs>) {
    const field = dom.querySelector('textarea')
    field?.focus()
    // at the end of the words, to go on writing
    field?.setSelectionRange(field.value.length, field.value.length)
  }

  view({ attrs: { card, name, fieldId, ondone, plain } }: Vnode<Attrs>) {
    const { saved, status, draft } = card.entry
    const privateId = `remark-private-${this.id}`
    const troubleId = `remark-trouble-${this.id}`
    const failed = status === 'failed'
    const date = saved ? d(new Date(saved.updatedAt), 'shortTime') : ''
    return m(
      plain ? 'div' : '.list-group-item',
      {
        class: [classes.remarkEditor, plain ? classes.plain : ''].join(' '),
        'data-test': 'member-remark-editor',
        onkeydown: (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            ondone()
          }
        },
      },
      [
        m('label.form-label.fw-semibold.mb-0', { for: fieldId }, t('remark.title', { name })),
        m('textarea.form-control', {
          id: fieldId,
          class: classes.remarkField,
          rows: 3,
          maxlength: USER_REMARK_MAX_CHARS,
          value: draft,
          'aria-describedby': failed ? `${privateId} ${troubleId}` : privateId,
          'data-test': 'member-remark-field',
          oninput: (event: Event) => typeRemark(card, (event.target as HTMLTextAreaElement).value),
        }),
        // who reads the words: Crea as well, where she is switched on
        m(
          '.form-text.mt-0',
          { id: privateId },
          t(CONFIG.ANTHROPIC_ACTIVE ? 'remark.privateWithCrea' : 'remark.private', { name }),
        ),
        m('.small', { class: classes.remarkFoot }, [
          saved
            ? m(
                'span.text-body-secondary',
                { 'data-test': 'member-remark-last-changed' },
                saved.updatedByName
                  ? t('remark.lastChanged', { name: saved.updatedByName, date })
                  : t('remark.lastChangedNoName', { date }),
              )
            : null,
          // what goes wrong is said at once; saving and saved are only to be seen
          failed
            ? m('span', { id: troubleId, class: classes.remarkStatus, role: 'alert' }, [
                `${t('remark.failed')} `,
                m(
                  'button',
                  {
                    type: 'button',
                    class: classes.remarkRetry,
                    'data-test': 'member-remark-retry',
                    onclick: () => retryRemark(card),
                  },
                  t('remark.retry'),
                ),
              ])
            : m(
                'span.text-body-secondary',
                { class: classes.remarkStatus, 'data-test': 'member-remark-status' },
                status === 'saving'
                  ? t('remark.saving')
                  : status === 'saved'
                    ? t('remark.saved')
                    : '',
              ),
          m(
            'button.btn.btn-sm.btn-outline-primary',
            { type: 'button', 'data-test': 'member-remark-done', onclick: ondone },
            t('remark.done'),
          ),
        ]),
      ],
    )
  }
}
