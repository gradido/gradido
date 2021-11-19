<template>
  <div>
    <label>Usersuche</label>
    <b-input
      type="text"
      v-model="criteria"
      class="shadow p-3 mb-5 bg-white rounded"
      placeholder="User suche"
    ></b-input>
    <user-table
      type="PageUserSearch"
      :itemsUser="searchResult"
      :fieldsTable="fields"
      :criteria="criteria"
    />
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'

export default {
  name: 'overview',
  components: {
    UserTable,
  },
  data() {
    return {
      showArrays: false,
      fields: [
        { key: 'email', label: 'Email' },
        { key: 'first_name', label: 'Firstname' },
        { key: 'last_name', label: 'Lastname' },
        { key: 'creation', label: 'Creation' },
        { key: 'show_details', label: 'Details' },
      ],
      searchResult: [
        {
          id: 1,
          email: 'dickerson@web.de',
          first_name: 'Dickerson',
          last_name: 'Macdonald',
          creation: '450,200,700',
        },
        {
          id: 2,
          email: 'larsen@woob.de',
          first_name: 'Larsen',
          last_name: 'Shaw',
          creation: '300,200,1000',
        },
        {
          id: 3,
          email: 'geneva@tete.de',
          first_name: 'Geneva',
          last_name: 'Wilson',
          creation: '350,200,900',
        },
        {
          id: 4,
          email: 'viewrter@asdfvb.com',
          first_name: 'Soledare',
          last_name: 'Takker',
          creation: '100,400,800',
        },
      ],
      massCreation: [],
      criteria: '',
    }
  },

  methods: {},
}
</script>
