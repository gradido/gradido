<template>
  <vue-bootstrap-typeahead v-model="query" :data="users" @change="getUser" />
</template>
<script>
import VueBootstrapTypeahead from 'vue-bootstrap-typeahead'

// Global registration
// Vue.component('vue-bootstrap-typeahead', VueBootstrapTypeahead)

// OR

// Local registration
export default {
  name: 'SearchUser',
  components: {
    VueBootstrapTypeahead,
  },
  data() {
    return {
      user: '',
      users: [
        'Bob',
        'Alice',
        'Bernd',
        'Dario',
        'Alex',
        'Pauls',
        'Ulf',
        'Delaware',
        'Florida',
        'Georgia',
        'Hawaii',
        'Idaho',
        'Illnois',
        'Indiana',
        'Iowa',
        'Kansas',
        'Kentucky',
        'Louisiana',
        'Maine',
        'Maryland',
        'Massachusetts',
        'Michigan',
        'Minnesota',
        'Mississippi',
        'Missouri',
        'Montana',
        'Nebraska',
        'Nevada',
        'New Hampshire',
        'New Jersey',
        'New Mexico',
        'New York',
        'North Carolina',
        'North Dakota',
        'Ohio',
        'Oklahoma',
        'Oregon',
        'Pennsylvania',
        'Rhode Island',
        'South Carolina',
        'South Dakota',
        'Tennessee',
        'Texas',
        'Utah',
        'Vermont',
        'Virginia',
        'Washington',
        'West Virginia',
        'Wisconsin',
        'Wyoming',
      ],
    }
  },
  methods: {
    getUser() {
      alert(this.data.user)
    },
  },
}
</script>
