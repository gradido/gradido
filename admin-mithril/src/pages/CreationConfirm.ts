// AI-GENERATED — not an architecture reference
import { adminDeleteContribution } from '@admin/graphql/adminDeleteContribution'
import {
  adminListContributions,
  adminListContributionsCount,
} from '@admin/graphql/adminListContributions.graphql'
import { adminUpdateContribution } from '@admin/graphql/adminUpdateContribution'
import { confirmContribution } from '@admin/graphql/confirmContribution'
import {
  assignContributionCreationGroups,
  creationGroups,
} from '@admin/graphql/creationGroups.graphql'
import { denyContribution } from '@admin/graphql/denyContribution'
import '@admin/pages/CreationConfirm.css'
import { CONFIG } from '@admin/config'
import { keepLastSearch, keepLastTab, lastSearch, lastTab } from '@admin/utils/lastSearch'
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
import { groupFilterOptions, isOpen, offersBulkResubmission } from '@/data/Contribution.logic'
import {
  contributionCountSchema,
  contributionListSchema,
  type ListedContribution,
} from '@/data/Contribution.schema'
import { creationGroupNameSchema } from '@/data/CreationGroup.schema'
import { graphqlRequest } from '@/graphql/client'
import { t } from '@/i18n'
import { adminStore, setOpenCreations } from '@/store/admin.store'
import { askMemberAvatars } from '@/store/memberAvatars.store'
import { isPhone } from '@/viewport'
import bellIcon from '~icons/bi/bell-fill'
import checkIcon from '~icons/bi/check'
import listIcon from '~icons/bi/list'
import trashIcon from '~icons/bi/trash'
import xCircleIcon from '~icons/bi/x-circle'

// the page the last search and tab are kept for (lastSearch.ts), as the old router named it
const LAST_SEARCH_PAGE = '/creation-confirm'
const PAGE_SIZE = 25
const OPEN = ['IN_PROGRESS', 'PENDING']

// What each tab shows, in their order. "All" mixes the states, and its rows say which one each is.
const TABS: { icon: string; tone: string; word: string; states: string[]; kind: TableKind }[] = [
  { icon: bellIcon, tone: 'text-primary', word: 'contributions.open', states: OPEN, kind: 'open' },
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
    states: [...OPEN, 'CONFIRMED', 'DENIED', 'DELETED'],
    kind: 'all',
  },
]

const DECISIONS: Record<Decision, { mutation: DocumentNode; done: string }> = {
  confirm: { mutation: confirmContribution, done: 'creation_form.toasted_created' },
  deny: { mutation: denyContribution, done: 'creation_form.toasted_denied' },
  delete: { mutation: adminDeleteContribution, done: 'creation_form.toasted_delete' },
}

const groupsSchema = v.object({
  creationGroups: v.array(creationGroupNameSchema),
})

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
  private groups: v.InferOutput<typeof groupsSchema>['creationGroups'] = []
  // the first choice on offer: a scoped moderator has no "all", and their choices are known
  // before the groups are
  private group = this.moderator ? groupFilterOptions(this.moderator, [])[0].value : ''
  private page = 1
  private contributions: ListedContribution[] = []
  private count = 0
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

  oninit() {
    // The badges count every open contribution; where the page opens with a search, its list
    // counts only what the search leaves, so they are counted apart.
    if (this.keptOnTrial) {
      graphqlRequest(adminListContributionsCount, {
        filter: { statusFilter: OPEN, hideResubmission: true },
      }).then((answer) => {
        // where it fails the badges keep their count; the list says on its own what went wrong
        if (answer.success) {
          setOpenCreations(
            v.parse(contributionCountSchema, answer.value).adminListContributions.contributionCount,
          )
        }
      })
    }
    graphqlRequest(creationGroups).then((answer) => {
      if (answer.success) {
        this.groups = v.parse(groupsSchema, answer.value).creationGroups
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

  private async load() {
    const asked = ++this.asked
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
    if (asked !== this.asked) {
      return
    }
    if (!answer.success) {
      toastError(answer.error.message)
      return
    }
    const { contributionCount, contributionList } = v.parse(
      contributionListSchema,
      answer.value,
    ).adminListContributions
    if (this.keptOnTrial && contributionCount === 0) {
      this.query = ''
      this.searchAnew()
      return
    }
    this.keptOnTrial = false
    this.contributions = contributionList
    this.count = contributionCount
    askMemberAvatars(contributionList.flatMap((contribution) => contribution.user ?? []))
    // the badges count all open contributions, never the few a search leaves
    if (this.tab === 0 && this.query === '') {
      setOpenCreations(contributionCount)
    }
  }

  // a narrower or another list starts at its first page: a later one may not be in it
  private searchAnew() {
    this.keptOnTrial = false
    this.page = 1
    keepLastSearch(LAST_SEARCH_PAGE, this.moderator?.gradidoID, this.query)
    this.load()
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
    setOpenCreations(adminStore.openCreations - 1)
    toastSuccess(t(DECISIONS[decision].done))
  }

  private async assign(contributionId: number, tags: string[]) {
    const answer = await graphqlRequest(assignContributionCreationGroups, { contributionId, tags })
    if (!answer.success) {
      toastError(answer.error.message)
      return false
    }
    // whether the contribution is still in the list is the server's to say
    this.load()
    toastSuccess(t('contribution.changeGroupDone'))
    return true
  }

  private resubmissionSaved(saved: ResubmissionSaved) {
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
    return m('.creation-confirm', [
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
          options: this.moderator ? groupFilterOptions(this.moderator, this.groups) : [],
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
            this.searchAnew()
          },
          // on a phone the symbol stands above the word and the number at the corner (App.css)
          tabs: TABS.map(({ icon, tone, word }, index) => ({
            title: [
              m.trust(tone ? icon.replace('<svg ', `<svg class="${tone}" `) : icon),
              ' ',
              m('span.tab-word', t(word)),
              ' ',
              index === 0 && adminStore.openCreations > 0
                ? m('span.badge.text-bg-danger.tab-badge', adminStore.openCreations)
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
        onlist: () => this.load(),
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
