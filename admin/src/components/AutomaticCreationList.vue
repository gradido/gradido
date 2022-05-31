<template>
  <div>
    <b-table striped hover :items="items" :fields="fields">
      <template #cell(delete)>
        <b-button variant="danger" size="md" class="mr-2" @click="deleteAutomaticCreations">
          <b-icon icon="trash" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(edit)="data">
        <b-button variant="success" size="md" class="mr-2" @click="editAutomaticCreations(data)">
          <b-icon icon="pencil" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(show)="data">
        <b-button variant="info" size="md" class="mr-2" @click="showAutomaticCreations(data)">
          <b-icon icon="eye" variant="light"></b-icon>
        </b-button>
      </template>
    </b-table>

    <b-modal ref="my-modal" ok-only hide-header-close>
      <b-card header-tag="header" footer-tag="footer">
        <template #header>
          <h6 class="mb-0">xxx</h6>
        </template>
        <b-card-text>
          daten + qrCode + link
          {{ modalData }}
        </b-card-text>
        <template #footer>
          <em>link</em>
        </template>
      </b-card>
    </b-modal>
  </div>
</template>
<script>
export default {
  name: 'AutomaticCreationList',
  props: {
    items: { type: Array },
  },
  data() {
    return {
      fields: [
        'Name',
        'Text',
        'GDD',
        'cycle',
        'repetition',
        { key: 'startDate', label: 'Start' },
        { key: 'endDate', label: 'Ende' },
        'delete',
        'edit',
        'show',
      ],
      modalData: null,
    }
  },
  methods: {
    deleteAutomaticCreations() {
      this.$bvModal
        .msgBoxConfirm('Automatische Creations wirklich löschen?')
        .then(async (value) => {
          // if (value)
          // await this.$apollo
          //   .mutate({
          //     mutation: deleteTransactionLink,
          //     variables: {
          //       id: this.id,
          //     },
          //   })
          //   .then(() => {
          //     this.toastSuccess(this.$t('gdd_per_link.deleted'))
          //     this.$emit('reset-transaction-link-list')
          //   })
          //   .catch((err) => {
          //     this.toastError(err.message)
          // })
        })
    },
    editAutomaticCreations(row) {
      this.$emit('editAutomaticContributionData', row.item)
    },

    showAutomaticCreations(row) {
      this.modalData = row
      this.$refs['my-modal'].show()
    },
  },
}
</script>
