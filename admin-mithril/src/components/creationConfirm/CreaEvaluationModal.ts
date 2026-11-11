// AI-GENERATED — not an architecture reference
import creaLogo from '@admin/../public/img/crea-logo.jpg'
import classes from '@admin/components/CreaEvaluationModal.module.css'
import { playCreaSound, primeCreaSound } from '@admin/composables/useCreaSound'
import { adminListContributions } from '@admin/graphql/adminListContributions.graphql'
import {
  creaEvaluateBatch,
  creaEvaluateContribution,
  creaRewriteBatch,
  creaRewriteResponse,
  setCreaSalutation,
} from '@admin/graphql/crea.graphql'
import { userRemark } from '@admin/graphql/userRemark'
import m, { type ClassComponent, type Vnode, type VnodeDOM } from 'mithril'
import * as v from 'valibot'
import { boldShortcut } from '@/components/boldShortcut'
import { Modal } from '@/components/bootstrap/Modal'
import { toastError, toastSuccess } from '@/components/Toasts'
import {
  contributionListSchema,
  type ListedContribution,
  userRemarkSchema,
} from '@/data/Contribution.schema'
import { type CreaEvaluation, creaEvaluationSchema, creaRewriteSchema } from '@/data/Crea.schema'
import {
  batchInput,
  contributionMeta,
  evaluationInput,
  renderDraft,
  sectionsByResubmission,
  shownFlags,
  tenureKey,
} from '@/data/CreaEvaluation.logic'
import { graphqlRequest } from '@/graphql/client'
import { currentLocale, t } from '@/i18n'
import {
  creaSignature,
  keepCreaDraft,
  keepCreaNote,
  keepCreaSignature,
} from '@/store/creaDrafts.store'
import {
  attachRemark,
  closeRemark,
  detachRemark,
  flushRemark,
  openRemark,
  type RemarkCard,
  takeRemark,
} from '@/store/userRemarks.store'
import { isPhone } from '@/viewport'
import copyIcon from '~icons/bi/copy'
import { RemarkEditor, remarkLine, remarkToggle } from './MemberRemark'

// as the users.salutation column: longer is stopped at the field, not by the database
const SALUTATION_MAX_LENGTH = 255

type Verdict = 'confirm' | 'inquire' | 'deny'

/** The salutations stored while the page is open, by member: the list behind it is not read anew. */
export type SavedSalutations = Map<number, string | null>

interface Attrs {
  contribution: ListedContribution
  savedSalutations: SavedSalutations
  onclose: () => void
}

let lastId = 0

/**
 * Crea's evaluation of a contribution -- advice only: confirming, denying and sending stay the
 * table's. With one open contribution of the member it is judged as the window opens; with
 * several the moderator ticks which Crea judges together. A member with a remark waits for
 * "Bewerten": the moderator decides first whether Crea reads it. The reply comes with [ANREDE]
 * and [SIGNATUR], filled in here, so no name reaches the API.
 */
export class CreaEvaluationModal implements ClassComponent<Attrs> {
  private readonly remarkFieldId = `crea-remark-field-${++lastId}`
  private contribution!: ListedContribution
  private saved!: SavedSalutations
  private gone = false
  private remark: RemarkCard | null = null
  private remarkButton?: HTMLElement
  private readsRemark = false
  // a single contribution of a member with a remark waits for "Bewerten"; so does one Crea failed
  private awaiting = false
  // what Crea read in the last evaluation of a single contribution; undefined before one
  private remarkJudged: string | null | undefined = undefined
  // the member's open contributions, two or more: judged together
  private siblings: ListedContribution[] = []
  private readonly selected = new Set<number>()
  // the clock the checklist is built against, taken as the window opens
  private readonly openedAt = new Date()
  // the member's record as just read: undefined is "not read", null "no salutation"
  private loadedSalutation: string | null | undefined = undefined

  private loading = false
  private inactive = false
  private error = ''
  private evaluation: CreaEvaluation | null = null
  private chosen: string | null = null
  private context = ''
  private rewriting = false
  private supplement = ''
  // Crea's reply with the placeholders, and as it stands in the field
  private raw = ''
  private response = ''
  private model = ''
  // what is typed, what the member's record holds, and what the name alone gives
  private salutation = ''
  private storedSalutation = ''
  private defaultSalutation = ''
  private savingSalutation = false
  // a salutation stored here answers Crea's question of the salutation
  private settled = false
  private signature = creaSignature()

