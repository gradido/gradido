<template>
  <div>
    <user-table
      type="PageCreationConfirm"
      :itemsUser="confirmResult"
      :fieldsTable="fields"
      :criteria="criteria"
      @update-confirm-result="updateConfirmResult"
    />
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'

export default {
  name: 'creation_confirm',
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
        { key: 'creation_gdd', label: 'Creation GDD' },
        { key: 'creation_date', label: 'Datum' },
        { key: 'creation_moderator', label: 'Moderator' },
        { key: 'show_details', label: 'Details' },
        { key: 'bookmark', label: 'Bookmark' },
      ],
      confirmResult: [
        {
          id: 1,
          email: 'dickerson@web.de',
          first_name: 'Dickerson',
          last_name: 'Macdonald',
          creation_old: '450,200,700',
          creation_gdd: '1000',
          creation_date: '01/11/2021',
          creation_moderator: 'Manuela Gast',
        },
        {
          id: 2,
          email: 'larsen@woob.de',
          first_name: 'Larsen',
          last_name: 'Shaw',
          creation_old: '300,200,1000',
          creation_gdd: '1000',
          creation_date: '01/11/2021',
          creation_moderator: 'Manuela Gast',
        },
        {
          id: 3,
          email: 'geneva@tete.de',
          first_name: 'Geneva',
          last_name: 'Wilson',
          creation_old: '350,200,900',
          creation_gdd: '1000',
          creation_date: '01/11/2021',
          creation_moderator: 'Manuela Gast',
        },
        {
          id: 4,
          email: 'viewrter@asdfvb.com',
          first_name: 'Soledare',
          last_name: 'Takker',
          creation_gdd: '500',
          creation_date: '01/10/2021',
          creation_moderator: 'Evelyn Roller',
        },
        {
          id: 5,
          email: 'dickerson@web.de',
          first_name: 'Dickerson',
          last_name: 'Macdonald',
          creation_old: '100,400,800',
          creation_gdd: '200',
          creation_date: '01/09/2021',
          creation_moderator: 'Manuela Gast',
        },
      ],
      massCreation: [],
      criteria: '',
    }
  },

  methods: {
    updateConfirmResult(e, event) {
      if (event === 'remove') {
        let index = 0
        let findArr = {}

        findArr = this.confirmResult.find((arr) => arr.id === e.id)

        // console.log('findArr ', findArr)

        index = this.confirmResult.indexOf(findArr)

        // console.log('index ', index)

        this.confirmResult.splice(index, 1)
      }
    },
  },
}
</script>
