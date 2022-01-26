<template>
  <div class="creation-confirm">
    <user-table
      class="mt-4"
      type="PageCreationConfirm"
      :itemsUser="pendingCreations"
      :fieldsTable="fields"
      @remove-creation="removeCreation"
      @confirm-creation="confirmCreation"
    />
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'
import { getPendingCreations } from '../graphql/getPendingCreations'
import { deletePendingCreation } from '../graphql/deletePendingCreation'
import { confirmPendingCreation } from '../graphql/confirmPendingCreation'

export default {
  name: 'CreationConfirm',
  components: {
    UserTable,
  },
  data() {
    return {
      pendingCreations: [],
    }
  },
  methods: {
    removeCreation(item) {
      this.$apollo
        .mutate({
          mutation: deletePendingCreation,
          variables: {
            id: item.id,
          },
        })
        .then((result) => {
          this.updatePendingCreations(item.id)
          this.$toasted.success(this.$t('creation_form.toasted_delete'))
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    confirmCreation(item) {
      this.$apollo
        .mutate({
          mutation: confirmPendingCreation,
          variables: {
            id: item.id,
          },
        })
        .then((result) => {
          this.updatePendingCreations(item.id)
          this.$toasted.success(this.$t('creation_form.toasted_created'))
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    getPendingCreations() {
      this.$apollo
        .query({
          query: getPendingCreations,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.$store.commit('resetOpenCreations')
          this.pendingCreations = result.data.getPendingCreations
          this.$store.commit('setOpenCreations', result.data.getPendingCreations.length)
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
    updatePendingCreations(id) {
      this.pendingCreations = this.pendingCreations.filter((obj) => obj.id !== id)
      this.$store.commit('openCreationsMinus', 1)
    },
  },
  computed: {
    fields() {
      return [
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
      ]
    },
  },
  async created() {
    await this.getPendingCreations()
  },
}
</script>
