import { adminOpenCreations } from '../graphql/adminOpenCreations'

export const creationMonths = {
  data() {
    return {
      creation: [1000, 1000, 1000],
      userId: 0,
    }
  },
  computed: {
    creationDates() {
      const now = new Date(Date.now())
      const dates = [now]
      for (let i = 1; i < 3; i++) {
        dates.push(new Date(now.getFullYear(), now.getMonth() - i, 1))
      }
      return dates.reverse()
    },
    creationDateObjects() {
      const result = []
      this.creationDates.forEach((date) => {
        result.push({
          short: this.$d(date, 'month'),
          long: this.$d(date, 'short'),
          year: this.$d(date, 'year'),
          date: this.$d(date, 'short', 'en'),
        })
      })
      return result
    },
    radioOptions() {
      return this.creationDateObjects.map((obj, idx) => {
        return {
          item: { ...obj, creation: this.creation[idx] },
          name: obj.short + (this.creation[idx] ? ' ' + this.creation[idx] + ' GDD' : ''),
        }
      })
    },
    creationLabel() {
      return this.creationDates.map((date) => this.$d(date, 'monthShort')).join(' | ')
    },
  },
  apollo: {
    OpenCreations: {
      query() {
        return adminOpenCreations
      },
      variables() {
        return {
          userId: this.userId,
        }
      },
      fetchPolicy: 'no-cache',
      update({ adminOpenCreations }) {
        this.creation = adminOpenCreations.map((obj) => obj.amount)
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
}