  oninit({ attrs }: Vnode<Attrs>) {
    this.contribution = attrs.contribution
    this.saved = attrs.savedSalutations
    const { userId } = this.contribution
    if (userId !== null) {
      this.remark = attachRemark(userId, () =>
        toastError(t('remark.failedClosed', { name: this.userName() })),
      )
    }
    this.open(userId)
  }

  onremove() {
    this.gone = true
    if (this.remark) {
      detachRemark(this.remark)
    }
  }

  private async open(userId: number | null) {
    if (userId === null) {
      this.evaluate(false)
      return
    }
    const remarkRead = this.loadRemark(userId)
    const siblings = await this.loadSiblings(userId)
    if (this.gone) {
      return
    }
    if (siblings.length > 0) {
      this.loadedSalutation = siblings[0].user?.salutation ?? null
    }
    if (siblings.length >= 2) {
      this.siblings = siblings
      // never put off is ticked, and the one asked for wherever it sits: "seen before" decides
      const [first] = sectionsByResubmission(siblings, this.openedAt)
      for (const { id } of first.key === 'open' ? first.items : []) {
        this.selected.add(id)
      }
      this.selected.add(this.contribution.id)
    } else {
      await remarkRead
      if (this.gone) {
        return
      }
      if (this.keptRemark() === null) {
        this.evaluate(false)
      } else {
        this.awaiting = true
      }
    }
    m.redraw()
  }

  // Not read, the button stays unpressable; Crea reads the remark from the server all the same.
  private async loadRemark(userId: number) {
    const answer = await graphqlRequest(userRemark, { userId })
    if (answer.success && this.remark) {
      takeRemark(
        this.remark,
        v.parse(v.object({ userRemark: v.nullable(userRemarkSchema) }), answer.value).userRemark,
      )
    }
  }

  // read anew: the list behind the window may predate a salutation stored since; none on failure
  private async loadSiblings(userId: number) {
    const answer = await graphqlRequest(adminListContributions, {
      filter: { statusFilter: ['IN_PROGRESS', 'PENDING'], userId },
      paginated: { currentPage: 1, pageSize: 50, order: 'DESC' },
    })
    return answer.success
      ? v.parse(contributionListSchema, answer.value).adminListContributions.contributionList
      : []
  }

  private userName() {
    const { user } = this.contribution
    return user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : ''
  }

  // What the server keeps of the words in the field: whitespace alone is no remark.
  private keptRemark() {
    const draft = this.remark?.entry.draft ?? ''
    return draft.trim() === '' ? null : draft
  }

  private remarkForCrea() {
    return this.readsRemark ? this.keptRemark() : null
  }

  private isBatch() {
    return this.siblings.length >= 2
  }

  // Newest source first. Each asks WHETHER it knows, not what: a cleared salutation is null.
  private salutationFor() {
    const { userId, user } = this.contribution
    if (userId !== null && this.saved.has(userId)) {
      return this.saved.get(userId) ?? null
    }
    return this.loadedSalutation !== undefined ? this.loadedSalutation : (user?.salutation ?? null)
  }

  private effectiveSalutation() {
    return this.salutation.trim() || this.defaultSalutation
  }

  private salutationChanged() {
    return this.salutation.trim() !== this.storedSalutation.trim()
  }

  // the one place the draft is rendered, so no path picks another salutation than the others
  private applyDraft() {
    this.typeResponse(renderDraft(this.raw, this.effectiveSalutation(), this.signature))
  }

  // The draft follows the salutation and the signature -- until it was edited by hand.
  private follow(change: () => void) {
    const before = renderDraft(this.raw, this.effectiveSalutation(), this.signature)
    change()
    if (this.evaluation && this.response === before) {
      this.applyDraft()
    }
  }

  private input() {
    return evaluationInput(
      this.contribution,
      this.salutationFor(),
      this.readsRemark,
      currentLocale(),
    )
  }

  private batchInput() {
    return batchInput(
      this.siblings.filter(({ id }) => this.selected.has(id)),
      this.contribution,
      this.salutationFor(),
      this.readsRemark,
      currentLocale(),
    )
  }

