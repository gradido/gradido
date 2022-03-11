export const toggleRowDetails = {
  data() {
    return {
      slotIndex: 0,
      openRow: null,
      creationUserData: {},
    }
  },
  methods: {
    rowToggleDetails(row, index) {
      if (this.openRow) {
        if (this.openRow.index === row.index) {
          if (index === this.slotIndex) {
            row.toggleDetails()
            this.openRow = null
          } else {
            this.slotIndex = index
          }
        } else {
          this.openRow.toggleDetails()
          row.toggleDetails()
          this.slotIndex = index
          this.openRow = row
          this.creationUserData = row.item
        }
      } else {
        row.toggleDetails()
        this.slotIndex = index
        this.openRow = row
        this.creationUserData = row.item
      }
    },
  },
}
