<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="admin-overview">
    <h2 class="h4 mb-3">{{ t('figures.title') }}</h2>
    <p class="figures-today mb-2">
      <BLink v-if="creations" data-test="open-creations" to="/creation-confirm">
        {{ todayText }}
      </BLink>
    </p>
    <BFormGroup
      :label="t('figures.since')"
      label-for="figures-since"
      label-cols="auto"
      class="figures-since mb-3"
    >
      <BFormInput
        id="figures-since"
        v-model="sinceDay"
        type="date"
        :max="today"
        data-test="figures-since"
      />
    </BFormGroup>
    <BTableSimple v-if="figures" striped stacked="md" class="figures-table" data-test="figures">
      <BThead>
        <BTr>
          <BTh />
          <BTh class="text-end">{{ sinceHeading }}</BTh>
          <BTh class="text-end">{{ t('figures.col.week') }}</BTh>
          <BTh class="text-end">{{ t('figures.col.total') }}</BTh>
        </BTr>
      </BThead>
      <BTbody v-for="group in groups" :key="group.key">
        <BTr class="figures-group">
          <!-- Plain th: BTh sets a scope of its own ("col", or "colspan" with a colspan). -->
          <th colspan="4" scope="colgroup">{{ group.label }}</th>
        </BTr>
        <BTr v-for="row in group.rows" :key="row.key" :data-test="`figure-${row.key}`">
          <th scope="row" class="fw-normal">{{ row.label }}</th>
          <BTd class="text-end" :stacked-heading="sinceHeading">{{ shown(row.since) }}</BTd>
          <BTd class="text-end" :stacked-heading="t('figures.col.week')">
            {{ shown(row.week) }}
          </BTd>
          <BTd class="text-end" :stacked-heading="t('figures.col.total')">
            {{ shown(row.total) }}
          </BTd>
        </BTr>
      </BTbody>
    </BTableSimple>
  </div>
</template>
<script setup>
import { adminListContributionsCount } from '@/graphql/adminListContributions.graphql'
import { communityFigures } from '@/graphql/communityFigures.graphql'
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@vue/apollo-composable'
import {
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
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const store = useStore()
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
  store.commit('setOpenCreations', data?.adminListContributions.contributionCount)
})

onError((error) => {
  toastError(error.message)
})

const openCreations = computed(() => creations.value?.adminListContributions.contributionCount)
const todayText = computed(() => {
  if (!openCreations.value) return t('figures.todayNone')
  if (openCreations.value === 1) return t('figures.todayOne')
  return t('figures.today', { n: openCreations.value })
})

// The chosen day, as the date field holds it (YYYY-MM-DD). The last one stays on this device:
// a setting of this page, not of the account.
const SINCE_STORAGE_KEY = 'admin.figures.since'
const SINCE_DEFAULT_DAYS = 28
const DAY_MS = 24 * 60 * 60 * 1000

const isDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const dayOf = (date) =>
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

const today = dayOf(new Date())
const sinceDay = ref(storedDay() ?? dayOf(new Date(Date.now() - SINCE_DEFAULT_DAYS * DAY_MS)))

watch(sinceDay, (day) => {
  if (!isDay(day)) return
  try {
    localStorage.setItem(SINCE_STORAGE_KEY, day)
  } catch {
    // ignore storage failures (private mode etc.)
  }
})

// The first moment of the chosen day where the admin sits, as the server takes a moment. A field
// that holds no day asks nothing, and the figures of the last day stay.
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

const figures = computed(() => figuresResult.value?.communityFigures ?? null)

// The day the numbers on the screen count from, from their own answer: while a new day is
// asked, the heading stays with the numbers below it.
const sinceHeading = computed(() =>
  figures.value ? t('figures.col.since', { date: d(new Date(figures.value.since), 'short') }) : '',
)

// The figures of this page, in its groups and order. A row of the answer whose key is not here
// is left out -- a figure of a newer server, waiting for its label here -- and so is a group
// none of whose rows came.
const groups = computed(() => {
  const byKey = new Map((figures.value?.rows ?? []).map((row) => [row.key, row]))
  return [
    {
      key: 'accounts',
      label: t('figures.group.accounts'),
      rows: [
        ['accountsNew', t('figures.row.accountsNew')],
        ['accountsViaTableCode', t('figures.row.accountsViaTableCode')],
        ['accountsViaLink', t('figures.row.accountsViaLink')],
        ['accountsViaAddress', t('figures.row.accountsViaAddress')],
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
  ]
    .map((group) => ({
      ...group,
      rows: group.rows
        .filter(([key]) => byKey.has(key))
        .map(([key, label]) => ({ ...byKey.get(key), label })),
    }))
    .filter((group) => group.rows.length > 0)
})

// A column a figure does not have comes as null.
const shown = (value) => (value === null || value === undefined ? '–' : n(value))
</script>
<style scoped>
.figures-today {
  min-height: 1.5em;
}

.figures-since {
  max-width: 22rem;
}

.figures-table {
  width: auto;
}
</style>