  // shared by the single and the batch path; a correction typed and not saved stays
  private applyEvaluation(result: CreaEvaluation) {
    this.evaluation = result
    this.raw = result.responseText
    this.model = result.model
    this.defaultSalutation = result.defaultSalutation ?? ''
    const stored = this.salutationFor() ?? ''
    if (!this.salutationChanged()) {
      this.salutation = stored
    }
    this.storedSalutation = stored
    this.applyDraft()
    // Crea's own recommendation preselected: switching away is deviating
    this.chosen = result.overallVerdict
    this.context = ''
  }

  // Asks Crea for one judgement, of the single contribution or of the ticked ones together.
  private async evaluate(batch: boolean) {
    this.awaiting = false
    this.loading = true
    this.inactive = false
    this.error = ''
    this.evaluation = null
    primeCreaSound()
    if (this.remark) {
      await flushRemark(this.remark)
    }
    if (this.gone) {
      return
    }
    if (!batch) {
      this.remarkJudged = this.readsRemark ? (this.remark?.entry.saved?.remark ?? null) : null
    }
    const answer = batch
      ? await graphqlRequest(creaEvaluateBatch, { input: this.batchInput() })
      : await graphqlRequest(creaEvaluateContribution, { input: this.input() })
    if (this.gone) {
      return
    }
    this.loading = false
    if (answer.success) {
      const field = batch ? 'creaEvaluateBatch' : 'creaEvaluateContribution'
      this.applyEvaluation(
        v.parse(v.object({ [field]: creaEvaluationSchema }), answer.value)[field],
      )
      playCreaSound()
    } else if (/not enabled/i.test(answer.error.message)) {
      // Crea dormant until the API key is set: a calm hint, not an error
      this.inactive = true
    } else {
      this.error = answer.error.message
      // "Bewerten" stays, to try again: closing would turn "Crea liest mit" off
      this.awaiting = !batch
    }
    m.redraw()
  }

  // A fresh reply for the moderator's own decision; Crea's assessment stays as it was.
  private async rewrite() {
    this.rewriting = true
    primeCreaSound()
    if (this.remark) {
      await flushRemark(this.remark)
    }
    if (this.gone) {
      return
    }
    const decision = {
      moderatorDecision: this.chosen,
      moderatorContext: this.context.trim() || null,
    }
    const batch = this.isBatch()
    const answer = batch
      ? await graphqlRequest(creaRewriteBatch, { input: { ...this.batchInput(), ...decision } })
      : await graphqlRequest(creaRewriteResponse, { input: { ...this.input(), ...decision } })
    if (this.gone) {
      return
    }
    this.rewriting = false
    if (answer.success) {
      const field = batch ? 'creaRewriteBatch' : 'creaRewriteResponse'
      const result = v.parse(v.object({ [field]: creaRewriteSchema }), answer.value)[field]
      this.raw = result.responseText
      this.model = result.model
      this.applyDraft()
      // a confirmation carries the public note for the contribution's text
      this.typeSupplement(result.memoSupplement ?? '')
      playCreaSound()
    } else {
      toastError(answer.error.message)
    }
    m.redraw()
  }

  private typeSupplement(text: string) {
    this.supplement = text
    if (text) {
      keepCreaNote(text)
    }
  }

  // An emptied field clears the stored salutation and hands the choice back to the name.
  private async saveSalutation(userId: number) {
    const value = this.salutation.trim()
    this.savingSalutation = true
    const answer = await graphqlRequest(setCreaSalutation, { userId, salutation: value || null })
    this.savingSalutation = false
    if (answer.success) {
      this.storedSalutation = value
      this.saved.set(userId, value || null)
      this.settled = value !== ''
      toastSuccess(t('crea.salutationSaved'))
    } else {
      // the server answers with a code: the wording belongs here
      toastError(t('crea.salutationSaveFailed'))
    }
    m.redraw()
  }

  private async copy() {
    try {
      await navigator.clipboard.writeText(this.response)
      toastSuccess(t('crea.copied'))
    } catch {
      toastError(t('crea.copyFailed'))
    }
  }

  // "Fertig" or Escape: the field closes, and the keyboard goes back to the button
  private closeRemark(card: RemarkCard) {
    closeRemark(card)
    m.redraw.sync()
    this.remarkButton?.focus()
  }

