<template>
  <div>
    <b-card
      v-show="items.length > 1"
      border-variant="success"
      header="open Contribution"
      header-bg-variant="success"
      header-text-variant="white"
      class="mt-5"
    >
      <b-button v-b-toggle.newContribution class="my-3">+ New Contribution</b-button>

      <b-collapse id="newContribution" class="mt-2">
        <b-card>
          <p class="h2 ml-5">New Contribution</p>
          <automatic-creation-form />
        </b-card>
      </b-collapse>

      <b-card-text>
        <automatic-creation-list :items="items" />
      </b-card-text>
    </b-card>
  </div>
</template>
<script>
import AutomaticCreationForm from './AutomaticCreationForm.vue'
import AutomaticCreationList from './AutomaticCreationList.vue'

export default {
  name: 'AutomaticCreation',
  props: {
    items: { type: Array },
  },
  components: {
    AutomaticCreationForm,
    AutomaticCreationList,
  },
}
</script>
