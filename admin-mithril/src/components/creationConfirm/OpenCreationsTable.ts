// AI-GENERATED — not an architecture reference
import creaLogo from '@admin/../public/img/crea-logo.jpg'
import '@admin/components/Tables/OpenCreationsTable.css'
import { avatarLettering } from '@admin/utils/avatarLettering'
import { creationGroupLabels, creationGroupOption } from '@admin/utils/creationGroupLabel'
import m, { type Children, type ClassComponent, type Vnode } from 'mithril'
import { Modal } from '@/components/bootstrap/Modal'
import { type Field, Table } from '@/components/bootstrap/Table'
import { icon } from '@/components/icon'
import { MemberAvatar } from '@/components/MemberAvatar'
import { ThemedSelect } from '@/components/ThemedSelect'
import {
  type DetailsState,
  detailsState,
  isOpen,
  memoComment,
  rowTone,
} from '@/data/Contribution.logic'
import type { ListedContribution } from '@/data/Contribution.schema'
import { isTheModerator } from '@/data/Member.logic'
import { d, t } from '@/i18n'
import { adminStore } from '@/store/admin.store'
import { memberAvatarSource } from '@/store/memberAvatars.store'
import { openMemberAvatarZoom } from '@/store/memberAvatarZoom.store'
import arrowDownIcon from '~icons/bi/arrow-down'
import arrowUpIcon from '~icons/bi/arrow-up'
import bellIcon from '~icons/bi/bell-fill'
import chatIcon from '~icons/bi/chat-dots'
import checkIcon from '~icons/bi/check'
import checkLgIcon from '~icons/bi/check-lg'
import pencilIcon from '~icons/bi/pencil-fill'
import questionIcon from '~icons/bi/question-lg'
import questionSquareIcon from '~icons/bi/question-square'
import searchIcon from '~icons/bi/search'
import stickyIcon from '~icons/bi/sticky-fill'
import trashIcon from '~icons/bi/trash'
import xIcon from '~icons/bi/x'
import xCircleIcon from '~icons/bi/x-circle'
import xLgIcon from '~icons/bi/x-lg'
import priorityIcon from '~icons/ic/round-priority-high'
import { ContributionThread, hasMember } from './ContributionThread'
import type { Decision } from './DecisionModal'
import type { ResubmissionSaved } from './MessageForm'

/** Which columns: the open tab's, a closed one's, or those of "all", which add the state. */
export type TableKind = 'open' | 'closed' | 'all'

interface Attrs {
  contributions: ListedContribution[]
  kind: TableKind
  /** each row a card of three cells */
  phone: boolean
  /** whether this tab offers Crea to this moderator */
  showCrea: boolean
  groups: { tag: string; name: string | null }[]
  ondecide: (contribution: ListedContribution, decision: Decision) => void
  onsearch: (email: string) => void
  /** moves a contribution to the groups `tags`; whether the server took it */
  onassign: (contributionId: number, tags: string[]) => Promise<boolean>
  /** whether the list hides what waits for a resubmission */
  hideResubmission: boolean
  /** the list anew, after a change an open row cannot take in place */
  onlist: () => void
  onresubmission: (saved: ResubmissionSaved) => void
  oncrea: (contribution: ListedContribution) => void
  class?: string
}

type GroupChange = { contribution: ListedContribution; tag: string; from: string; to: string }

const LIST_AVATAR_SIZE = 48

// Functions, not vnodes: Mithril draws a vnode in one place only.
const STATUS_ICONS: Record<string, () => Children> = {
  IN_PROGRESS: () => m.trust(questionSquareIcon),
  PENDING: () => m.trust(bellIcon),
  CONFIRMED: () => m.trust(checkIcon),
  DENIED: () => m.trust(xCircleIcon),
  DELETED: () =>
    icon(trashIcon.replace(/width="[^"]*" height="[^"]*"/, 'width="24" height="24"'), {
      class: 'p-1',
      style: 'background-color: #dc3545; color: white',
    }),
}
const statusIcon = (status: string) => STATUS_ICONS[status]?.()

// The one symbol of the details button: while the row is open the arrow turned up, as a press
// closes it; closed, what is going on -- what waits for the moderation in yellow --, and without a
// conversation the arrow that opens the row.
const DETAILS_ICONS: Record<NonNullable<DetailsState>, () => Children> = {
  question: () => m.trust(questionIcon),
  note: () => icon(stickyIcon, { class: 'details-signal' }),
  answer: () => icon(priorityIcon, { class: 'details-signal' }),
  changed: () => icon(pencilIcon, { class: 'details-signal' }),
  conversation: () => m.trust(chatIcon),
}

