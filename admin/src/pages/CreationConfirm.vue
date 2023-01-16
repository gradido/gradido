<!-- eslint-disable @intlify/vue-i18n/no-dynamic-keys -->
<template>
  <div class="creation-confirm">
    <div v-if="overlay" id="overlay" @dblclick="overlay = false">
      <overlay :item="item">
        <template #title>
          {{ $t(overlayTitle) }}
        </template>
        <template #text>
          <p>{{ $t(overlayText) }}</p>
        </template>
        <template #question>
          <p>{{ $t(overlayQuestion) }}</p>
        </template>
        <template #submit-btn>
          <b-button size="md" variant="success" class="m-3 text-right" @click="overlayEvent">
            {{ $t(overlyBtnText) }}
          </b-button>
        </template>
      </overlay>
    </div>
    <open-creations-table
      class="mt-4"
      :items="pendingCreations"
      :fields="fields"
      @show-overlay="showOverlay"
      @update-state="updateState"
      @update-contributions="$apollo.queries.PendingContributions.refetch()"
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
      overlayTitle: '',
      overlayText: '',
      overlayQuestion: '',
      overlayEvent: '',
      overlyBtnText: '',
      item: {},
    }
  },
  methods: {
    removeCreation() {
      this.$apollo
        .mutate({
          mutation: adminDeleteContribution,
          variables: {
            id: this.item.id,
          },
        })
        .then((result) => {
          this.overlay = false
          this.updatePendingCreations(this.item.id)
          this.toastSuccess(this.$t('creation_form.toasted_delete'))
        })
        .catch((error) => {
          this.overlay = false
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
    updatePendingCreations(id) {
      this.pendingCreations = this.pendingCreations.filter((obj) => obj.id !== id)
      this.$store.commit('openCreationsMinus', 1)
    },
    showOverlay(item, variant) {
      this.overlay = true
      this.item = item

      switch (variant) {
        case 'confirm':
          this.overlayTitle = 'overlay.confirm.title'
          this.overlayText = 'overlay.confirm.text'
          this.overlayQuestion = 'overlay.confirm.question'
          this.overlyBtnText = 'overlay.confirm.yes'
          this.overlayEvent = this.confirmCreation
          break
        case 'delete':
          this.overlayTitle = 'overlay.delete.title'
          this.overlayText = 'overlay.delete.text'
          this.overlayQuestion = 'overlay.delete.question'
          this.overlyBtnText = 'overlay.delete.yes'
          this.overlayEvent = this.removeCreation
          break
        case 'reject':
          this.overlayTitle = 'overlay.reject.title'
          this.overlayText = 'overlay.reject.text'
          this.overlayQuestion = 'overlay.reject.question'
          this.overlyBtnText = 'overlay.reject.yes'
          this.overlayEvent = 'reject-creation'
          break
      }
    },
    updateState(id) {
      this.pendingCreations.find((obj) => obj.id === id).messagesCount++
      this.pendingCreations.find((obj) => obj.id === id).state = 'IN_PROGRESS'
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
        { key: 'editCreation', label: this.$t('edit') },
        { key: 'confirm', label: this.$t('save') },
      ]
    },
  },
  apollo: {
    PendingContributions: {
      query() {
        return listUnconfirmedContributions
      },
      variables() {
        // may be at some point we need a pagination here
        return {}
      },
      update({ listUnconfirmedContributions }) {
        this.$store.commit('resetOpenCreations')
        this.pendingCreations = listUnconfirmedContributions
        this.$store.commit('setOpenCreations', listUnconfirmedContributions.length)
      },
      error({ message }) {
        this.toastError(message)
      },
    },
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
