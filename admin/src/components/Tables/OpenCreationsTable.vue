<template>
  <div class="open-creations-table">
    <b-table-lite
      :items="items"
      :fields="fields"
      caption-top
      striped
      hover
      stacked="md"
      :tbody-tr-class="rowClass"
    >
      <template #cell(state)="row">
        <b-icon :icon="getStatusIcon(row.item.state)"></b-icon>
      </template>
      <template #cell(bookmark)="row">
        <div v-if="!myself(row.item)">
          <b-button
            variant="danger"
            size="md"
            @click="$emit('show-overlay', row.item, 'delete')"
            class="mr-2"
          >
            <b-icon icon="trash" variant="light"></b-icon>
          </b-button>
        </div>
      </template>
      <template #cell(editCreation)="row">
        <div v-if="$store.state.moderator.id !== row.item.userId">
          <b-button
            v-if="row.item.moderator"
            variant="info"
            size="md"
            @click="rowToggleDetails(row, 0)"
            class="mr-2"
          >
            <b-icon :icon="row.detailsShowing ? 'x' : 'pencil-square'" aria-label="Help"></b-icon>
          </b-button>
          <b-button v-else @click="rowToggleDetails(row, 0)">
            <b-icon icon="chat-dots"></b-icon>
            <b-icon
              v-if="row.item.state === 'PENDING' && row.item.messageCount > 0"
              icon="exclamation-circle-fill"
              variant="warning"
            ></b-icon>
            <b-icon
              v-if="row.item.state === 'IN_PROGRESS' && row.item.messageCount > 0"
              icon="question-diamond"
              variant="light"
            ></b-icon>
          </b-button>
        </div>
      </template>
      <template #cell(reActive)>
        <div v-if="!myself(row.item)">
          <b-button variant="warning" size="md" class="mr-2">
            <b-icon icon="arrow-up" variant="light"></b-icon>
          </b-button>
        </div>
      </template>
      <template #cell(chatCreation)="row">
        <b-button v-if="row.item.messagesCount > 0" @click="rowToggleDetails(row, 0)">
          <b-icon icon="chat-dots"></b-icon>
        </b-button>
      </template>
      <template #cell(deny)="row">
        <div v-if="!myself(row.item)">
          <b-button
            variant="warning"
            size="md"
            @click="$emit('show-overlay', row.item, 'deny')"
            class="mr-2"
          >
            <b-icon icon="x" variant="light"></b-icon>
          </b-button>
        </div>
      </template>
      <template #cell(confirm)="row">
        <div v-if="!myself(row.item)">
          <b-button
            variant="success"
            size="md"
            @click="$emit('show-overlay', row.item, 'confirm')"
            class="mr-2"
          >
            <b-icon icon="check" scale="2" variant=""></b-icon>
          </b-button>
        </div>
      </template>
      <template #row-details="row">
        <row-details
          :row="row"
          type="show-creation"
          slotName="show-creation"
          :index="0"
          @row-toggle-details="rowToggleDetails(row, 0)"
        >
          <template #show-creation>
            <div v-if="row.item.moderator">
              <edit-creation-formular
                type="singleCreation"
                :creation="row.item.creation"
                :item="row.item"
                :row="row"
                :creationUserData="creationUserData"
                @update-creation-data="updateCreationData"
              />
            </div>
            <div v-else>
              <contribution-messages-list
                :contributionId="row.item.id"
                @update-state="updateState"
                @update-user-data="updateUserData"
              />
            </div>
          </template>
        </row-details>
      </template>
    </b-table-lite>
  </div>
</template>

<script>
import { toggleRowDetails } from '../../mixins/toggleRowDetails'
import RowDetails from '../RowDetails'
import EditCreationFormular from '../EditCreationFormular'
import ContributionMessagesList from '../ContributionMessages/ContributionMessagesList'

const iconMap = {
  IN_PROGRESS: 'question-square',
  PENDING: 'bell-fill',
  CONFIRMED: 'check',
  DELETED: 'trash',
  DENIED: 'x-circle',
}

export default {
  name: 'OpenCreationsTable',
  mixins: [toggleRowDetails],
  components: {
    EditCreationFormular,
    RowDetails,
    ContributionMessagesList,
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
    fields: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      creationUserData: {
        amount: null,
        date: null,
        memo: null,
        moderator: null,
      },
    }
  },
  methods: {
    myself(item) {
      return (
        name === `${this.$store.state.moderator.firstName} ${this.$store.state.moderator.lastName}`
      )
    },
    getStatusIcon(status) {
      return iconMap[status] ? iconMap[status] : 'default-icon'
    },
    rowClass(item, type) {
      if (!item || type !== 'row') return
      if (item.state === 'CONFIRMED') return 'table-success'
      if (item.state === 'DENIED') return 'table-info'
    },
    updateCreationData(data) {
      const row = data.row
      this.$emit('update-contributions', data)
      delete data.row
      this.creationUserData = { ...this.creationUserData, ...data }
      row.toggleDetails()
    },
    updateUserData(rowItem, newCreation) {
      rowItem.creation = newCreation
    },
    updateState(id) {
      this.$emit('update-state', id)
    },
  },
}
</script>
