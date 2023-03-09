<!-- eslint-disable @intlify/vue-i18n/no-dynamic-keys -->
<template>
  <div class="creation-confirm">
    <div>
      <b-tabs v-model="tabIndex" content-class="mt-3" fill>
        <b-tab active :title-link-attributes="{ 'data-test': 'open' }">
          <template #title>
            <b-icon icon="bell-fill" variant="primary"></b-icon>
            {{ $t('contributions.open') }}
            <b-badge v-if="$store.state.openCreations > 0" variant="danger">
              {{ $store.state.openCreations }}
            </b-badge>
          </template>
        </b-tab>
        <b-tab :title-link-attributes="{ 'data-test': 'confirmed' }">
          <template #title>
            <b-icon icon="check" variant="success"></b-icon>
            {{ $t('contributions.confirms') }}
          </template>
        </b-tab>
        <b-tab :title-link-attributes="{ 'data-test': 'denied' }">
          <template #title>
            <b-icon icon="x-circle" variant="warning"></b-icon>
            {{ $t('contributions.denied') }}
          </template>
        </b-tab>
        <b-tab :title-link-attributes="{ 'data-test': 'deleted' }">
          <template #title>
            <b-icon icon="trash" variant="danger"></b-icon>
            {{ $t('contributions.deleted') }}
          </template>
        </b-tab>
        <b-tab :title-link-attributes="{ 'data-test': 'all' }">
          <template #title>
            <b-icon icon="list"></b-icon>
            {{ $t('contributions.all') }}
          </template>
        </b-tab>
      </b-tabs>
    </div>
    <open-creations-table
      class="mt-4"
      :items="items"
      :fields="fields"
      @show-overlay="showOverlay"
      @update-state="updateStatus"
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
import Overlay from '../components/Overlay'
import OpenCreationsTable from '../components/Tables/OpenCreationsTable'
import { adminListAllContributions } from '../graphql/adminListAllContributions'
import { adminDeleteContribution } from '../graphql/adminDeleteContribution'
import { confirmContribution } from '../graphql/confirmContribution'
import { denyContribution } from '../graphql/denyContribution'

const FILTER_TAB_MAP = [
  ['IN_PROGRESS', 'PENDING'],
  ['CONFIRMED'],
  ['DENIED'],
  ['DELETED'],
  ['IN_PROGRESS', 'PENDING', 'CONFIRMED', 'DENIED', 'DELETED'],
]

export default {
  name: 'CreationConfirm',
  components: {
    OpenCreationsTable,
    Overlay,
  },
  data() {
    return {
      tabIndex: 0,
      items: [],
      overlay: false,
      item: {},
      variant: 'confirm',
      rows: 0,
      currentPage: 1,
      pageSize: 25,
    }
  },
  methods: {
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
    updateStatus(id) {
      this.items.find((obj) => obj.id === id).messagesCount++
      this.items.find((obj) => obj.id === id).state = 'IN_PROGRESS'
    },
  },
  computed: {
    fields() {
      return [
        [
          // open contributions
          { key: 'bookmark', label: this.$t('delete') },
          { key: 'deny', label: this.$t('deny') },
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
          { key: 'editCreation', label: this.$t('chat') },
          { key: 'confirm', label: this.$t('save') },
        ],
        [
          // confirmed contributions
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
          { key: 'chatCreation', label: this.$t('chat') },
        ],
        [
          // denied contributions
          { key: 'reopen', label: this.$t('reopen') },
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
          { key: 'deniedBy', label: this.$t('moderator') },
          { key: 'chatCreation', label: this.$t('chat') },
        ],
        [
          // deleted contributions
          { key: 'reopen', label: this.$t('reopen') },
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
            key: 'deletedAt',
            label: this.$t('contributions.deleted'),
            formatter: (value) => {
              return this.$d(new Date(value), 'short')
            },
          },
          { key: 'deletedBy', label: this.$t('moderator') },
          { key: 'chatCreation', label: this.$t('chat') },
        ],
        [
          // all contributions
          { key: 'state', label: this.$t('status') },
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
          { key: 'confirmedBy', label: this.$t('moderator') },
          { key: 'chatCreation', label: this.$t('chat') },
        ],
      ][this.tabIndex]
    },
    statusFilter() {
      return FILTER_TAB_MAP[this.tabIndex]
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
    ListAllContributions: {
      query() {
        return adminListAllContributions
      },
      variables() {
        return {
          currentPage: this.currentPage,
          pageSize: this.pageSize,
          statusFilter: this.statusFilter,
        }
      },
      fetchPolicy: 'no-cache',
      update({ adminListAllContributions }) {
        this.rows = adminListAllContributions.contributionCount
        this.items = adminListAllContributions.contributionList
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