  view({ attrs: { onclose } }: Vnode<Attrs>) {
    return m(
      Modal,
      {
        size: 'lg',
        scrollable: true,
        onclose,
        title: m('span.d-flex.align-items-center.gap-2', [
          m('img', { src: creaLogo, alt: t('crea.title'), class: classes.creaTitleLogo }),
          ` ${t('crea.title')}`,
        ]),
        footer: this.footer(onclose),
      },
      [
        this.contribution.memo || this.isBatch() ? this.contributionBox() : null,
        this.loading
          ? m('.text-center.py-4', [
              m('span.spinner-border.me-2', { role: 'status' }),
              ` ${t(this.isBatch() && this.selected.size !== 1 ? 'crea.loadingPlural' : 'crea.loading')}`,
            ])
          : this.inactive
            ? m('.alert.alert-info.mb-0', t('crea.inactive'))
            : this.error
              ? m('.alert.alert-danger.mb-0', this.error)
              : this.evaluation
                ? this.assessment(this.evaluation)
                : null,
      ],
    )
  }

  private footer(onclose: () => void) {
    // not while a reply is rewritten: its answer would land in the new evaluation
    const busy = this.loading || this.rewriting
    const evaluateButton = (test: string, disabled: boolean, batch: boolean) =>
      m(
        'button.btn.btn-md.btn-primary',
        { type: 'button', 'data-test': test, disabled, onclick: () => this.evaluate(batch) },
        t('crea.evaluate'),
      )
    const remarkChanged =
      this.remarkJudged !== undefined &&
      this.remark?.entry.loaded === true &&
      this.remarkForCrea() !== this.remarkJudged
    return m('div', { class: classes.creaFooter }, [
      m('span', { class: classes.creaFooterSide }),
      m('button.btn.btn-md.btn-secondary', { type: 'button', onclick: onclose }, t('crea.close')),
      m(
        'span',
        { class: `${classes.creaFooterSide} ${classes.creaFooterSideRight}` },
        this.isBatch()
          ? evaluateButton('crea-evaluate-batch', busy || this.selected.size === 0, true)
          : this.awaiting || remarkChanged
            ? evaluateButton('crea-evaluate-single', busy, false)
            : null,
      ),
    ])
  }

  // the contribution at the top, from the row: visible before Crea answers
  private contributionBox() {
    const { contribution, remark } = this
    const name = this.userName()
    const tenure = contribution.user ? tenureKey(contribution.user.createdAt) : null
    const batch = this.isBatch()
    return m('.border.rounded.p-2.mb-3', [
      m('.d-flex.justify-content-between.align-items-baseline.mb-1', [
        // the remark's button behind the name: on a narrow phone the name breaks, it stays beside
        m('span.d-inline-flex.align-items-center.column-gap-1', [
          m('strong', [
            name || t(batch ? 'crea.contributions' : 'crea.contribution'),
            tenure
              ? m('small.text-muted.fw-normal', ` (${t(tenure.key, { count: tenure.count })}) `)
              : null,
          ]),
          remark
            ? remarkToggle(
                remark,
                name,
                this.remarkFieldId,
                () => (remark.open ? this.closeRemark(remark) : openRemark(remark)),
                ({ dom }: VnodeDOM) => {
                  this.remarkButton = dom as HTMLElement
                },
              )
            : null,
        ]),
        batch
          ? null
          : m(
              'span.text-muted.small.ms-3',
              contributionMeta(contribution, currentLocale(), t('crea.hoursUnit')),
            ),
      ]),
      remark
        ? remark.open
          ? m(RemarkEditor, {
              card: remark,
              name,
              fieldId: this.remarkFieldId,
              ondone: () => this.closeRemark(remark),
              plain: true,
            })
          : remarkLine(remark, true)
        : null,
      // Off at each opening: Crea reads the remark only where the moderator lets her.
      remark && this.keptRemark() !== null
        ? [
            m('.form-check.form-switch.mb-0', { 'data-test': 'crea-reads-remark' }, [
              m('input.form-check-input#crea-reads-remark', {
                type: 'checkbox',
                checked: this.readsRemark,
                onchange: (event: Event) => {
                  this.readsRemark = (event.target as HTMLInputElement).checked
                },
              }),
              m('label.form-check-label', { for: 'crea-reads-remark' }, t('crea.readsRemark')),
            ]),
            m(
              'p.mt-1.mb-0.text-muted.small',
              { 'data-test': 'crea-reads-remark-hint' },
              t('crea.readsRemarkHint'),
            ),
            m('hr', { class: classes.creaSectionRule }),
          ]
        : null,
      batch
        ? this.checklist()
        : m('p.mb-0.text-break', { class: classes.creaOriginal }, contribution.memo),
    ])
  }

