// AI-GENERATED — not an architecture reference
import { communityFigureSeries } from '@admin/graphql/communityFigureSeries.graphql'
import { communityFigures } from '@admin/graphql/communityFigures.graphql'
import { communityStatistics } from '@admin/graphql/communityStatistics'
import classes from '@admin/pages/Statistic.module.css'
import m, { type ClassComponent } from 'mithril'
import '@/components/bootstrap/table.css'
import { toastError } from '@/components/Toasts'
import {
  dayOf,
  type FigureSeries,
  type Figures,
  figureGroups,
  figuresAsText,
  isDay,
  type Totals,
  weekColumns,
  weekGroups,
} from '@/data/Figures.logic'
import { graphqlRequest } from '@/graphql/client'
import { d, t } from '@/i18n'

// The chosen day stays on this device: a setting of this page, not of the account.
const SINCE_STORAGE_KEY = 'admin.figures.since'
const SINCE_DEFAULT_DAYS = 28
const DAY_MS = 24 * 60 * 60 * 1000
// how long the button says it copied
const COPIED_MS = 2000

const storedDay = () => {
  try {
    const stored = localStorage.getItem(SINCE_STORAGE_KEY)
    return isDay(stored) ? stored : null
  } catch {
    return null
  }
}

type CopyState = 'COPIED' | 'BY_HAND' | null

/**
 * The figures of the community since a chosen day, the totals since the beginning, and the flows
 * by calendar week -- and the button that copies all of it for the review in the weekly mail.
 */
export class Statistic implements ClassComponent {
  private readonly today = dayOf(new Date())
  private sinceDay = storedDay() ?? dayOf(new Date(Date.now() - SINCE_DEFAULT_DAYS * DAY_MS))
  private figures: Figures | null = null
  private series: FigureSeries | null = null
  private totals: Totals | null = null
  // the totals answered or failed: the weeks wait for it, so that nothing pushes them down
  private totalsDone = false
  private copyState: CopyState = null
  private copyText: string | null = null
  private copyField?: HTMLTextAreaElement
  private copiedTimer?: ReturnType<typeof setTimeout>
  // Each press its own: an answer of the clipboard belongs to the press it came for, and to the
  // numbers of that moment -- new numbers and leaving the page end the press as well.
  private copyPress = 0

  oninit() {
    this.loadDay()
    // Their sums take the server seconds, so they come on their own, asked once. The account
    // counts of that answer are not shown: the group "accounts" counts without the members of
    // other communities.
    graphqlRequest<{ communityStatistics: Totals & { dynamicStatisticsFields: Totals } }>(
      communityStatistics,
    ).then((answer) => {
      if (answer.success) {
        const statistics = answer.value.communityStatistics
        this.totals = { ...statistics, ...statistics.dynamicStatisticsFields }
      } else {
        toastError(answer.error.message)
      }
      this.totalsDone = true
      this.numbersChanged()
    })
  }

  onremove() {
    this.endPress()
  }

  // The figures from the first moment of the chosen day where the admin sits, as the server takes
  // a moment. The weeks from its date at 00:00 UTC: the server counts weeks from Monday in UTC,
  // and the first moment of the day east of Greenwich lies on the evening before -- a Monday
  // chosen there would bring the week before along. An answer for a day chosen since is dropped.
  private loadDay() {
    const day = this.sinceDay
    graphqlRequest<{ communityFigures: Figures }>(communityFigures, {
      since: new Date(`${day}T00:00:00`).toISOString(),
    }).then((answer) => {
      if (day !== this.sinceDay) {
        return
      }
      if (!answer.success) {
        toastError(answer.error.message)
        return
      }
      this.figures = answer.value.communityFigures
      this.numbersChanged()
    })
    graphqlRequest<{ communityFigureSeries: FigureSeries }>(communityFigureSeries, {
      since: `${day}T00:00:00.000Z`,
    }).then((answer) => {
      if (day !== this.sinceDay) {
        return
      }
      if (!answer.success) {
        toastError(answer.error.message)
        return
      }
      this.series = answer.value.communityFigureSeries
      this.numbersChanged()
    })
  }

  // A field that holds no day asks nothing, and the figures of the last day stay.
  private chooseDay(day: string) {
    this.sinceDay = day
    if (!isDay(day)) {
      return
    }
    try {
      localStorage.setItem(SINCE_STORAGE_KEY, day)
    } catch {
      // private mode and the like: the day holds for this visit
    }
    this.loadDay()
  }

  // A block says what the tables said when it was made: new numbers take it away.
  private numbersChanged() {
    this.endPress()
    this.copyText = null
  }

  private endPress() {
    this.copyPress++
    clearTimeout(this.copiedTimer)
    this.copyState = null
  }

  private async copy(text: string) {
    this.endPress()
    const press = this.copyPress
    try {
      // no clipboard outside a secure context (http), and a browser may refuse it
      if (!navigator.clipboard?.writeText) {
        throw new Error('no clipboard')
      }
      await navigator.clipboard.writeText(text)
    } catch {
      if (press !== this.copyPress) {
        return
      }
      // the block to mark and copy by hand, marked already
      this.copyText = text
      this.copyState = 'BY_HAND'
      m.redraw.sync()
      this.copyField?.select()
      return
    }
    if (press !== this.copyPress) {
      return
    }
    this.copyText = null
    this.copyState = 'COPIED'
    m.redraw()
    this.copiedTimer = setTimeout(() => {
      this.copyState = null
      m.redraw()
    }, COPIED_MS)
  }

