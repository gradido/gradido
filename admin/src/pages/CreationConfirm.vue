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
import { deletePendingCreation } from '../graphql/deletePendingCreation'

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
          label: this.$t('date'),
          formatter: (value) => {
            return this.$d(new Date(value), 'short')
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
      let index = 0
      const findArr = this.confirmResult.find((arr) => arr.id === e.id)
      switch (event) {
        case 'remove':
          this.$apollo
            .mutate({
              mutation: deletePendingCreation,
              variables: {
                id: findArr.id,
              },
            })
            .then((result) => {
              index = this.confirmResult.indexOf(findArr)
              this.confirmResult.splice(index, 1)
              this.$store.commit('openCreationsMinus', 1)
              this.$toasted.success('Pending Creation has been deleted')
            })
            .catch((error) => {
              this.$toasted.error(error.message)
            })
          break
        case 'confirmed':
          this.confirmResult.splice(index, 1)
          this.$store.commit('openCreationsMinus', 1)
          this.$toasted.success('Pending Creation has been deleted')
          break
        default:
          this.$toasted.error('Case ' + event + ' is not supported')
      }
    },
    getPendingCreations() {
      this.$apollo
        .query({
          query: getPendingCreations,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.$store.commit('resetOpenCreations')
          this.confirmResult = result.data.getPendingCreations
          this.$store.commit('setOpenCreations', result.data.getPendingCreations.length)
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
