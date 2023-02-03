<!-- eslint-disable @intlify/vue-i18n/no-dynamic-keys -->
<template>
  <div class="creation-confirm">
    <div>
      <b-tabs content-class="mt-3" fill>
        <b-tab active @click="listContributions('open')" data-test="open">
          <template #title>
            {{ $t('contributions.open') }}
            <b-badge v-if="$store.state.openCreations > 0" variant="danger">
              {{ $store.state.openCreations }}
            </b-badge>
          </template>
        </b-tab>
        <b-tab
          :title="$t('contributions.confirms')"
          @click="listContributions('confirmed')"
          data-test="confirmed"
        />
        <b-tab
          :title="$t('contributions.denied')"
          @click="listContributions('denied')"
          data-test="denied"
        />
        <b-tab
          :title="$t('contributions.deleted')"
          @click="listContributions('deleted')"
          data-test="deleted"
        />
        <b-tab :title="$t('contributions.all')" @click="listContributions('all')" data-test="all" />
      </b-tabs>
    </div>
    {{ contributionFilter }}
    <open-creations-table
      class="mt-4"
      :items="items"
      :fields="fields"
      :filterTab="filterTab"
      @show-overlay="showOverlay"
      @update-state="updateState"
      @update-contributions="$apollo.queries.AllContributions.refetch()"
    />

    <b-pagination
      pills
      size="lg"
      v-model="currentPage"
      :per-page="pageSize"
      :total-rows="rows"
      align="center"
      :hide-ellipsis="true"
    ></b-pagination>

    <div v-if="overlay" id="overlay" @dblclick="overlay = false">
      <overlay :item="item" @overlay-cancel="overlay = false">
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
          <b-button
            size="md"
            v-bind:variant="overlayIcon"
            class="m-3 text-right"
            @click="overlayEvent"
          >
            {{ $t(overlayBtnText) }}
          </b-button>
        </template>
      </overlay>
    </div>
  </div>
</template>
<script>
import Overlay from '../components/Overlay.vue'
import OpenCreationsTable from '../components/Tables/OpenCreationsTable.vue'
import { listAllContributions } from '../graphql/listAllContributions'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { confirmContribution } from '../graphql/confirmContribution'
import { denyContribution } from '../graphql/denyContribution'

