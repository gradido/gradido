// AI-GENERATED — not an architecture reference
import { adminDeleteContribution } from '@/graphql/adminDeleteContribution'
import {
  adminListContributions,
  adminListContributionsCount,
} from '@/graphql/adminListContributions.graphql'
import { adminUpdateContribution } from '@/graphql/adminUpdateContribution'
import { confirmContribution } from '@/graphql/confirmContribution'
import {
  assignContributionCreationGroups,
  creationGroupsAndHandled,
} from '@/graphql/creationGroups.graphql'
import { denyContribution } from '@/graphql/denyContribution'
import '@/pages/CreationConfirm.css'
import BootstrapTooltip from 'bootstrap/js/dist/tooltip'
import type { DocumentNode } from 'graphql'
import m, { type ClassComponent } from 'mithril'
import * as v from 'valibot'
import { Modal } from '@/components/bootstrap/Modal'
import { Pagination } from '@/components/bootstrap/Pagination'
import { Tabs } from '@/components/bootstrap/Tabs'
import { AiChat } from '@/components/creationConfirm/AiChat'
import {
  CreaEvaluationModal,
  type SavedSalutations,
} from '@/components/creationConfirm/CreaEvaluationModal'
import { type Decision, DecisionModal } from '@/components/creationConfirm/DecisionModal'
import type { ResubmissionSaved } from '@/components/creationConfirm/MessageForm'
import { OpenCreationsTable, type TableKind } from '@/components/creationConfirm/OpenCreationsTable'
import { ThemedSelect } from '@/components/ThemedSelect'
import { toastError, toastSuccess, toastWarning } from '@/components/Toasts'
import { UserQuery } from '@/components/UserQuery'
import { CONFIG } from '@/config'
import {
  creationGroupFilterOptions,
  HANDLED_FILTER,
  isOpen,
  OPEN_STATES,
  offersBulkResubmission,
} from '@/data/Contribution.logic'
import {
  contributionCountSchema,
  contributionListSchema,
  type ListedContribution,
} from '@/data/Contribution.schema'
import {
  creationGroupsAndHandledSchema,
  type NumberedCreationGroup,
} from '@/data/CreationGroup.schema'
import { chosenGroupsOf, isSwitchedOff, mayChooseGroups } from '@/data/Moderator.logic'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import {
  adminStore,
  askingHandledCreationGroups,
  keepHandledCreationGroups,
} from '@/store/admin.store'
import { askMemberAvatars } from '@/store/memberAvatars.store'
import {
  answerOpenCreations,
  askingOpenCreations,
  askOpenCreations,
} from '@/store/openCreations.store'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from '@/utils/lastSearch'
import { isPhone } from '@/viewport'
import bellIcon from '~icons/bi/bell-fill'
import checkIcon from '~icons/bi/check'
import listIcon from '~icons/bi/list'
import trashIcon from '~icons/bi/trash'
import xCircleIcon from '~icons/bi/x-circle'

// the page the last search and tab are kept for (lastSearch.ts), as the old router named it
const LAST_SEARCH_PAGE = '/creation-confirm'
const PAGE_SIZE = 25

// What each tab shows, in their order. "All" mixes the states, and its rows say which one each is.
const TABS: { icon: string; tone: string; word: string; states: string[]; kind: TableKind }[] = [
  {
    icon: bellIcon,
    tone: 'text-primary',
    word: 'contributions.open',
    states: OPEN_STATES,
    kind: 'open',
  },
  {
    icon: checkIcon,
    tone: 'text-success',
    word: 'contributions.confirms',
    states: ['CONFIRMED'],
    kind: 'closed',
  },
  {
    icon: xCircleIcon,
    tone: 'text-warning-emphasis',
    word: 'contributions.denied',
    states: ['DENIED'],
    kind: 'closed',
  },
  {
    icon: trashIcon,
    tone: 'text-danger',
    word: 'contributions.deleted',
    states: ['DELETED'],
    kind: 'closed',
  },
  {
    icon: listIcon,
    tone: '',
    word: 'contributions.all',
    states: [...OPEN_STATES, 'CONFIRMED', 'DENIED', 'DELETED'],
    kind: 'all',
  },
]

const DECISIONS: Record<Decision, { mutation: DocumentNode; done: string }> = {
  confirm: { mutation: confirmContribution, done: 'creation_form.toasted_created' },
  deny: { mutation: denyContribution, done: 'creation_form.toasted_denied' },
  delete: { mutation: adminDeleteContribution, done: 'creation_form.toasted_delete' },
}

