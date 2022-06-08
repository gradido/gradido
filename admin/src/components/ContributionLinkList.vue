<template>
  <div>
    <b-table striped hover :items="items" :fields="fields">
      <template #cell(delete)>
        <b-button variant="danger" size="md" class="mr-2" @click="deleteContributionLink">
          <b-icon icon="trash" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(edit)="data">
        <b-button variant="success" size="md" class="mr-2" @click="editContributionLink(data.item)">
          <b-icon icon="pencil" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(show)="data">
        <b-button variant="info" size="md" class="mr-2" @click="showContributionLink(data.item)">
          <b-icon icon="eye" variant="light"></b-icon>
        </b-button>
      </template>
    </b-table>

    <b-modal ref="my-modal" ok-only hide-header-close>
      <b-card header-tag="header" footer-tag="footer">
        <template #header>
          <h6 class="mb-0">{{ modalData ? modalData.name : '' }}</h6>
        </template>
        <b-card-text>
          {{ modalData }}
          <figure-qr-code :link="modalData ? modalData.link : ''" />
        </b-card-text>
        <template #footer>
          <em>{{ modalData ? modalData.link : '' }}</em>
        </template>
      </b-card>
    </b-modal>
  </div>
</template>
<script>
import { deleteContributionLink } from '@/graphql/deleteContributionLink.js'
import FigureQrCode from './FigureQrCode.vue'

export default {
  name: 'ContributionLinkList',
  components: {
    FigureQrCode,
  },
  props: {
    items: { type: Array },
  },
  data() {
    return {
      fields: [
        'name',
        'memo',
        'amount',
        'cycle',
        'repetition',
        { key: 'startDate', label: 'Start' },
        { key: 'endDate', label: 'Ende' },
        'delete',
        'edit',
        'show',
      ],
      modalData: null,
      modalDataLink: null,
    }
  },
  methods: {
    deleteContributionLink() {
      this.$bvModal
        .msgBoxConfirm('Automatische Creations wirklich löschen?')
        .then(async (value) => {
          if (value)
            await this.$apollo
              .mutate({
                mutation: deleteContributionLink,
                variables: {
                  id: this.id,
                },
              })
              .then(() => {
                this.toastSuccess('TODO: request message deleted ')
              })
              .catch((err) => {
                this.toastError(err.message)
              })
        })
    },
    editContributionLink(row) {
      this.$emit('editContributionLinkData', row)
    },

    showContributionLink(row) {
      this.modalData = row
      this.$refs['my-modal'].show()
    },
  },
}
</script>