export default {
  name: 'CreationConfirm',
  components: {
    OpenCreationsTable,
    Overlay,
  },
  data() {
    return {
      items: [],
      filterTab: 'open',
      statusFilter: ['IN_PROGRESS', 'PENDING'],
      overlay: false,
      item: {},
      variant: 'confirm',
      rows: 0,
      currentPage: 1,
      pageSize: 25,
    }
  },
  methods: {
    listContributions(filter) {
      this.filterTab = filter
      this.statusFilter = this.contributionFilter
      this.$apollo.queries.AllContributions.refetch()
    },
    deleteCreation() {
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
    denyCreation() {
      this.$apollo
        .mutate({
          mutation: denyContribution,
          variables: {
            id: this.item.id,
          },
        })
        .then((result) => {
          this.overlay = false
          this.updatePendingCreations(this.item.id)
          this.toastSuccess(this.$t('creation_form.toasted_denied'))
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
      this.items = this.items.filter((obj) => obj.id !== id)
      this.$store.commit('openCreationsMinus', 1)
    },
    showOverlay(item, variant) {
      this.overlay = true
      this.item = item
      this.variant = variant
    },
    updateState(id) {
      this.items.find((obj) => obj.id === id).messagesCount++
      this.items.find((obj) => obj.id === id).state = 'IN_PROGRESS'
    },
  },
  computed: {
    fields() {
      if (this.filterTab === 'open') {
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
          { key: 'memo', label: this.$t('text'), class: 'text-break' },
          {
            key: 'contributionDate',
            label: this.$t('created'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          { key: 'moderator', label: this.$t('moderator') },
          { key: 'editCreation', label: this.$t('edit') },
          { key: 'deny', label: this.$t('deny') },
          { key: 'confirm', label: this.$t('save') },
        ]
      }
      if (this.filterTab === 'all') {
        return [
          { key: 'state', label: 'state' },
          { key: 'firstName', label: this.$t('firstname') },
          { key: 'lastName', label: this.$t('lastname') },
          {
            key: 'amount',
            label: this.$t('creation'),
            formatter: (value) => {
              return value + ' GDD'
            },
          },
          { key: 'memo', label: this.$t('text'), class: 'text-break' },
          {
            key: 'contributionDate',
            label: this.$t('created'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          {
            key: 'createdAt',
            label: this.$t('createdAt'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          { key: 'chatCreation', label: this.$t('chat') },
        ]
      }
      if (this.filterTab === 'denied') {
        return [
          { key: 'reActive', label: 'reActive' },
          { key: 'firstName', label: this.$t('firstname') },
          { key: 'lastName', label: this.$t('lastname') },
          {
            key: 'amount',
            label: this.$t('creation'),
            formatter: (value) => {
              return value + ' GDD'
            },
          },
          { key: 'memo', label: this.$t('text'), class: 'text-break' },
          {
            key: 'contributionDate',
            label: this.$t('created'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          {
            key: 'createdAt',
            label: this.$t('createdAt'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          {
            key: 'deniedAt',
            label: this.$t('contributions.denied'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          { key: 'deniedBy', label: this.$t('mod') },
          { key: 'chatCreation', label: this.$t('chat') },
        ]
      }
      if (this.filterTab === 'confirmed') {
        return [
          { key: 'firstName', label: this.$t('firstname') },
          { key: 'lastName', label: this.$t('lastname') },
          {
            key: 'amount',
            label: this.$t('creation'),
            formatter: (value) => {
              return value + ' GDD'
            },
          },
          { key: 'memo', label: this.$t('text'), class: 'text-break' },
          {
            key: 'contributionDate',
            label: this.$t('created'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          {
            key: 'createdAt',
            label: this.$t('createdAt'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          {
            key: 'confirmedAt',
            label: this.$t('contributions.confirms'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          { key: 'confirmedBy', label: this.$t('mod') },
          { key: 'chatCreation', label: this.$t('chat') },
        ]
      }
      return []
    },
    contributionFilter() {
      if (this.filterTab === 'open') {
        return ['IN_PROGRESS', 'PENDING']
      }
      if (this.filterTab === 'all') {
        return ['IN_PROGRESS', 'PENDING', 'CONFIRMED', 'DENIED']
      }
      if (this.filterTab === 'denied') {
        return ['DENIED']
      }
      if (this.filterTab === 'confirmed') {
        return ['CONFIRMED']
      }
      if (this.filterTab === 'deleted') {
        return ['DELETED']
      }
      return ['IN_PROGRESS', 'PENDING']
    },
    overlayTitle() {
      return `overlay.${this.variant}.title`
    },
    overlayText() {
      return `overlay.${this.variant}.text`
    },
    overlayQuestion() {
      return `overlay.${this.variant}.question`
    },
    overlayBtnText() {
      return `overlay.${this.variant}.yes`
    },
    overlayEvent() {
      return this[`${this.variant}Creation`]
    },
    overlayIcon() {
      switch (this.variant) {
        case 'confirm':
          return 'success'
        case 'deny':
          return 'warning'
        case 'delete':
          return 'danger'
        default:
          return 'info'
      }
    },
  },
  apollo: {
    AllContributions: {
      query() {
        return listAllContributions
      },
      variables() {
        // may be at some point we need a pagination here
        return {
          currentPage: this.currentPage,
          pageSize: this.pageSize,
          statusFilter: this.statusFilter,
        }
      },
      update({ listAllContributions }) {
        this.rows = listAllContributions.contributionCount
        this.items = listAllContributions.contributionList
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
