<template>
  <div class="admin-overview">
    <b-card
      v-show="$store.state.openCreations > 0"
      border-variant="primary"
      :header="$t('open_creations')"
      header-bg-variant="danger"
      header-text-variant="white"
      align="center"
    >
      <b-card-text>
        <b-link to="creation-confirm">
          <h1>{{ $store.state.openCreations }}</h1>
        </b-link>
      </b-card-text>
    </b-card>
    <b-card
      v-show="$store.state.openCreations < 1"
      border-variant="success"
      :header="$t('not_open_creations')"
      header-bg-variant="success"
      header-text-variant="white"
      align="center"
    >
      <b-card-text>
        <b-link to="creation-confirm">
          <h1>{{ $store.state.openCreations }}</h1>
        </b-link>
      </b-card-text>
    </b-card>
    <div>{{ ContributionLinks }}</div>

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
          <b-form class="m-5" @submit="onSubmit">
            <validation-provider name="Name" :rules="{ required: true, min: 3 }">
              <b-form-group id="input-group-1" label="Name:">
                <b-form-input
                  v-model="form.name"
                  type="text"
                  placeholder="Name Contribution"
                  required
                ></b-form-input>
              </b-form-group>
            </validation-provider>
            <b-form-group id="input-group-2" label="Beschreibung:">
              <b-form-textarea
                v-model="form.text"
                placeholder="Text Contribution"
                required
              ></b-form-textarea>
            </b-form-group>
            <b-form-group id="input-group-3" label="Betrag:">
              <b-form-input
                v-model="form.amount"
                type="number"
                placeholder="0"
                required
              ></b-form-input>
            </b-form-group>
            <div>
              <b-form-group id="input-group-4" label="Start-Datum:">
                <b-form-datepicker
                  v-model="form.startDate"
                  :min="min"
                  class="mb-4"
                  required
                ></b-form-datepicker>
              </b-form-group>

              <label for="datepicker-invalid">End-Datum</label>
              <b-form-datepicker
                v-model="form.endDate"
                :min="form.startDate ? form.startDate : min"
                class="mb-4"
                required
              ></b-form-datepicker>
            </div>
            <div class="mt-6">
              <b-button type="submit" variant="primary">Anlegen</b-button>
              <b-button type="reset" variant="danger">Reset</b-button>
            </div>
          </b-form>
        </b-card>
      </b-collapse>

      <b-card-text>
        <b-table striped hover :items="items" :fields="fields">
          <template #cell(delete)>
            <b-button variant="danger" size="md" class="mr-2">
              <b-icon icon="trash" variant="light"></b-icon>
            </b-button>
          </template>
          <template #cell(edit)>
            <b-button variant="success" size="md" class="mr-2">
              <b-icon icon="pencil" variant="light"></b-icon>
            </b-button>
          </template>
          <template #cell(show)>
            <b-button variant="info" size="md" class="mr-2">
              <b-icon icon="eye" variant="light"></b-icon>
            </b-button>
          </template>
        </b-table>
      </b-card-text>
    </b-card>
  </div>
</template>
<script>
import { getPendingCreations } from '../graphql/getPendingCreations'
import { fields, ContributionLinks } from '../ContributionLinks.json'

export default {
  name: 'overview',
  data() {
    return {
      fields: fields,
      items: ContributionLinks,
      form: {
        name: null,
        text: null,
        amount: null,
        startDate: null,
        endDate: null,
      },
      min: new Date(),
    }
  },
  methods: {
    onSubmit(event) {
      event.preventDefault()
      if (this.form.name === null || this.form.text === null) return
      alert(JSON.stringify(this.form))
    },
    async getPendingCreations() {
      this.$apollo
        .query({
          query: getPendingCreations,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.$store.commit('setOpenCreations', result.data.getPendingCreations.length)
        })
    },
  },
  created() {
    this.getPendingCreations()
  },
}
</script>
