<template>
  <div>
    <b-card
      border-variant="success"
      header="Automatic Creations"
      header-bg-variant="success"
      header-text-variant="white"
      header-class="text-center"
      class="mt-5"
    >
      <b-button v-b-toggle.newContribution class="my-3 d-flex justify-content-left">
        + New Automatic Creations
      </b-button>

      <b-collapse v-model="visible" id="newContribution" class="mt-2">
        <b-card>
          <p class="h2 ml-5">Automatic Creations</p>
          <automatic-creation-form :automaticContributionData="automaticContributionData" />
        </b-card>
      </b-collapse>

      <b-card-text>
        <automatic-creation-list
          v-if="items.length > 1"
          :items="items"
          @editAutomaticContributionData="editAutomaticContributionData"
        />
        <div v-else>Es sind keine automatischen Schöpfungen angelegt.</div>
      </b-card-text>
    </b-card>
  </div>
</template>
<script>
import AutomaticCreationForm, { updateForm } from './AutomaticCreationForm.vue'
import AutomaticCreationList from './AutomaticCreationList.vue'

export default {
  name: 'AutomaticCreation',
  components: {
    AutomaticCreationForm,
    AutomaticCreationList,
  },
  props: {
    items: {
      type: Array,
      default: () => [],
    },
  },
  data: function () {
    return {
      visible: false,
      automaticContributionData: {},
    }
  },
 
  methods: {
    editAutomaticContributionData(data) {
      console.log('start methodes editAutomaticContributionData')
      console.log(typeof data)
      if (!this.visible) this.$root.$emit('bv::toggle::collapse', 'newContribution')
      this.automaticContributionData = data
    },
  },
}
</script>
