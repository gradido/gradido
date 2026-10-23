// AI-GENERATED — not an architecture reference
import { useQuery } from '@vue/apollo-composable'
// @ts-expect-error -- Bootstrap ships no types for its source modules
import toast from 'bootstrap/js/src/toast'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminOpenCreations } from '../graphql/adminOpenCreations'

// One month a creation can be booked into, as the forms show it.
type CreationMonth = { short: string; long: string; year: string; date: string }

type OpenCreation = { amount: number }

export const useCreationMonths = () => {
  const { d } = useI18n()

  const creation = ref([1000, 1000, 1000])
  const userId = ref(0)

  const creationDates = computed(() => {
    const now = new Date(Date.now())
    const dates = [now]
    for (let i = 1; i < 3; i++) {
      dates.push(new Date(now.getFullYear(), now.getMonth() - i, 1))
    }
    return dates.reverse()
  })

  const creationDateObjects = computed(() => {
    const result: CreationMonth[] = []
    creationDates.value.forEach((date) => {
      result.push({
        short: d(date, 'month'),
        long: d(date, 'long'),
        year: d(date, 'year'),
        date: d(date, 'short', 'en'),
      })
    })
    return result
  })

  const radioOptions = () => {
    return creationDateObjects.value.map((obj, idx) => {
      return {
        item: { ...obj, creation: creation.value[idx] },
        name: obj.short + (creation.value[idx] ? ' ' + creation.value[idx] + ' GDD' : ''),
      }
    })
  }

  // The three months a member can still be credited for, by their short names, in the order of
  // the amounts the member search delivers (`creation`): the head of its column at the desk, a
  // line of the member's card on a phone.
  const creationMonthShorts = () => creationDates.value.map((date) => d(date, 'monthShort'))

  const creationLabel = () => {
    return creationMonthShorts().join(' | ')
  }

  const { result, error } = useQuery(adminOpenCreations, { userId }, { fetchPolicy: 'no-cache' })

  watch(result, (newResult) => {
    if (newResult && newResult.adminOpenCreations) {
      creation.value = newResult.adminOpenCreations.map((obj: OpenCreation) => obj.amount)
    }
  })

  watch(error, (err) => {
    if (err) {
      // ⚠️ Bootstrap's Toast is a class with no static `error`: this throws a TypeError
      // instead of showing the message. Kept as it was.
      toast.error(err.message)
    }
  })

  return {
    creation,
    userId,
    creationDates,
    creationDateObjects,
    radioOptions,
    creationMonthShorts,
    creationLabel,
  }
}