  // Nothing runs until "Bewerten"; ticking is free either way.
  private checklist() {
    const sections = sectionsByResubmission(this.siblings, this.openedAt)
    const headings = { open: '', due: t('crea.resubmissionDue'), later: t('crea.resubmission') }
    return [
      m('.d-flex.align-items-baseline.gap-3.mb-2', [
        m('p.mb-0.text-muted.small.flex-grow-1', t('crea.selectHint')),
        m(
          'button.btn.btn-link.p-0.small.text-nowrap.crea-toggle-all',
          {
            type: 'button',
            // selecting all takes the groups put off with it: the default leaves them, not the hand
            onclick: () => {
              const all = this.selected.size === 0
              this.selected.clear()
              if (all) {
                for (const { items } of sections) {
                  for (const { id } of items) {
                    this.selected.add(id)
                  }
                }
              }
            },
          },
          t(this.selected.size ? 'crea.deselectAll' : 'crea.selectAll'),
        ),
      ]),
      sections.map(({ key, items }, index) =>
        m.fragment({ key }, [
          index > 0 ? m('hr', { class: classes.creaSectionRule }) : null,
          headings[key] ? m('p.crea-section-heading.mb-2.fw-bold.small', headings[key]) : null,
          items.map((c) =>
            m('.form-check.mb-2', { key: c.id }, [
              m('input.form-check-input', {
                id: `crea-pick-${c.id}`,
                type: 'checkbox',
                checked: this.selected.has(c.id),
                onchange: (event: Event) =>
                  (event.target as HTMLInputElement).checked
                    ? this.selected.add(c.id)
                    : this.selected.delete(c.id),
              }),
              m('label.form-check-label.d-block', { for: `crea-pick-${c.id}` }, [
                m(
                  'span.text-muted.small.d-block',
                  contributionMeta(c, currentLocale(), t('crea.hoursUnit')),
                ),
                m('span.text-break', { class: classes.creaOriginal }, c.memo),
              ]),
            ]),
          ),
        ]),
      ),
    ]
  }