// Fixed: the old admin wrote the dates in the browser's language, a German admin in an English
// browser "10/1/2026"; here in the admin's, as everything else on the page.
const formatDate = (date: string | null) => (date ? d(new Date(date)) : '—')

// its name, for a screen reader and as a tooltip: the word, and what the symbol shows beside it
const detailsName = (contribution: ListedContribution, showing: boolean) => {
  if (showing) {
    return t('hide_details')
  }
  const state = detailsState(contribution)
  return state ? `${t('details')} – ${t(`contribution.detailsState.${state}`)}` : t('details')
}

const avatar = (user: ListedContribution['user'], className?: string) => {
  if (!user) {
    return null
  }
  const { letters, colorSeed, colorIndex } = avatarLettering(user)
  const src = memberAvatarSource(user)
  // the alias, as the row shows it beside the circle
  const name = user.alias || `${user.firstName} ${user.lastName}`.trim()
  return m(MemberAvatar, {
    class: className,
    size: LIST_AVATAR_SIZE,
    initials: letters,
    colorSeed,
    colorIndex,
    src,
    name,
    onzoom: src ? () => openMemberAvatarZoom(user, src, name) : undefined,
  })
}

/**
 * The contributions of a tab of the creation page: at the desk a row each, with the buttons that
 * decide an open one; on a phone a card each. A row opens below it for the conversation; the
 * group of an open contribution moves after a question.
 */
export class OpenCreationsTable implements ClassComponent<Attrs> {
  private open: number | null = null
  // What the group dropdowns show while a change is asked or on its way: the contribution itself
  // keeps its group until the list comes anew. A new list, or a refusal, puts them back.
  private picked = new Map<number, string>()
  private change: GroupChange | null = null
  private shownList: ListedContribution[] = []

