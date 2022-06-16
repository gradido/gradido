<template>
  <div class="open-creations-table">
    <b-table-lite :items="items" :fields="fields" caption-top striped hover stacked="md">
      <template #cell(bookmark)="row">
        <b-button
          variant="danger"
          size="md"
          @click="$emit('remove-creation', row.item)"
          class="mr-2"
        >
          <b-icon icon="x" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(edit_creation)="row">
        <b-button variant="info" size="md" @click="rowToggleDetails(row, 0)" class="mr-2">
          <b-icon :icon="row.detailsShowing ? 'x' : 'pencil-square'" aria-label="Help"></b-icon>
        </b-button>
      </template>
      <template #cell(confirm)="row">
        <b-button variant="success" size="md" @click="$emit('show-overlay', row.item)" class="mr-2">
          <b-icon icon="check" scale="2" variant=""></b-icon>
        </b-button>
      </template>
      <template #row-details="row">
        <row-details
          :row="row"
          type="show-creation"
          slotName="show-creation"
          :index="0"
          @row-toggle-details="rowToggleDetails"
        >
          <template #show-creation>
            <div>
              <edit-creation-formular
                type="singleCreation"
                :creation="row.item.creation"
                :item="row.item"
                :row="row"
                :creationUserData="creationUserData"
                @update-creation-data="updateCreationData"
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
import RowDetails from '../RowDetails.vue'
import EditCreationFormular from '../EditCreationFormular.vue'

export default {
  name: 'OpenCreationsTable',
  mixins: [toggleRowDetails],
  components: {
    EditCreationFormular,
    RowDetails,
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
    updateCreationData(data) {
      this.creationUserData = data
      // this.creationUserData.amount = data.amount
      // this.creationUserData.date = data.date
      // this.creationUserData.memo = data.memo
      // this.creationUserData.moderator = data.moderator
      data.row.toggleDetails()
    },
    updateUserData(rowItem, newCreation) {
      rowItem.creation = newCreation
    },
  },
}
</script>