  view() {
    const { figures, series } = this
    // the day the numbers on the screen count from, from their own answer
    const sinceHeading = figures ? t('figures.col.since', { date: d(new Date(figures.since)) }) : ''
    const groups = figures ? figureGroups(figures, this.totals) : []
    const columns = weekColumns(series?.weeks ?? [])
    // the weeks once the table above stands with every group it will have
    const weeks =
      series && figures && this.totalsDone && columns.length > 0
        ? { columns, groups: weekGroups(series) }
        : null
    const copyStatus =
      this.copyState === 'COPIED'
        ? t('figures.copied')
        : this.copyState === 'BY_HAND'
          ? t('figures.copyByHand')
          : ''

    return m('.admin-statistic', [
      m('h2.h4.mb-3', t('figures.title')),
      m(
        '.b-form-group.mb-3',
        { role: 'group', class: classes.figuresSince },
        m('.row.d-flex.flex-wrap', [
          m('.col-auto', m('label.col-form-label', { for: 'figures-since' }, t('figures.since'))),
          m(
            '.col',
            m('input.form-control', {
              id: 'figures-since',
              type: 'date',
              max: this.today,
              value: this.sinceDay,
              'data-test': 'figures-since',
              oninput: (event: Event) => this.chooseDay((event.target as HTMLInputElement).value),
            }),
          ),
        ]),
      ),
      figures
        ? m('.figures-copy.mb-3', [
            m(
              'button.btn.btn-sm.btn-outline-secondary',
              {
                type: 'button',
                'data-test': 'figures-copy',
                onclick: () => this.copy(figuresAsText(sinceHeading, groups, weeks)),
              },
              t('figures.copy'),
            ),
            // said once, here: the button keeps its name, so a screen reader says it once
            m(
              'span.ms-2',
              {
                class: classes.figuresCopyStatus,
                role: 'status',
                'data-test': 'figures-copy-status',
              },
              copyStatus,
            ),
            this.copyText === null
              ? null
              : m('textarea.form-control.mt-2', {
                  class: classes.figuresCopyText,
                  readonly: true,
                  rows: 8,
                  'aria-label': t('figures.copy'),
                  value: this.copyText,
                  'data-test': 'figures-copy-text',
                  oncreate: ({ dom }: m.VnodeDOM) => {
                    this.copyField = dom as HTMLTextAreaElement
                  },
                }),
          ])
        : null,
      figures
        ? m(
            'table.table.b-table.b-table-stacked-lg.table-striped',
            { class: classes.figuresTable, 'data-test': 'figures' },
            [
              m(
                'thead',
                m('tr', [
                  m('th', { scope: 'col' }),
                  m('th.text-end', { scope: 'col' }, sinceHeading),
                  m('th.text-end', { scope: 'col' }, t('figures.col.week')),
                  m('th.text-end', { scope: 'col' }, t('figures.col.total')),
                ]),
              ),
              groups.map((group) =>
                m('tbody', { key: group.key }, [
                  m('tr.figures-group', m('th', { colspan: 4, scope: 'rowgroup' }, group.label)),
                  group.rows.map((row) =>
                    m('tr', { key: row.key, 'data-test': `figure-${row.key}` }, [
                      m('th.fw-normal', { scope: 'row' }, row.label),
                      [sinceHeading, t('figures.col.week'), t('figures.col.total')].map(
                        (heading, index) =>
                          m('td.text-end', { 'data-label': heading }, m('div', row.cells[index])),
                      ),
                    ]),
                  ),
                ]),
              ),
            ],
          )
        : null,
      weeks
        ? m('section.figures-weeks.mt-4', { 'data-test': 'figures-weeks' }, [
            m('h3#figures-weeks-heading.h5.mb-2', t('figures.weeks')),
            // Not stacked: on a narrow screen the weeks roll sideways under the labels, which
            // stand still. The region takes the focus, so that a keyboard can roll it as well.
            m(
              '.table-responsive',
              { role: 'region', 'aria-labelledby': 'figures-weeks-heading', tabindex: 0 },
              m('table.table.b-table.table-striped', { class: classes.figuresWeeksTable }, [
                m(
                  'thead',
                  m('tr', [
                    m('th', { scope: 'col', class: classes.figuresWeeksLabel }),
                    weeks.columns.map((week) =>
                      m(
                        'th.text-end.text-nowrap',
                        { key: week.day, scope: 'col', 'data-test': `week-${week.day}` },
                        [
                          `${week.date} `,
                          week.running
                            ? m('span.d-block.small.fw-normal', t('figures.weekCurrent'))
                            : null,
                        ],
                      ),
                    ),
                  ]),
                ),
                weeks.groups.map((group) =>
                  m('tbody', { key: group.key }, [
                    m('tr.figures-group', [
                      m('th', { scope: 'rowgroup', class: classes.figuresWeeksLabel }, group.label),
                      m('td', { colspan: weeks.columns.length }),
                    ]),
                    group.rows.map((row) =>
                      m('tr', { key: row.key, 'data-test': `week-figure-${row.key}` }, [
                        m(
                          'th.fw-normal',
                          { scope: 'row', class: classes.figuresWeeksLabel },
                          row.label,
                        ),
                        row.cells.map((cell) => m('td.text-end', cell)),
                      ]),
                    ),
                  ]),
                ),
              ]),
            ),
          ])
        : null,
    ])
  }
}
