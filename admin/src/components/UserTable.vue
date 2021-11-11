<template>
  <div>
    <b-table :items="items" :fields="fields" :filter="criteria" caption-top striped hover>
      <template #cell(checkbox)="row">
        <!-- As `row.showDetails` is one-way, we call the toggleDetails function on @change -->
        <b-form-checkbox v-model="row.detailsShowing" @change="row.toggleDetails">
          Details via check
        </b-form-checkbox>
      </template>
      <template #table-caption>
        <div>
          <b-form-input
            v-model="criteria"
            placeholder="User suche"
            class="bg-color-gray"
          ></b-form-input>
        </div>
      </template>

      <template #cell(show_details)="row">
        <b-button size="sm" @click="row.toggleDetails" class="mr-2">
          {{ row.detailsShowing ? 'Hide' : 'Show' }} Details
        </b-button>
      </template>

      <template #row-details="row">
        <b-card>
          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>Age:</b></b-col>
            <b-col>{{ row.item.age }}</b-col>
          </b-row>

          <b-row class="mb-2">
            <b-col sm="3" class="text-sm-right"><b>Is Active:</b></b-col>
            <b-col>{{ row.item.isActive }}</b-col>
          </b-row>
          <create-formular />

          <b-button size="sm" @click="row.toggleDetails">Hide Details</b-button>
        </b-card>
      </template>
    </b-table>
  </div>
</template>

<script>
import CreateFormular from '../components/CreateFormular.vue'

export default {
  name: 'UserTable',
  props: ['count', 'area'],
  components: {
    CreateFormular,
  },
  data() {
    return {
      criteria: '',
      fields: ['checkbox', 'email', 'first_name', 'last_name', 'creation', 'show_details'],
      items: [
        {
          email: 'dickerson@web.de',
          first_name: 'Dickerson',
          last_name: 'Macdonald',
          creation: '0,200, 1000',
        },
        {
          email: 'larsen@woob.de',
          first_name: 'Larsen',
          last_name: 'Shaw',
          creation: '0,200, 1000',
        },
        {
          email: 'geneva@tete.de',
          first_name: 'Geneva',
          last_name: 'Wilson',
          creation: '0,200, 1000',
        },
        {
          email: 'viewrter@asdfvb.com',
          first_name: 'Soledare',
          last_name: 'Takker',
          creation: '100,400, 800',
        },
      ],
    }
  },
}
</script>