// A selected text is copied without its hashtags: the groups a member named are no part of it.
const copyWithoutHashtags = (event: ClipboardEvent) => {
  const selected = getSelection()?.toString()
  if (selected) {
    event.clipboardData?.setData('text/plain', selected.replace(/#([\p{L}\p{N}_-]+)/gu, ''))
    event.preventDefault()
  }
}

/**
 * The contributions to moderate, under one tab per state, 25 to a page: searched by text or by a
 * member, filtered by group, and on the open tab without those put off to a resubmission date.
 * Each open one is confirmed, denied or deleted after a question. The search and the tab are kept
 * for each moderator on this device (lastSearch.ts).
 */
export class CreationConfirm implements ClassComponent {
  private readonly moderator = adminStore.moderator
  private tab = lastTab(LAST_SEARCH_PAGE, this.moderator?.gradidoID, TABS.length)
  private query = lastSearch(LAST_SEARCH_PAGE, this.moderator?.gradidoID)
  private hideResubmission = true
  private groups: NumberedCreationGroup[] = []
  // The first choice on offer, known before the groups are: "Meine Gruppen" for whoever sees every
  // group, whether or not the admin knows the choice yet (MG1); a scoped moderator has no "all". Who
  // switched the creations off (MG5) opens on everything: nothing of them is theirs.
  private group =
    this.moderator && !isSwitchedOff(this.moderator, adminStore.handledCreationGroups)
      ? creationGroupFilterOptions(this.moderator, [], null)[0].value
      : ''
  private page = 1
  private contributions: ListedContribution[] = []
  private count = 0
  // The number at "Offen": the open contributions the search, the group and the box let through,
  // on all pages (Bernd, 26.11.2026). The answer of the open tab's list; beside another tab a count
  // of its own. Where it is the badges' count, it starts from theirs.
  private openCount = this.countsTheBadges() ? adminStore.openCreations : 0
  // the question about it last asked: an answer to one before is dropped
  private openAsked = 0
  // A kept search that finds nothing any more gives way to the whole list -- on the first answer
  // only: a search given here stays, also where it finds nothing.
  private keptOnTrial = this.query !== ''
  // the question last asked: an answer to one before is dropped
  private asked = 0
  private decision: { contribution: ListedContribution; decision: Decision } | null = null
  // the contribution Crea's window shows
  private crea: ListedContribution | null = null
  private readonly savedSalutations: SavedSalutations = new Map()
  // the contributions whose decision is on its way: a second press sends nothing
  private readonly deciding = new Set<number>()
  private tooltip?: BootstrapTooltip
  // a resubmission saved on one contribution, offered for the member's others
  private bulk: { resubmissionAt: string | null; name: string; currentId: number } | null = null
  // the question for the groups and the choice, on its way from the page's opening
  private choice: Promise<void> = Promise.resolve()

  oninit() {
    // What the open tab's list does not answer is counted apart (countAnew): the badges where the
    // page opens on another list than theirs -- a kept search, the first group choice of a scoped
    // moderator --, and the number at "Offen" where it opens on another tab.
    this.countAnew()
    // The groups and the choice: the first list does not wait for them. The choice changes the
    // words of the filter, and whether "(mit und ohne Gruppe)" stands for "" or HANDLED_FILTER.
    const of = this.moderator?.gradidoID
    const choiceAsked = askingHandledCreationGroups()
    this.choice = graphqlRequest(creationGroupsAndHandled).then((answer) => {
      if (answer.success) {
        const { creationGroups, handledCreationGroups } = v.parse(
          creationGroupsAndHandledSchema,
          answer.value,
        )
        this.groups = creationGroups
        keepHandledCreationGroups(of, handledCreationGroups, choiceAsked)
        // "" is offered with a choice only. Picked while the page still knew one that was cleared
        // on another device, the same list is called by the row that now means everything.
        const off = isSwitchedOff(this.moderator, adminStore.handledCreationGroups)
        if (
          this.group === '' &&
          !off &&
          !chosenGroupsOf(this.moderator, adminStore.handledCreationGroups)
        ) {
          this.group = HANDLED_FILTER
        } else if (off && this.group === HANDLED_FILTER) {
          // asked before the admin knew: nothing of the creations is theirs (MG5). No search given
          // here: a kept one stays on trial, for this list to judge (coderabbit on #4318).
          this.group = ''
          this.page = 1
          this.load()
          if (this.tab !== 0) {
            this.countOpen()
          }
        }
      }
    })
    this.load()
  }

  oncreate() {
    document.addEventListener('copy', copyWithoutHashtags)
  }

  onremove() {
    document.removeEventListener('copy', copyWithoutHashtags)
  }

  // Whether the open contributions the page counts are the badges' (MG1): no search, the
  // resubmissions hidden, "Meine Gruppen" -- what the start page counts. Only then does an answer
  // about them set the badges too.
  private countsTheBadges() {
    return this.query === '' && this.hideResubmission && this.group === HANDLED_FILTER
  }

  private async load() {
    const asked = ++this.asked
    // The open tab's list answers the number at "Offen", and the badges where it is their count:
    // each by its own mark, also where the page has asked for another list since (MG1).
    const opens = this.tab === 0
    const openAsked = opens ? ++this.openAsked : 0
    const badgeAsked = opens && this.countsTheBadges() ? askingOpenCreations() : 0
    const answer = await graphqlRequest(adminListContributions, {
      filter: {
        statusFilter: TABS[this.tab].states,
        query: this.query,
        // the resubmissions are hidden on the open tab only
        hideResubmission: this.tab === 0 && this.hideResubmission,
        creationGroup: this.group,
      },
      paginated: { currentPage: this.page, pageSize: PAGE_SIZE, order: 'DESC' },
    })
    if (!answer.success) {
      if (asked === this.asked) {
        toastError(answer.error.message)
      }
      return
    }
    const { contributionCount, contributionList } = v.parse(
      contributionListSchema,
      answer.value,
    ).adminListContributions
    if (badgeAsked) {
      answerOpenCreations(badgeAsked, contributionCount)
    }
    if (opens && openAsked === this.openAsked) {
      this.openCount = contributionCount
    }
    if (asked !== this.asked) {
      return
    }
    if (this.keptOnTrial && contributionCount === 0) {
      // "Meine Gruppen" switched off finds nothing, whatever the search (MG5): then the choice asks
      // for another list, and that one judges it
      await this.choice
      if (asked !== this.asked) {
        return
      }
      this.query = ''
      this.searchAnew()
      return
    }
    this.keptOnTrial = false
    this.contributions = contributionList
    this.count = contributionCount
    askMemberAvatars(contributionList.flatMap((contribution) => contribution.user ?? []))
  }

  // What the open tab's list does not answer, counted apart -- at the opening, and after a write
  // the list follows or need not follow: the badges where the page counts another list than theirs
  // (MG1), and beside another tab the number at "Offen".
  private countAnew() {
    if (!this.countsTheBadges()) {
      askOpenCreations()
    }
    if (this.tab !== 0) {
      this.countOpen()
    }
  }

  /**
   * The number at "Offen" asked on its own: beside another tab, and after a decision, which leaves
   * the list as it is. Where it is the badges' count, they are set with it: one question, not two.
   * A failed one leaves both as they were.
   */
  private async countOpen() {
    const openAsked = ++this.openAsked
    const badgeAsked = this.countsTheBadges() ? askingOpenCreations() : 0
    const answer = await graphqlRequest(adminListContributionsCount, {
      filter: {
        statusFilter: OPEN_STATES,
        query: this.query,
        hideResubmission: this.hideResubmission,
        creationGroup: this.group,
      },
    })
    if (!answer.success) {
      return
    }
    const count = v.parse(contributionCountSchema, answer.value).adminListContributions
      .contributionCount
    if (badgeAsked) {
      answerOpenCreations(badgeAsked, count)
    }
    if (openAsked === this.openAsked) {
      this.openCount = count
    }
  }

  // The search, the group or the box changed: the list from its first page -- a later one may not
  // be in a narrower list --, and beside another tab the number at "Offen" asked anew.
  private searchAnew() {
    this.keptOnTrial = false
    this.page = 1
    keepLastSearch(LAST_SEARCH_PAGE, this.moderator?.gradidoID, this.query)
    this.load()
    if (this.tab !== 0) {
      this.countOpen()
    }
  }

  private async decide() {
    if (!this.decision) {
      return
    }
    const { contribution, decision } = this.decision
    if (this.deciding.has(contribution.id)) {
      return
    }
    this.deciding.add(contribution.id)
    const answer = await graphqlRequest(DECISIONS[decision].mutation, { id: contribution.id })
    this.deciding.delete(contribution.id)
    // The answer goes to the contribution it was sent for: the dialog may show another one by now,
    // and closes only if it still shows this one.
    if (this.decision?.contribution.id === contribution.id) {
      this.decision = null
    }
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    this.contributions = this.contributions.filter(({ id }) => id !== contribution.id)
    // The list stays, a row fewer: the number at "Offen" and the badges are counted anew, also on
    // the badges' list -- one fewer could take the contribution off a count that already left it
    // out, or that it was never in (MG1). Two questions where the page counts another list.
    if (!this.countsTheBadges()) {
      askOpenCreations()
    }
    this.countOpen()
    toastSuccess(t(DECISIONS[decision].done))
  }

  private async assign(contributionId: number, tags: string[]) {
    const answer = await graphqlRequest(assignContributionCreationGroups, { contributionId, tags })
    if (!answer.success) {
      toastError(answer.error.message)
      return false
    }
    // whether the contribution is still in the list is the server's to say, and in "Meine Gruppen"
    this.countAnew()
    this.load()
    toastSuccess(t('contribution.changeGroupDone'))
    return true
  }

  private resubmissionSaved(saved: ResubmissionSaved) {
    // a resubmission set or taken away moves the contribution in or out of the open count
    if (!saved.unchanged) {
      this.countAnew()
    }
    if (offersBulkResubmission(this.contributions, saved)) {
      const user = this.contributions[0].user
      this.bulk = {
        resubmissionAt: saved.resubmissionAt,
        name: user ? `${user.firstName} ${user.lastName}` : '',
        currentId: saved.id,
      }
    } else if (saved.unchanged) {
      // nothing changed and nobody to spread it to: a notice, not the server's error
      toastWarning(t('bulkResubmission.noChange'))
    }
  }

  // The others, the one just saved left out. One that already holds it ("wasn't changed") is no
  // failure and stops nothing.
  private async applyBulk({ resubmissionAt, currentId }: NonNullable<CreationConfirm['bulk']>) {
    const answers = await Promise.all(
      this.contributions
        .filter((contribution) => isOpen(contribution) && contribution.id !== currentId)
        .map(({ id }) => graphqlRequest(adminUpdateContribution, { id, resubmissionAt })),
    )
    const failure = answers.find(
      (answer) => !answer.success && !answer.error.message.includes("wasn't changed"),
    )
    if (failure && !failure.success) {
      toastError(failure.error.message)
    } else {
      toastSuccess(
        t(resubmissionAt === null ? 'bulkResubmission.successRemove' : 'bulkResubmission.success'),
      )
    }
    this.countAnew()
    this.load()
  }

  view() {
    const phone = isPhone()
    const role = this.moderator?.role
    const aiUser = role === 'ADMIN' || role === 'MODERATOR_AI'
    // Crea for AI moderators on the open tab and on "all"; administrators besides on the closed
    // tabs, to test it against the whole pool. Only a guide: the server checks the right.
    const showCrea = this.tab === 0 || this.tab === 4 ? aiUser : role === 'ADMIN'
    const showChat = CONFIG.ANTHROPIC_ACTIVE && aiUser
    const chosen = chosenGroupsOf(this.moderator, adminStore.handledCreationGroups)
    const off = isSwitchedOff(this.moderator, adminStore.handledCreationGroups)
    return m('.creation-confirm', [
      // the page's name, the menu's word, as the start page and "Meine Gruppen" have theirs
      m('h2.h4.mb-3', t('creation')),
      // the search and the group side by side; on a narrow window one above the other
      m('.creation-filters.mt-2.mb-2', [
        m(UserQuery, {
          class: 'creation-search',
          placeholder: t('user_memo_search'),
          value: this.query,
          oninput: (query: string) => {
            this.query = query
            this.searchAnew()
          },
        }),
        m(ThemedSelect, {
          class: 'creation-group-filter',
          'data-test': 'creation-group-filter',
          value: this.group,
          options: this.moderator
            ? creationGroupFilterOptions(this.moderator, this.groups, chosen, off)
            : [],
          // a way to the page of the choice, below the groups: leaves the filter as it is
          link: mayChooseGroups(this.moderator)
            ? {
                href: '/my-groups',
                text: t(
                  chosen || off ? 'creationGroupFilter.editMine' : 'creationGroupFilter.chooseMine',
                ),
                'data-test': 'creation-group-filter-mine',
              }
            : undefined,
          onchange: (group: string) => {
            this.group = group
            this.searchAnew()
          },
        }),
      ]),
      this.tab === 0
        ? // the word is the label of the box, so a tap on it ticks the box too
          m('p.mb-4.d-flex.align-items-center.hide-resubmission-row', [
            m('input.hideResubmission#hide-resubmission', {
              type: 'checkbox',
              checked: this.hideResubmission,
              onchange: (event: Event) => {
                this.hideResubmission = (event.target as HTMLInputElement).checked
                // Fixed: the old admin asked for the page it stood on, which a narrower list
                // may not have.
                this.searchAnew()
              },
            }),
            m(
              'label.ms-2',
              {
                for: 'hide-resubmission',
                oncreate: ({ dom }: m.VnodeDOM) => {
                  this.tooltip = new BootstrapTooltip(dom, {
                    title: t('hide_resubmission_tooltip'),
                  })
                },
                onremove: () => this.tooltip?.dispose(),
              },
              t('hide_resubmission'),
            ),
          ])
        : null,
      m(
        'div',
        m(Tabs, {
          class: 'creation-tabs page-tabs',
          contentClass: 'mt-3',
          fill: true,
          active: this.tab,
          onchange: (tab: number) => {
            this.tab = tab
            keepLastTab(LAST_SEARCH_PAGE, this.moderator?.gradidoID, tab)
            this.contributions = []
            // the same search, group and box: the number at "Offen" stays as it was counted
            this.keptOnTrial = false
            this.page = 1
            this.load()
          },
          // on a phone the symbol stands above the word and the number at the corner (App.css)
          tabs: TABS.map(({ icon, tone, word }, index) => ({
            title: [
              m.trust(tone ? icon.replace('<svg ', `<svg class="${tone}" `) : icon),
              ' ',
              m('span.tab-word', t(word)),
              ' ',
              index === 0 && this.openCount > 0
                ? m('span.badge.text-body.bg-body-secondary.tab-badge', this.openCount)
                : null,
            ],
          })),
        }),
      ),
      // At the desk the last buttons of a row keep clear of the chat's button in the corner; a card
      // has no room for that, it rolls away instead.
      m(OpenCreationsTable, {
        class: showChat && !phone ? 'mt-4 beside-crea-chat' : 'mt-4',
        contributions: this.contributions,
        kind: TABS[this.tab].kind,
        phone,
        showCrea,
        groups: this.groups,
        ondecide: (contribution: ListedContribution, decision: Decision) => {
          this.decision = { contribution, decision }
        },
        onsearch: (email: string) => {
          this.query = email
          this.searchAnew()
        },
        onassign: (contributionId: number, tags: string[]) => this.assign(contributionId, tags),
        hideResubmission: this.tab === 0 && this.hideResubmission,
        // the text changed, or a resubmission hides the contribution: the list as it is now, and
        // beside another tab the number at "Offen" -- a search may no longer find it
        onlist: () => {
          this.load()
          if (this.tab !== 0) {
            this.countOpen()
          }
        },
        onresubmission: (saved: ResubmissionSaved) => this.resubmissionSaved(saved),
        oncrea: (contribution: ListedContribution) => {
          this.crea = contribution
        },
      }),
      // on a phone `‹`, three numbers and `›`; at the desk five places with the ellipses, and « »
      m(Pagination, {
        class: 'justify-content-center pagination-lg b-pagination-pills phone-pager',
        page: this.page,
        pages: Math.ceil(this.count / PAGE_SIZE),
        limit: phone ? 3 : 5,
        noEndButtons: phone,
        onpage: (page: number) => {
          this.page = page
          this.load()
        },
      }),
      this.decision
        ? m(DecisionModal, {
            ...this.decision,
            onyes: () => this.decide(),
            onclose: () => {
              this.decision = null
            },
          })
        : null,
      this.bulk ? this.bulkModal(this.bulk) : null,
      showChat ? m(AiChat) : null,
      // a window of its own for each contribution, in a list of its own for the key: nothing of
      // the last one carries over
      this.crea
        ? [
            m(CreaEvaluationModal, {
              key: this.crea.id,
              contribution: this.crea,
              savedSalutations: this.savedSalutations,
              onclose: () => {
                this.crea = null
              },
            }),
          ]
        : null,
    ])
  }

  // removing a resubmission speaks of removing, otherwise of taking the date over
  private bulkModal(bulk: NonNullable<CreationConfirm['bulk']>) {
    const removing = bulk.resubmissionAt === null
    const close = () => {
      this.bulk = null
    }
    return m(
      Modal,
      {
        title: t(removing ? 'bulkResubmission.titleRemove' : 'bulkResubmission.title'),
        onclose: close,
        footer: [
          m(
            'button.btn.btn-md.btn-secondary',
            { type: 'button', onclick: close },
            t('bulkResubmission.cancel'),
          ),
          m(
            'button.btn.btn-md.btn-primary',
            {
              type: 'button',
              onclick: () => {
                close()
                this.applyBulk(bulk)
              },
            },
            t('bulkResubmission.confirm'),
          ),
        ],
      },
      t(removing ? 'bulkResubmission.questionRemove' : 'bulkResubmission.question', {
        name: bulk.name,
      }),
    )
  }
}
