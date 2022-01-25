export const creationMonths = {
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
  },
}
