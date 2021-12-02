<template>
  <div class="creation-confirm">
    <user-table
      class="mt-4"
      type="PageCreationConfirm"
      :itemsUser="confirmResult"
      :fieldsTable="fields"
      @remove-confirm-result="removeConfirmResult"
    />
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'
import { getPendingCreations } from '../graphql/getPendingCreations'

export default {
  name: 'CreationConfirm',
  components: {
    UserTable,
  },
  data() {
    return {
      showArrays: false,
      fields: [
        { key: 'bookmark', label: 'löschen' },
        { key: 'email', label: 'Email' },
        { key: 'firstName', label: 'Vorname' },
        { key: 'lastName', label: 'Nachname' },
        {
          key: 'amount',
          label: 'Schöpfung',
          formatter: (value) => {
            return value + ' GDD'
          },
        },
        { key: 'memo', label: 'Text' },
        {
          key: 'date',
          label: 'Datum',
          formatter: (value) => {
            return this.$moment(value).format('ll')
          },
        },
        { key: 'moderator', label: 'Moderator' },
        { key: 'edit_creation', label: 'ändern' },
        { key: 'confirm', label: 'speichern' },
      ],
      confirmResult: [],
    }
  },

  methods: {
    removeConfirmResult(e, event) {
      if (event === 'remove') {
        let index = 0
        let findArr = {}

        findArr = this.confirmResult.find((arr) => arr.id === e.id)

        index = this.confirmResult.indexOf(findArr)

        this.confirmResult.splice(index, 1)

        this.$store.commit('openCreationsMinus', 1)
      }
    },
    async getPendingCreations() {
      this.$apollo
        .query({
          query: getPendingCreations,
        })
        .then((result) => {
          this.confirmResult = result.data.getPendingCreations
          this.$store.commit('resetOpenCreations')
          this.$store.commit('openCreationsPlus', result.data.getPendingCreations.length)
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
  async created() {
    await this.getPendingCreations()
  },
}
</script>
