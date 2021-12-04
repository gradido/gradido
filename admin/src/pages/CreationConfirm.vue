<template>
  <div class="creation-confirm">
    <small class="bg-danger text-light p-1">
      Die anzahl der offene Schöpfungen stimmen nicht! Diese wird bei absenden im $store
      hochgezählt. Die Liste die hier angezeigt wird ist SIMULIERT!
    </small>
    <user-table
      class="mt-4"
      type="PageCreationConfirm"
      :itemsUser="confirmResult"
      :fieldsTable="fields"
      @remove-confirm-result="removeConfirmResult"
    />
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'

export default {
  name: 'CreationConfirm',
  components: {
    UserTable,
  },
  data() {
    return {
      showArrays: false,
      fields: [
        { key: 'bookmark', label: 'löschen' },
        { key: 'email', label: 'Email' },
        { key: 'firstName', label: 'Vorname' },
        { key: 'lastName', label: 'Nachname' },
        {
          key: 'creation_gdd',
          label: 'Schöpfung',
          formatter: (value) => {
            return value + ' GDD'
          },
        },
        { key: 'text', label: 'Text' },
        {
          key: 'creation_date',
          label: 'Datum',
          formatter: (value) => {
            return value.long
          },
        },
        { key: 'creation_moderator', label: 'Moderator' },
        { key: 'edit_creation', label: 'ändern' },
        { key: 'confirm', label: 'speichern' },
      ],
      confirmResult: [
        {
          id: 1,
          email: 'dickerson@web.de',
          firstName: 'Dickerson',
          lastName: 'Macdonald',
          creation: '[450,200,700]',
          creation_gdd: '1000',
          text: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ',

          creation_date: {
            short: 'November',
            long: '22/11/2021',
          },
          creation_moderator: 'Manuela Gast',
        },
        {
          id: 2,
          email: 'larsen@woob.de',
          firstName: 'Larsen',
          lastName: 'Shaw',
          creation: '[300,200,1000]',
          creation_gdd: '1000',
          text: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam ',

          creation_date: {
            short: 'November',
            long: '03/11/2021',
          },
          creation_moderator: 'Manuela Gast',
        },
        {
          id: 3,
          email: 'geneva@tete.de',
          firstName: 'Geneva',
          lastName: 'Wilson',
          creation: '[350,200,900]',
          creation_gdd: '1000',
          text: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam',
          creation_date: {
            short: 'September',
            long: '27/09/2021',
          },
          creation_moderator: 'Manuela Gast',
        },
        {
          id: 4,
          email: 'viewrter@asdfvb.com',
          firstName: 'Soledare',
          lastName: 'Takker',
          creation: '[100,400,800]',
          creation_gdd: '500',
          text: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo ',
          creation_date: {
            short: 'Oktober',
            long: '12/10/2021',
          },
          creation_moderator: 'Evelyn Roller',
        },
        {
          id: 5,
          email: 'dickerson@web.de',
          firstName: 'Dickerson',
          lastName: 'Macdonald',
          creation: '[100,400,800]',
          creation_gdd: '200',
          text: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At',
          creation_date: {
            short: 'September',
            long: '05/09/2021',
          },
          creation_moderator: 'Manuela Gast',
        },
      ],
    }
  },

  methods: {
    removeConfirmResult(e, event) {
      if (event === 'remove') {
        let index = 0
        let findArr = {}

        findArr = this.confirmResult.find((arr) => arr.id === e.id)

        index = this.confirmResult.indexOf(findArr)

        this.confirmResult.splice(index, 1)

        this.$store.commit('openCreationsMinus', 1)
      }
    },
  },
  created() {
    this.$store.commit('resetOpenCreations')
    this.$store.commit('openCreationsPlus', Object.keys(this.confirmResult).length)
  },
}
</script>
