// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  creationGroups as creationGroupsQuery,
  suggestedCreationGroup as suggestedCreationGroupQuery,
} from '@/graphql/contributions.graphql'
import { creationGroupLabel } from '@/utils/creationGroupLabel'

type CreationGroup = { tag: string; name: string | null }

/**
 * The creation-group field, as the contribution form and the support form both have it. Options
 * come from the canonical list -- every group stays choosable, including quiet ones, otherwise a
 * dormant group could never be woken up --, "(no group)" first. Pre-filled with the member's own
 * last statement, derived in the backend, unless something is already chosen.
 *
 * `suggest` is false where nothing is to be pre-filled (a contribution being edited): then the
 * suggestion is not even asked for.
 */
export const useCreationGroupChoice = ({ initial = '', suggest = true } = {}) => {
  const { t } = useI18n()
  const { result: creationGroupsResult } = useQuery(creationGroupsQuery)
  // Asked of the server every time, never taken from the cache. Submitting swaps a form out for
  // its success screen, so coming back mounts a fresh one -- and a cached answer would be the one
  // from BEFORE the submission. That is what put the old group back after someone had just
  // switched to "no group". Note that cache-and-network would not do: it hands over the stale
  // value first, and by the time the real answer lands the field is filled, so the guard below
  // refuses to correct it.
  const { result: suggestedCreationGroupResult } = useQuery(
    suggestedCreationGroupQuery,
    {},
    { fetchPolicy: 'no-cache', enabled: suggest },
  )

  const selected = ref<string>(initial)

  const groups = computed<CreationGroup[]>(() => creationGroupsResult.value?.creationGroups ?? [])

  const options = computed(() => [
    { value: '', text: t('contribution.creationGroup.none') },
    ...groups.value.map((creationGroup) => ({
      value: creationGroup.tag,
      text: creationGroupLabel(creationGroup),
    })),
  ])

  /** How the chosen group is named; '' for "(no group)". */
  const selectedLabel = computed(() => {
    const group = groups.value.find((creationGroup) => creationGroup.tag === selected.value)
    return group ? creationGroupLabel(group) : ''
  })

  watch(
    () => suggestedCreationGroupResult.value?.suggestedCreationGroup?.tag ?? '',
    (suggestion: string) => {
      if (suggest && suggestion && !selected.value) {
        selected.value = suggestion
      }
    },
    { immediate: true },
  )

  return { selected, options, selectedLabel }
}