  view({ attrs }: Vnode<Attrs>) {
    const { contributions, kind, phone, showCrea, groups, ondecide, onsearch } = attrs
    if (contributions !== this.shownList) {
      this.shownList = contributions
      this.open = null
      this.picked.clear()
    }
    const myself = (contribution: ListedContribution) =>
      contribution.user !== null && isTheModerator(adminStore.moderator, contribution.user)
    // on "all" only on the open ones: those a moderator can still act on
    const creaFor = (contribution: ListedContribution) =>
      !myself(contribution) && (kind !== 'all' || isOpen(contribution))
    const groupOptions = [
      { value: '', text: t('contribution.noGroup') },
      ...groups.map(creationGroupOption),
    ]
    const groupOf = (contribution: ListedContribution) => contribution.creationGroups[0]?.tag ?? ''
    const groupLabel = (tag: string) =>
      groupOptions.find((option) => option.value === tag)?.text ?? tag

    const pickGroup = (contribution: ListedContribution, tag: string) => {
      if (tag === groupOf(contribution)) {
        return
      }
      this.picked.set(contribution.id, tag)
      this.change = {
        contribution,
        tag,
        // every group it has: saving replaces them all, and the question says what goes
        from: contribution.creationGroups.length
          ? contribution.creationGroups.map((group) => groupLabel(group.tag)).join(', ')
          : groupLabel(''),
        to: groupLabel(tag),
      }
    }
    const dropChange = () => {
      if (this.change) {
        this.picked.delete(this.change.contribution.id)
      }
      this.change = null
    }
    // The pick stays on screen until the new list comes, so that it does not flick back and forth.
    const confirmChange = async ({ contribution, tag }: GroupChange) => {
      this.change = null
      if (!(await attrs.onassign(contribution.id, tag ? [tag] : []))) {
        this.picked.delete(contribution.id)
      }
    }

    const button = (
      classes: string,
      title: string,
      svg: Children,
      onclick: () => void,
      expanded?: boolean,
    ) =>
      m(
        'button.btn',
        {
          type: 'button',
          class: classes,
          title,
          'aria-label': title,
          'aria-expanded': expanded === undefined ? undefined : String(expanded),
          onclick,
        },
        svg,
      )
    const decideButton = (contribution: ListedContribution, decision: Decision, classes: string) =>
      button(
        classes,
        decision === 'confirm' ? t('save') : t(decision),
        m.trust({ confirm: checkIcon, deny: xIcon, delete: trashIcon }[decision]),
        () => ondecide(contribution, decision),
      )
    const detailsButton = (contribution: ListedContribution, classes: string) => {
      const showing = this.open === contribution.id
      const state = detailsState(contribution)
      return button(
        classes,
        detailsName(contribution, showing),
        showing ? m.trust(arrowUpIcon) : state ? DETAILS_ICONS[state]() : m.trust(arrowDownIcon),
        () => {
          this.open = showing ? null : contribution.id
        },
        showing,
      )
    }
    const searchButton = (contribution: ListedContribution, classes: string) =>
      contribution.user?.emailContact
        ? button(classes, t('filter.byEmail'), m.trust(searchIcon), () =>
            onsearch(contribution.user?.emailContact?.email ?? ''),
          )
        : null
    const creaButton = (contribution: ListedContribution, classes: string) =>
      m(
        'button.btn.btn-link.crea-logo-btn',
        {
          type: 'button',
          class: classes,
          title: t('crea.column'),
          onclick: () => attrs.oncrea(contribution),
        },
        m('img.crea-logo-img', { src: creaLogo, alt: t('crea.column') }),
      )
    // a dropdown while the group can still change, its name once the contribution is closed
    const groupControl = (contribution: ListedContribution) =>
      isOpen(contribution)
        ? m(ThemedSelect, {
            value: this.picked.get(contribution.id) ?? groupOf(contribution),
            options: groupOptions,
            size: 'sm',
            class: 'group-select',
            label: t('contribution.changeGroup'),
            onchange: (tag: string) => pickGroup(contribution, tag),
          })
        : m(
            '.fw-bold',
            contribution.creationGroups.length
              ? m('span', creationGroupLabels(contribution.creationGroups))
              : m('span.fw-normal.fst-italic.text-muted', t('contribution.noGroup')),
          )
    const comment = (contribution: ListedContribution) => {
      const said = memoComment(contribution)
      return said ? m('small.no-select', [m('hr'), ` ${said}`]) : null
    }

    const desk: Record<string, Field<ListedContribution>> = {
      status: { key: 'status', label: t('status'), cell: (c) => statusIcon(c.contributionStatus) },
      delete: {
        key: 'delete',
        label: t('delete'),
        cell: (c) =>
          myself(c) ? null : m('div', decideButton(c, 'delete', 'btn-md btn-danger me-2')),
      },
      deny: {
        key: 'deny',
        label: t('deny'),
        cell: (c) =>
          myself(c) ? null : m('div', decideButton(c, 'deny', 'btn-md btn-warning me-2')),
      },
      search: {
        key: 'search',
        label: '',
        cell: (c) => searchButton(c, 'btn-md btn-link p-0 border-0 text-primary'),
      },
      name: {
        key: 'name',
        label: t('name'),
        class: 'no-select',
        cell: ({ user }) =>
          user
            ? m('span', [
                `${user.firstName} ${user.lastName} `,
                user.alias ? m('small', [m('hr'), ` ${user.alias}`]) : null,
              ])
            : null,
      },
      amount: {
        key: 'amount',
        label: t('creation'),
        cell: (c) => [m('div', `${c.amount} GDD`), avatar(c.user, 'mt-2')],
      },
      memo: {
        key: 'memo',
        label: t('text'),
        class: 'text-break',
        cell: (c) => [m('.mb-1', groupControl(c)), ` ${c.memo} `, comment(c)],
      },
      contributionDate: {
        key: 'contributionDate',
        label: t('created'),
        class: 'no-select',
        cell: (c) => formatDate(c.contributionDate),
      },
      createdAt: {
        key: 'createdAt',
        label: t('createdAt'),
        class: 'no-select',
        cell: (c) => formatDate(c.createdAt),
      },
      closedAt: {
        key: 'closedAt',
        label: t('contributions.closed'),
        class: 'no-select',
        cell: (c) => formatDate(c.closedAt),
      },
      crea: {
        key: 'crea',
        label: t('crea.column'),
        cell: (c) => (creaFor(c) ? m('div', creaButton(c, 'btn-md me-2')) : null),
      },
      details: {
        key: 'details',
        label: t('details'),
        // on the open tab not for the moderator's own; on the closed ones the same in every row
        cell: (c) =>
          kind === 'open'
            ? myself(c)
              ? null
              : m('div', detailsButton(c, 'btn-md btn-secondary'))
            : detailsButton(c, 'btn-md btn-secondary'),
      },
      confirm: {
        key: 'confirm',
        label: t('save'),
        cell: (c) =>
          myself(c) ? null : m('div', decideButton(c, 'confirm', 'btn-md btn-success me-2')),
      },
    }

    // A card: its head with face, name, amount and date, the text in full width, the buttons below.
    // The state of a contribution decides what can be pressed on it; the moderator's own open one
    // offers neither its details nor a decision.
    const card: Field<ListedContribution>[] = [
      {
        key: 'phoneHead',
        label: '',
        cell: (c) =>
          m('.phone-head', [
            m('.phone-face', avatar(c.user)),
            // min-width 0: a long alias is cut off here instead of widening the card
            m('div', { style: 'min-width: 0' }, [
              m('.d-flex.justify-content-between.gap-2', [
                m('span.fw-semibold.text-break', [
                  kind === 'all' ? m('span.me-1', statusIcon(c.contributionStatus)) : null,
                  c.user ? `${c.user.firstName} ${c.user.lastName}`.trim() : '',
                ]),
                m('span.fw-semibold.text-nowrap', `${c.amount} GDD`),
              ]),
              m('.d-flex.justify-content-between.gap-2', [
                m('span.small.text-truncate', { style: 'min-width: 0' }, c.user?.alias ?? ''),
                m('span.small.text-nowrap', formatDate(c.contributionDate)),
              ]),
              isOpen(c)
                ? null
                : m(
                    '.small.text-body-secondary',
                    `${t('createdAt')} ${formatDate(c.createdAt)} · ${t('contributions.closed')} ${formatDate(c.closedAt)}`,
                  ),
            ]),
            m('.phone-search', searchButton(c, 'btn-md btn-link phone-icon-btn text-primary')),
            m('.phone-group', groupControl(c)),
          ]),
      },
      {
        key: 'phoneMemo',
        label: '',
        class: 'text-break',
        cell: (c) => [c.memo, ' ', comment(c)],
      },
      {
        key: 'phoneActions',
        label: '',
        cell: (c) => {
          const decide = isOpen(c) && !myself(c)
          return m('.phone-actions.d-flex.align-items-center.gap-2', [
            decide ? decideButton(c, 'delete', 'btn-md btn-danger phone-icon-btn') : null,
            decide
              ? button('btn-md btn-warning phone-icon-btn', t('deny'), m.trust(xLgIcon), () =>
                  ondecide(c, 'deny'),
                )
              : null,
            m('.d-flex.align-items-center.gap-2.ms-auto', [
              showCrea && creaFor(c) ? creaButton(c, 'btn-md phone-icon-btn') : null,
              isOpen(c) && myself(c)
                ? null
                : detailsButton(c, 'btn-md btn-secondary phone-icon-btn'),
              decide
                ? button(
                    'btn-md btn-success phone-icon-btn',
                    t('contribution.confirm'),
                    m.trust(checkLgIcon),
                    () => ondecide(c, 'confirm'),
                  )
                : null,
            ]),
          ])
        },
      },
    ]

    const columns = {
      open: [
        'delete',
        'deny',
        'search',
        'name',
        'amount',
        'memo',
        'contributionDate',
        'crea',
        'details',
        'confirm',
      ],
      closed: [
        'search',
        'name',
        'amount',
        'memo',
        'contributionDate',
        'createdAt',
        'closedAt',
        'crea',
        'details',
      ],
      all: [
        'status',
        'search',
        'name',
        'amount',
        'memo',
        'contributionDate',
        'createdAt',
        'closedAt',
        'crea',
        'details',
      ],
    }[kind]
      .filter((key) => showCrea || key !== 'crea')
      .map((key) => desk[key])

    return m('.open-creations-table', { class: attrs.class }, [
      m(Table<ListedContribution>, {
        rows: contributions,
        fields: phone ? card : columns,
        class: 'caption-top table-hover b-table-stacked-lg table-striped',
        labelStacked: false,
        rowKey: (c) => c.id,
        rowClass: rowTone,
        details: (c) =>
          this.open === c.id && hasMember(c)
            ? m(
                '.card.shadow-lg.ps-3.pe-3.mb-5.rounded.row-details-card',
                m(
                  '.card-body',
                  m(ContributionThread, {
                    contribution: c,
                    hideResubmission: attrs.hideResubmission,
                    onlist: attrs.onlist,
                    onresubmission: attrs.onresubmission,
                  }),
                ),
              )
            : null,
      }),
      this.change
        ? m(
            Modal,
            {
              title: t('contribution.changeGroup'),
              onclose: dropChange,
              footer: [
                m(
                  'button.btn.btn-md.btn-secondary',
                  { type: 'button', onclick: dropChange },
                  t('overlay.cancel'),
                ),
                m(
                  'button.btn.btn-md.btn-primary',
                  { type: 'button', onclick: () => this.change && confirmChange(this.change) },
                  t('contribution.changeGroupConfirm'),
                ),
              ],
            },
            [
              m(
                'p',
                t('contribution.changeGroupQuestion', {
                  from: this.change.from,
                  to: this.change.to,
                }),
              ),
              m('p.fst-italic.text-muted.mb-0', t('contribution.changeGroupHint')),
            ],
          )
        : null,
    ])
  }
}
