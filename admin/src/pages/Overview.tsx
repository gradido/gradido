// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import {
  BButton,
  BFormGroup,
  BFormInput,
  BLink,
  BTableSimple,
  BTbody,
  BTd,
  BTh,
  BThead,
  BTr,
} from 'bootstrap-vue-next'
import { computed, defineComponent, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { communityFigureSeries } from '@/graphql/communityFigureSeries.graphql'
import { communityFigures } from '@/graphql/communityFigures.graphql'
import { communityStatistics } from '@/graphql/communityStatistics'
import { useAdminStore } from '@/store/useAdminStore'
import classes from './Overview.module.css'

type FigureRow = {
  key: string
  since: number | null
  week: number | null
  total: number | null
}

type SeriesRow = { key: string; counts: (number | null)[] }

type ShownRow = { key: string; label: string; cells: string[] }
type ShownGroup = { key: string; label: string; rows: ShownRow[] }

// The chosen day, as the date field holds it (YYYY-MM-DD). The last one stays on this device:
// a setting of this page, not of the account.
const SINCE_STORAGE_KEY = 'admin.figures.since'
const SINCE_DEFAULT_DAYS = 28
const DAY_MS = 24 * 60 * 60 * 1000

const isDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const dayOf = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

const storedDay = () => {
  try {
    const stored = localStorage.getItem(SINCE_STORAGE_KEY)
    return isDay(stored) ? stored : null
  } catch {
    return null
  }
}

// The copy button: the tables as plain text, for the review in the weekly mail -- a title with
// today's date, the heading of the columns, then each group and each row in the table's order;
// below, once they are there, the weeks: their Mondays, then the same groups by week.
const COPIED_MS = 2000

export const Overview = defineComponent({
  name: 'Overview',
  setup() {
    const store = useAdminStore()
    const { t, d, n } = useI18n()
    const { toastError } = useAppToast()

    // Today's open creations -- the query that also fills the badge in the menu (NavBar), so it
    // stays here with its commit.
    const {
      result: creations,
      onResult,
      onError,
    } = useQuery(adminListContributionsCount, {
      filter: {
        statusFilter: ['IN_PROGRESS', 'PENDING'],
        hideResubmission: true,
      },
    })

    onResult(({ data }) => {
      store.setOpenCreations(data?.adminListContributions.contributionCount)
    })

    onError((error) => {
      toastError(error.message)
    })

    const openCreations = computed<number | undefined>(
      () => creations.value?.adminListContributions.contributionCount,
    )
    const todayText = computed(() => {
      if (!openCreations.value) {
        return t('figures.todayNone')
      }
      if (openCreations.value === 1) {
        return t('figures.todayOne')
      }
      return t('figures.today', { n: openCreations.value })
    })

    const today = dayOf(new Date())
    const sinceDay = ref(storedDay() ?? dayOf(new Date(Date.now() - SINCE_DEFAULT_DAYS * DAY_MS)))

    watch(sinceDay, (day) => {
      if (!isDay(day)) {
        return
      }
      try {
        localStorage.setItem(SINCE_STORAGE_KEY, day)
      } catch {
        // ignore storage failures (private mode etc.)
      }
    })

    // The first moment of the chosen day where the admin sits, as the server takes a moment. A
    // field that holds no day asks nothing, and the figures of the last day stay.
    const since = computed(() =>
      isDay(sinceDay.value) ? new Date(`${sinceDay.value}T00:00:00`).toISOString() : null,
    )

    const { result: figuresResult, onError: onFiguresError } = useQuery(
      communityFigures,
      () => ({ since: since.value }),
      () => ({ enabled: since.value !== null, fetchPolicy: 'cache-and-network' }),
    )

    onFiguresError((error) => {
      toastError(error.message)
    })

    const figures = computed<{ since: string; rows: FigureRow[] } | null>(
      () => figuresResult.value?.communityFigures ?? null,
    )

    // The totals since the beginning, from the query the page /statistic had: its sums take the
    // server seconds, so they come on their own and their group stands once they are there. Asked
    // once a session, as they were there; an error here leaves the other groups alone. The account
    // counts of that query are not shown: the group "Accounts" counts them without the rows the
    // federation keeps for members of other communities.
    const {
      result: statisticsResult,
      loading: statisticsLoading,
      onError: onStatisticsError,
    } = useQuery(communityStatistics)

    onStatisticsError((error) => {
      toastError(error.message)
    })

    const totals = computed<Record<string, unknown> | null>(() => {
      const statistics = statisticsResult.value?.communityStatistics
      return statistics ? { ...statistics, ...statistics.dynamicStatisticsFields } : null
    })

    // The flows by calendar week, for the second table: asked for the chosen day by its date, at
    // 00:00 UTC. The server counts weeks from Monday to Sunday in UTC and begins with the week the
    // moment it gets lies in -- and the first moment of the day where the admin sits lies on the
    // evening before in UTC east of Greenwich: a Monday chosen there would bring the week before
    // it along. An error here leaves the table above standing.
    const seriesSince = computed(() =>
      isDay(sinceDay.value) ? `${sinceDay.value}T00:00:00.000Z` : null,
    )

    const { result: seriesResult, onError: onSeriesError } = useQuery(
      communityFigureSeries,
      () => ({ since: seriesSince.value }),
      () => ({ enabled: seriesSince.value !== null, fetchPolicy: 'cache-and-network' }),
    )

    onSeriesError((error) => {
      toastError(error.message)
    })

    const series = computed<{ weeks: string[]; rows: SeriesRow[] } | null>(
      () => seriesResult.value?.communityFigureSeries ?? null,
    )

    // The day the numbers on the screen count from, from their own answer: while a new day is
    // asked, the heading stays with the numbers below it.
    const sinceHeading = computed(() =>
      figures.value
        ? t('figures.col.since', { date: d(new Date(figures.value.since), 'short') })
        : '',
    )

    // A column a figure does not have comes as null.
    const shown = (value: unknown) =>
      value === null || value === undefined ? '–' : n(value as number)
    // The sums of the totals come as GradidoUnit, a decimal string: two places, as /statistic had.
    const shownGdd = (value: unknown) =>
      value === null || value === undefined ? '–' : n(Number(value), 'decimal')

    // The groups of the page and the rows of each -- [key, label] -- in its order, for the table
    // and its weeks alike.
    const figureGroups = computed<{ key: string; label: string; rows: [string, string][] }[]>(
      () => [
        {
          key: 'accounts',
          label: t('figures.group.accounts'),
          rows: [
            ['accountsNew', t('figures.row.accountsNew')],
            ['accountsViaTableCode', t('figures.row.accountsViaTableCode')],
            ['accountsViaLink', t('figures.row.accountsViaLink')],
            ['accountsViaAddress', t('figures.row.accountsViaAddress')],
            ['accountsViaEvent', t('figures.row.accountsViaEvent')],
            ['hostsWithGuest', t('figures.row.hostsWithGuest')],
            ['codesShown', t('figures.row.codesShown')],
            ['returners', t('figures.row.returners')],
            ['activeAccounts', t('figures.row.activeAccounts')],
            ['accountsDeleted', t('figures.row.accountsDeleted')],
            ['accountsTotal', t('figures.row.accountsTotal')],
          ],
        },
        {
          key: 'firstCreation',
          label: t('figures.group.firstCreation'),
          rows: [
            ['firstCreationsDone', t('figures.row.firstCreationsDone')],
            ['firstCreationsSkipped', t('figures.row.firstCreationsSkipped')],
            ['firstCreationsReview', t('figures.row.firstCreationsReview')],
          ],
        },
        {
          key: 'thanks',
          label: t('figures.group.thanks'),
          rows: [
            ['transfersSent', t('figures.row.transfersSent')],
            ['gddSent', t('figures.row.gddSent')],
            ['creationsBooked', t('figures.row.creationsBooked')],
            ['gddCreated', t('figures.row.gddCreated')],
          ],
        },
        {
          key: 'map',
          label: t('figures.group.map'),
          rows: [
            ['homesSet', t('figures.row.homesSet')],
            ['findableOnMap', t('figures.row.findableOnMap')],
            ['entriesInterest', t('figures.row.entriesInterest')],
            ['entriesOffer', t('figures.row.entriesOffer')],
            ['entriesNeed', t('figures.row.entriesNeed')],
            ['entriesActive', t('figures.row.entriesActive')],
            ['membersWithEntry', t('figures.row.membersWithEntry')],
            ['membersOnMap', t('figures.row.membersOnMap')],
          ],
        },
        {
          key: 'conversations',
          label: t('figures.group.conversations'),
          rows: [
            ['conversationsNew', t('figures.row.conversationsNew')],
            ['groupsNew', t('figures.row.groupsNew')],
            ['hellosFromMap', t('figures.row.hellosFromMap')],
            ['videoRoomsCreated', t('figures.row.videoRoomsCreated')],
          ],
        },
      ],
    )

    // The figures of this page, in its groups and order, each row as the table shows it -- the
    // label and its three cells -- for the table and for the block the copy button makes of it
    // alike. A row of the answer whose key is not here is left out -- a figure of a newer server,
    // waiting for its label here -- and so is a group none of whose rows came.
    const groups = computed<ShownGroup[]>(() => {
      const byKey = new Map((figures.value?.rows ?? []).map((row) => [row.key, row]))
      const ofFigures = (rows: [string, string][]) =>
        rows
          .filter(([key]) => byKey.has(key))
          .map(([key, label]) => {
            const { since, week, total } = byKey.get(key) as FigureRow
            return { key, label, cells: [since, week, total].map(shown) }
          })
      // The totals stand in the column "total" only: they have no day to count from.
      const ofTotals = (rows: [string, string, (value: unknown) => string][]) =>
        totals.value
          ? rows.map(([key, label, format]) => ({
              key,
              label,
              cells: ['–', '–', format((totals.value as Record<string, unknown>)[key])],
            }))
          : []
      return [
        ...figureGroups.value.map((group) => ({ ...group, rows: ofFigures(group.rows) })),
        {
          key: 'totals',
          label: t('figures.group.totals'),
          rows: ofTotals([
            ['totalGradidoCreated', t('figures.row.totalGradidoCreated'), shownGdd],
            ['totalGradidoDecayed', t('figures.row.totalGradidoDecayed'), shownGdd],
            ['totalGradidoAvailable', t('figures.row.totalGradidoAvailable'), shownGdd],
            ['totalGradidoUnbookedDecayed', t('figures.row.totalGradidoUnbookedDecayed'), shownGdd],
            ['activeUsers', t('figures.row.activeUsers'), shown],
          ]),
        },
      ].filter((group) => group.rows.length > 0)
    })

    // The weeks as the second table heads them: each Monday on the day it names wherever the admin
    // sits -- the server gives it as 00:00 UTC, which west of Greenwich is still the Sunday before.
    // The last week is the running one: the server counts up to it.
    const weekColumns = computed(() => {
      const weeks = series.value?.weeks ?? []
      return weeks.map((week, index) => {
        const day = week.slice(0, 10)
        return {
          day,
          date: d(new Date(`${day}T12:00:00`), 'short'),
          running: index === weeks.length - 1,
        }
      })
    })

    // The weeks stand below everything that comes later: they are shown once the table above
    // stands with every group it will have -- its figures there, the totals answered or failed --,
    // so that nothing arriving afterwards pushes them down while somebody reads or rolls them.
    const weeksShown = computed(
      () => figures.value !== null && !statisticsLoading.value && weekColumns.value.length > 0,
    )

    // The groups of the page by week: the rows the answer has, each with a number for every week,
    // in the groups and order of the table. The active accounts of the table count thirty days; by
    // week they are the accounts with a sign-in that week, and their label says so.
    const weekGroups = computed<ShownGroup[]>(() => {
      const countsOf = new Map((series.value?.rows ?? []).map((row) => [row.key, row.counts]))
      return figureGroups.value
        .map(({ key, label, rows }) => ({
          key,
          label,
          rows: rows
            .filter(([rowKey]) => countsOf.has(rowKey))
            .map(([rowKey, rowLabel]) => ({
              key: rowKey,
              label: rowKey === 'activeAccounts' ? t('figures.row.activeAccountsWeekly') : rowLabel,
              cells: (countsOf.get(rowKey) as (number | null)[]).map(shown),
            })),
        }))
        .filter((group) => group.rows.length > 0)
    })

    // What the last press came to: COPIED for a moment, BY_HAND while the block is shown to copy.
    const copyState = ref<'COPIED' | 'BY_HAND' | null>(null)
    const copyText = ref<string | null>(null)
    const copyField = ref<HTMLTextAreaElement | null>(null)
    let copiedTimer: ReturnType<typeof setTimeout> | undefined
    // Each press its own: an answer of the clipboard belongs to the press it came for, and to the
    // numbers of that moment -- new numbers and leaving the page end the press as well.
    let copyPress = 0

    const copyStatus = computed(() => {
      if (copyState.value === 'COPIED') {
        return t('figures.copied')
      }
      if (copyState.value === 'BY_HAND') {
        return t('figures.copyByHand')
      }
      return ''
    })

    // The groups of a table as lines of text: a blank line, the group's label, then its rows.
    const groupsAsLines = (groupsOfTable: ShownGroup[]) =>
      groupsOfTable.flatMap((group) => [
        '',
        group.label,
        ...group.rows.map((row) => `${row.label}: ${row.cells.join(' · ')}`),
      ])

    const figuresAsText = () => {
      const lines = [
        `${t('figures.title')} · ${d(new Date(), 'short')}`,
        [sinceHeading.value, t('figures.col.week'), t('figures.col.total')].join(' · '),
        ...groupsAsLines(groups.value),
      ]
      if (weeksShown.value) {
        lines.push(
          '',
          t('figures.weeks'),
          weekColumns.value
            .map((week) =>
              week.running ? `${week.date} (${t('figures.weekCurrent')})` : week.date,
            )
            .join(' · '),
          ...groupsAsLines(weekGroups.value),
        )
      }
      return lines.join('\n')
    }

    const endPress = () => {
      copyPress++
      clearTimeout(copiedTimer)
      copyState.value = null
    }

    const copyFigures = async () => {
      endPress()
      const press = copyPress
      const text = figuresAsText()
      try {
        // No clipboard outside a secure context (http), and a browser may refuse it.
        if (!navigator.clipboard?.writeText) {
          throw new Error('no clipboard')
        }
        await navigator.clipboard.writeText(text)
      } catch {
        if (press !== copyPress) {
          return
        }
        copyText.value = text
        copyState.value = 'BY_HAND'
        await nextTick()
        copyField.value?.select()
        return
      }
      if (press !== copyPress) {
        return
      }
      copyText.value = null
      copyState.value = 'COPIED'
      copiedTimer = setTimeout(() => {
        copyState.value = null
      }, COPIED_MS)
    }

    // A block -- shown, or still on its way to the clipboard -- says what the tables said when it
    // was made: new numbers take it away, new weeks too, or weeks that show up, and the button
    // makes a fresh one.
    watch([figures, totals, series, weeksShown], () => {
      endPress()
      copyText.value = null
    })

    onBeforeUnmount(endPress)

    return () => (
      <div class='admin-overview'>
        <h2 class='h4 mb-3'>{t('figures.title')}</h2>
        <p class={[classes.figuresToday, 'mb-2']}>
          {creations.value ? (
            <BLink data-test='open-creations' to='/creation-confirm'>
              {todayText.value}
            </BLink>
          ) : null}
        </p>
        <BFormGroup
          label={t('figures.since')}
          labelFor='figures-since'
          labelCols='auto'
          class={[classes.figuresSince, 'mb-3']}
        >
          <BFormInput
            id='figures-since'
            v-model={sinceDay.value}
            type='date'
            max={today}
            data-test='figures-since'
          />
        </BFormGroup>
        {figures.value ? (
          <div class='figures-copy mb-3'>
            <BButton
              variant='outline-secondary'
              size='sm'
              data-test='figures-copy'
              onClick={copyFigures}
            >
              {t('figures.copy')}
            </BButton>
            {/* Said once, here: the button keeps its name, so a screen reader does not say it
                twice. */}
            <span
              class={[classes.figuresCopyStatus, 'ms-2']}
              role='status'
              data-test='figures-copy-status'
            >
              {copyStatus.value}
            </span>
            {/* Where the clipboard cannot be reached, the block to mark and copy by hand. */}
            {copyText.value !== null ? (
              <textarea
                ref={copyField}
                class={['form-control', classes.figuresCopyText, 'mt-2']}
                readonly
                rows={8}
                aria-label={t('figures.copy')}
                value={copyText.value}
                data-test='figures-copy-text'
              />
            ) : null}
          </div>
        ) : null}
        {figures.value ? (
          <BTableSimple striped stacked='lg' class={classes.figuresTable} data-test='figures'>
            <BThead>
              <BTr>
                <BTh />
                <BTh class='text-end'>{sinceHeading.value}</BTh>
                <BTh class='text-end'>{t('figures.col.week')}</BTh>
                <BTh class='text-end'>{t('figures.col.total')}</BTh>
              </BTr>
            </BThead>
            {groups.value.map((group) => (
              <BTbody key={group.key}>
                <BTr class='figures-group'>
                  {/* Plain th: BTh sets a scope of its own ("col", or "colspan" with a colspan). */}
                  <th colspan={4} scope='rowgroup'>
                    {group.label}
                  </th>
                </BTr>
                {group.rows.map((row) => (
                  <BTr key={row.key} data-test={`figure-${row.key}`}>
                    <th scope='row' class='fw-normal'>
                      {row.label}
                    </th>
                    <BTd class='text-end' stackedHeading={sinceHeading.value}>
                      {row.cells[0]}
                    </BTd>
                    <BTd class='text-end' stackedHeading={t('figures.col.week')}>
                      {row.cells[1]}
                    </BTd>
                    <BTd class='text-end' stackedHeading={t('figures.col.total')}>
                      {row.cells[2]}
                    </BTd>
                  </BTr>
                ))}
              </BTbody>
            ))}
          </BTableSimple>
        ) : null}
        {weeksShown.value ? (
          <section class='figures-weeks mt-4' data-test='figures-weeks'>
            <h3 id='figures-weeks-heading' class='h5 mb-2'>
              {t('figures.weeks')}
            </h3>
            {/* Not stacked: on a narrow screen the weeks roll sideways under the labels, which
                stand still. The region takes the focus, so that the keyboard can roll it as well. */}
            <div
              class='table-responsive'
              role='region'
              aria-labelledby='figures-weeks-heading'
              tabindex='0'
            >
              <BTableSimple striped class={classes.figuresWeeksTable}>
                <BThead>
                  <BTr>
                    <BTh class={classes.figuresWeeksLabel} />
                    {weekColumns.value.map((week) => (
                      <BTh
                        key={week.day}
                        class='text-end text-nowrap'
                        data-test={`week-${week.day}`}
                      >
                        {/* The template kept a space after the date, before its mark. */}
                        {week.date}{' '}
                        {week.running ? (
                          <span class='d-block small fw-normal'>{t('figures.weekCurrent')}</span>
                        ) : null}
                      </BTh>
                    ))}
                  </BTr>
                </BThead>
                {weekGroups.value.map((group) => (
                  <BTbody key={group.key}>
                    <BTr class='figures-group'>
                      <th scope='rowgroup' class={classes.figuresWeeksLabel}>
                        {group.label}
                      </th>
                      <td colspan={weekColumns.value.length} />
                    </BTr>
                    {group.rows.map((row) => (
                      <BTr key={row.key} data-test={`week-figure-${row.key}`}>
                        <th scope='row' class={[classes.figuresWeeksLabel, 'fw-normal']}>
                          {row.label}
                        </th>
                        {row.cells.map((cell, index) => (
                          <BTd key={index} class='text-end'>
                            {cell}
                          </BTd>
                        ))}
                      </BTr>
                    ))}
                  </BTbody>
                ))}
              </BTableSimple>
            </div>
          </section>
        ) : null}
      </div>
    )
  },
})
