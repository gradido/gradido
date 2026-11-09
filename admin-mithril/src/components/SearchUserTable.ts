// AI-GENERATED — not an architecture reference
import circleSlash from '@admin/assets/icons/circle-slash.png'
import envelope from '@admin/assets/icons/envelope.png'
import person from '@admin/assets/icons/person.png'
import '@admin/components/Tables/SearchUserTable.css'
import m, { type Children, type ClassComponent, type Vnode } from 'mithril'
import '@/components/bootstrap/table.css'
import { MemberWalletLink } from '@/components/MemberWalletLink'
import type { SearchedMember } from '@/data/SearchedMember.schema'
import { d, t } from '@/i18n'
import caretDownIcon from '~icons/ph/caret-down'
import caretUpIcon from '~icons/ph/caret-up-fill'

interface Attrs {
  members: SearchedMember[]
  /** the short names of the three months of `creation`, in its order */
  creationMonths: string[]
  /** every member a card, as on a phone */
  cards: boolean
  /** the member whose row is open */
  open: number | null
  ontoggle: (userId: number) => void
  /** what an open row shows below it */
  details: (member: SearchedMember) => Children
}

const caret = (open: boolean, attributes: string) =>
  m.trust((open ? caretUpIcon : caretDownIcon).replace('<svg ', `<svg ${attributes} `))

const walletLink = (member: SearchedMember) =>
  m(MemberWalletLink, { member, name: member.alias || member.firstName })

/**
 * A member's state, deleted -- or else an address not confirmed -- and active where neither is:
 * the badges on a phone's card.
 */
const statusBadge = (member: SearchedMember) =>
  member.deletedAt
    ? { word: t('deleted'), tone: 'text-bg-danger' }
    : member.emailChecked
      ? { word: t('enabled'), tone: 'text-bg-success' }
      : { word: t('userStatus.emailUnconfirmed'), tone: 'text-bg-warning' }

// The status cell at the desk: each symbol with its word behind it from 1200px on; a screen
// reader hears the word from the symbol's alt.
const statusWord = (word: string) =>
  m('small.ms-2.d-none.d-xl-inline', { 'aria-hidden': 'true' }, word)

const statusCell = (member: SearchedMember, open: boolean) =>
  m('.d-flex.gap-3.justify-content-end.align-items-center', [
    member.deletedAt
      ? m('span.d-inline-flex.align-items-center.me-3.me-xl-2', [
          m(
            '.test-deleted-icon.position-relative.rounded-circle',
            { style: 'width: 40px; height: 40px' },
            [
              m('img.position-absolute', { src: circleSlash, alt: t('deleted') }),
              m('img.position-relative', {
                src: person,
                alt: '',
                style: 'transform: translate(50%, 30%)',
              }),
            ],
          ),
          statusWord(t('deleted')),
        ])
      : !member.emailChecked
        ? m('span.d-inline-flex.align-items-center.me-3.me-xl-2', [
            m(
              '.rounded-circle.position-relative',
              { style: 'background-color: #dc3545; width: 40px; height: 40px' },
              m('img.position-absolute', {
                src: envelope,
                alt: t('userStatus.emailUnconfirmed'),
                style: 'transform: translate(30%, 30%); width: 25px; height: 25px',
              }),
            ),
            statusWord(t('userStatus.emailUnconfirmed')),
          ])
        : null,
    // no button: the row opens on a click anywhere in it
    caret(
      open,
      `class="row-caret" aria-hidden="true" data-test="row-caret-${open ? 'up' : 'down'}"`,
    ),
  ])

/**
 * The members found: a table at the desk, a card each on a phone. A click on a row opens it, and
 * closes the one open before.
 */
export class SearchUserTable implements ClassComponent<Attrs> {
  // A member on a phone: what the seven columns say, a line each, and a button of its own that
  // opens the row -- its press stays with it.
  private card(member: SearchedMember, open: boolean, attrs: Attrs) {
    const fold = open ? t('hide_details') : t('show_details')
    const badge = statusBadge(member)
    return m('.member-card', [
      m('.d-flex.justify-content-between.align-items-start.gap-2', [
        // min-width 0: a long name or username breaks here instead of widening the card
        m('div', { style: 'min-width: 0px' }, [
          m(
            '.fw-semibold.text-break',
            `${member.firstName} ${member.lastName}`.trim() || member.alias,
          ),
          m('small.text-break', [member.alias, ' ', walletLink(member)]),
        ]),
        m(
          'button.btn.btn-md.btn-link.phone-icon-btn.text-body',
          {
            type: 'button',
            'aria-expanded': String(open),
            'aria-label': fold,
            title: fold,
            onclick: (event: MouseEvent) => {
              event.stopPropagation()
              attrs.ontoggle(member.userId)
            },
          },
          caret(open, 'aria-hidden="true"'),
        ),
      ]),
      m('.text-break', member.email),
      m('.small.text-body-secondary', `${t('registered_at')} ${d(new Date(member.createdAt))}`),
      // a month keeps its amount on its line: where the line breaks, it breaks between months
      m(
        '.small',
        `${t('creation')}: ${attrs.creationMonths
          .map((month, index) => `${month} ${member.creation[index] ?? '–'}`)
          .join(' · ')}`,
      ),
      m('.d-flex.flex-wrap.gap-1.mt-1', m('span.badge', { class: badge.tone }, badge.word)),
    ])
  }

  view({ attrs }: Vnode<Attrs>) {
    const { members, creationMonths, cards, open, ontoggle, details } = attrs
    const heads = cards
      ? ['']
      : [
          t('e_mail'),
          t('firstname'),
          t('lastname'),
          t('username'),
          creationMonths.join(' | '),
          t('registered_at'),
          t('status'),
        ]
    const cells = (member: SearchedMember, isOpen: boolean): Children[] =>
      cards
        ? [this.card(member, isOpen, attrs)]
        : [
            member.email,
            member.firstName,
            member.lastName,
            [member.alias, ' ', walletLink(member)],
            m('div', member.creation.join(' | ')),
            d(new Date(member.createdAt), 'long'),
            statusCell(member, isOpen),
          ]
    return m(
      '.search-user-table',
      m(
        'table.table.b-table.caption-top.table-hover.b-table-stacked-lg.table-striped',
        { 'aria-busy': 'false' },
        [
          m(
            'thead',
            m(
              'tr',
              heads.map((head) => m('th', { scope: 'col' }, head)),
            ),
          ),
          m(
            'tbody',
            members.flatMap((member) => {
              const isOpen = member.userId === open
              return [
                m(
                  'tr.pointer',
                  { key: member.userId, onclick: () => ontoggle(member.userId) },
                  cells(member, isOpen).map((cell, index) =>
                    m('td', { class: !cards && index === 3 ? 'text-break' : '' }, cell),
                  ),
                ),
                ...(isOpen
                  ? [
                      // a hidden row first, as the old table had it: the open row takes the
                      // stripe of the row it belongs to
                      m('tr.d-none', {
                        key: `stripe-${member.userId}`,
                        'aria-hidden': 'true',
                        role: 'presentation',
                      }),
                      m(
                        'tr.b-table-details',
                        { key: `details-${member.userId}` },
                        m('td', { colspan: heads.length }, details(member)),
                      ),
                    ]
                  : []),
              ]
            }),
          ),
        ],
      ),
    )
  }
}
