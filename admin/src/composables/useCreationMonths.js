import { ref, computed, watch } from 'vue'
import { adminOpenCreations } from '../graphql/adminOpenCreations'
import { useQuery } from '@vue/apollo-composable'

export default () => {
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
    const result = []
    creationDates.value.forEach((date) => {
      result.push({
        short: $d(date, 'month'),
        long: $d(date, 'short'),
        year: $d(date, 'year'),
        date: $d(date, 'short', 'en'),
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

  const creationLabel = () => {
    return creationDates.value.map((date) => $d(date, 'monthShort')).join(' | ')
  }

  const { result, error } = useQuery(adminOpenCreations, { userId }, { fetchPolicy: 'no-cache' })

  watch(result, (newResult) => {
    if (newResult && newResult.adminOpenCreations) {
      creation.value = newResult.adminOpenCreations.map((obj) => obj.amount)
    }
  })

  watch(error, (err) => {
    if (err) {
      toast.error(err.message)
    }
  })

  return {
    creation,
    userId,
    creationDates,
    creationDateObjects,
    radioOptions,
    creationLabel,
  }
}