  private assessment(result: CreaEvaluation) {
    const { userId } = this.contribution
    const flags = shownFlags(result.flags, this.settled)
    const verdict = result.overallVerdict
    const decisionButton = (
      decision: Verdict,
      tone: 'success' | 'warning' | 'danger',
      label: string,
    ) =>
      m(
        'button.btn.btn-sm',
        {
          type: 'button',
          class: this.chosen === decision ? `btn-${tone}` : `btn-outline-${tone}`,
          onclick: () => {
            this.chosen = decision
          },
        },
        label,
      )
    return m('div', { class: classes.palette }, [
      result.flags?.includes('stub_preview')
        ? m('.alert.alert-info', t('crea.previewBanner'))
        : null,
      m('p.mb-3', [
        m('strong', `${t('crea.verdict.label')}:`),
        m(
          'span.badge.ms-2',
          {
            class: `text-bg-${verdict === 'confirm' ? 'success' : verdict === 'inquire' ? 'warning' : 'secondary'}`,
          },
          verdict === 'confirm' || verdict === 'inquire' ? t(`crea.verdict.${verdict}`) : verdict,
        ),
      ]),
      m('p.mb-1', m('strong', t('crea.reasoning'))),
      m('p.mb-3.text-break', result.reasoning),
      flags.length
        ? m('.mb-3', [
            m('p.mb-1', m('strong.text-danger', t('crea.flags'))),
            m(
              'ul.mb-0',
              flags.map((flag) =>
                m(
                  'li.text-danger',
                  { key: flag },
                  flag === 'discrepancy_recomputed' || flag === 'anrede_unsicher'
                    ? t(`crea.flags_map.${flag}`)
                    : flag,
                ),
              ),
            ),
          ])
        : null,
      result.openPoints.length
        ? m('.mb-3', [
            m('p.mb-1', m('strong', t('crea.openPoints'))),
            m(
              'ul.mb-0',
              result.openPoints.map(({ question, options }) =>
                m('li', [
                  `${question} `,
                  options.length ? m('small.text-muted', ` (${options.join(' / ')}) `) : null,
                ]),
              ),
            ),
          ])
        : null,
      // Crea's recommendation preselected: following means leaving it, deviating costs a call
      m('.mb-3', [
        m('p.mb-1', m('strong', t('crea.deviation'))),
        m('.btn-group', { role: 'group' }, [
          decisionButton('confirm', 'success', t('crea.decision.confirm')),
          decisionButton('inquire', 'warning', t('crea.decision.inquire')),
          decisionButton('deny', 'danger', t('crea.decision.deny')),
        ]),
        this.chosen !== verdict
          ? m('.mt-2', [
              m('textarea.form-control.mb-1', {
                rows: 2,
                placeholder: t('crea.contextPlaceholder'),
                value: this.context,
                oninput: (event: Event) => {
                  this.context = (event.target as HTMLTextAreaElement).value
                },
              }),
              m('p.mb-2.text-muted.small', t('crea.contextLabel')),
              m(
                'button.btn.btn-sm.btn-primary',
                { type: 'button', disabled: this.rewriting, onclick: () => this.rewrite() },
                [
                  this.rewriting
                    ? m('span.spinner-border.spinner-border-sm.me-1', { role: 'status' })
                    : null,
                  ` ${t('crea.rewrite')}`,
                ],
              ),
            ])
          : null,
      ]),
      this.supplement
        ? m('.mb-3', [
            m('p.mb-1', m('strong', t('crea.supplement'))),
            m('input.form-control.form-control-sm', {
              type: 'text',
              value: this.supplement,
              oninput: (event: Event) =>
                this.typeSupplement((event.target as HTMLInputElement).value),
            }),
            m('p.mt-1.mb-0.text-muted.small', t('crea.supplementHint')),
          ])
        : null,
      m('.mb-3', [
        m('label.mb-1.d-block', { for: 'crea-salutation' }, m('strong', t('crea.salutation'))),
        m('.d-flex.align-items-start.gap-2', [
          m('input.form-control.form-control-sm#crea-salutation', {
            type: 'text',
            value: this.salutation,
            placeholder: this.defaultSalutation,
            maxlength: SALUTATION_MAX_LENGTH,
            oninput: (event: Event) =>
              this.follow(() => {
                this.salutation = (event.target as HTMLInputElement).value
              }),
          }),
          this.salutationChanged() && userId !== null
            ? m(
                'button.btn.btn-sm.btn-primary.flex-shrink-0',
                {
                  type: 'button',
                  disabled: this.savingSalutation,
                  onclick: () => this.saveSalutation(userId),
                },
                t('crea.salutationSave'),
              )
            : null,
        ]),
        m('p.mt-1.mb-0.text-muted.small', t('crea.salutationHint')),
      ]),
      m('p.mb-1', m('strong', t('crea.response'))),
      // half the rows on a phone, or the window grows far past its edge
      m('textarea.form-control.mb-2', {
        rows: isPhone() ? 8 : 16,
        value: this.response,
        oninput: (event: Event) => this.typeResponse((event.target as HTMLTextAreaElement).value),
        onkeydown: (event: KeyboardEvent) =>
          boldShortcut(event, (value) => this.typeResponse(value)),
      }),
      m('.d-flex.justify-content-between.align-items-start.gap-3', [
        m('p.mb-0.text-muted.small', t('crea.useHint')),
        m(
          'button.btn.btn-link.btn-sm.p-1.text-muted.flex-shrink-0',
          { type: 'button', title: t('crea.copy'), onclick: () => this.copy() },
          m.trust(copyIcon),
        ),
      ]),
      m('.mt-3', [
        m('p.mb-1', m('strong', t('crea.signature'))),
        m('textarea.form-control.mb-2', {
          rows: 2,
          placeholder: t('crea.signaturePlaceholder'),
          value: this.signature,
          oninput: (event: Event) =>
            this.follow(() => {
              this.signature = (event.target as HTMLTextAreaElement).value
              keepCreaSignature(this.signature)
            }),
        }),
        m('p.mt-1.mb-0.text-muted.small', t('crea.signatureHint')),
      ]),
      m('p.mt-3.mb-0.text-muted.small', t('crea.advisoryHint')),
    ])
  }

  private typeResponse(text: string) {
    this.response = text
    if (text) {
      keepCreaDraft(text, this.model)
    }
  }
}
