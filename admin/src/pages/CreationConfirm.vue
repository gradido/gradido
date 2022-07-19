<template>
  <div class="creation-confirm">
    <div v-if="overlay" id="overlay" @dblclick="overlay = false">
      <overlay :item="item" @overlay-cancel="overlay = false" @confirm-creation="confirmCreation" />
    </div>
    <open-creations-table
      class="mt-4"
      :items="pendingCreations"
      :fields="fields"
      @remove-creation="removeCreation"
      @show-overlay="showOverlay"
    />
  </div>
</template>
<script>
import Overlay from '../components/Overlay.vue'
import OpenCreationsTable from '../components/Tables/OpenCreationsTable.vue'
import { listUnconfirmedContributions } from '../graphql/listUnconfirmedContributions'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { confirmContribution } from '../graphql/confirmContribution'

export default {
  name: 'CreationConfirm',
  components: {
    OpenCreationsTable,
    Overlay,
  },
  data() {
    return {
      pendingCreations: [],
      overlay: false,
      item: {},
    }
  },
  methods: {
    removeCreation(item) {
      this.$apollo
        .mutate({
          mutation: adminDeleteContribution,
          variables: {
            id: item.id,
          },
        })
        .then((result) => {
          this.updatePendingCreations(item.id)
          this.toastSuccess(this.$t('creation_form.toasted_delete'))
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    confirmCreation() {
      this.$apollo
        .mutate({
          mutation: confirmContribution,
          variables: {
            id: this.item.id,
          },
        })
        .then((result) => {
          this.overlay = false
          this.updatePendingCreations(this.item.id)
          this.toastSuccess(this.$t('creation_form.toasted_created'))
        })
        .catch((error) => {
          this.overlay = false
          this.toastError(error.message)
        })
    },
    getPendingCreations() {
      this.$apollo
        .query({
          query: listUnconfirmedContributions,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.$store.commit('resetOpenCreations')
          this.pendingCreations = result.data.listUnconfirmedContributions
          this.$store.commit('setOpenCreations', result.data.listUnconfirmedContributions.length)
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    updatePendingCreations(id) {
      this.pendingCreations = this.pendingCreations.filter((obj) => obj.id !== id)
      this.$store.commit('openCreationsMinus', 1)
    },
    showOverlay(item) {
      this.overlay = true
      this.item = item
    },
  },
  computed: {
    fields() {
      return [
        { key: 'bookmark', label: this.$t('delete') },
        { key: 'email', label: this.$t('e_mail') },
        { key: 'firstName', label: this.$t('firstname') },
        { key: 'lastName', label: this.$t('lastname') },
        {
          key: 'amount',
          label: this.$t('creation'),
          formatter: (value) => {
            return value + ' GDD'
          },
        },
        { key: 'memo', label: this.$t('text') },
        {
          key: 'date',
          label: this.$t('date'),
          formatter: (value) => {
            return this.$d(new Date(value), 'short')
          },
        },
        { key: 'moderator', label: this.$t('moderator') },
        { key: 'edit_creation', label: this.$t('edit') },
        { key: 'confirm', label: this.$t('save') },
      ]
    },
  },
  async created() {
    await this.getPendingCreations()
  },
}
</script>
<style>
#overlay {
  position: fixed;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding-left: 5%;
  background-color: rgba(12, 11, 11, 0.781);
  z-index: 1000000;
  cursor: pointer;
}
</style>
