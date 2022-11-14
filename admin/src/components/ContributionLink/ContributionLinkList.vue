<template>
  <div class="contribution-link-list">
    <b-table :items="items" :fields="fields" striped hover stacked="lg">
      <template #cell(delete)="data">
        <b-button
          variant="danger"
          size="md"
          class="mr-2 test-delete-link"
          @click="deleteContributionLink(data.item.id, data.item.name)"
        >
          <b-icon icon="trash" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(edit)="data">
        <b-button variant="success" size="md" class="mr-2" @click="editContributionLink(data.item)">
          <b-icon icon="pencil" variant="light"></b-icon>
        </b-button>
      </template>
      <template #cell(show)="data">
        <b-button
          variant="info"
          size="md"
          class="mr-2 test-show"
          @click="showContributionLink(data.item)"
        >
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
          {{ modalData.memo ? modalData.memo : '' }}
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
import FigureQrCode from '../FigureQrCode.vue'

export default {
  name: 'ContributionLinkList',
  components: {
    FigureQrCode,
  },
  props: {
    items: { type: Array, required: true },
  },
  data() {
    return {
      fields: [
        'name',
        'memo',
        'amount',
        { key: 'cycle', label: this.$t('contributionLink.cycle') },
        { key: 'maxPerCycle', label: this.$t('contributionLink.maxPerCycle') },
        {
          key: 'validFrom',
          label: this.$t('contributionLink.validFrom'),
          formatter: (value, key, item) => {
            if (value) {
              return this.$d(new Date(value))
            } else {
              return null
            }
          },
        },
        {
          key: 'validTo',
          label: this.$t('contributionLink.validTo'),
          formatter: (value, key, item) => {
            if (value) {
              return this.$d(new Date(value))
            } else {
              return null
            }
          },
        },
        'delete',
        'edit',
        'show',
      ],
      modalData: {},
    }
  },
  methods: {
    deleteContributionLink(id, name) {
      this.$bvModal
        .msgBoxConfirm(this.$t('contributionLink.deleteNow', { name: name }))
        .then(async (value) => {
          if (value)
            await this.$apollo
              .mutate({
                mutation: deleteContributionLink,
                variables: {
                  id: id,
                },
              })
              .then(() => {
                this.toastSuccess(this.$t('contributionLink.deleted'))
                this.$emit('closeContributionForm')
                this.$emit('get-contribution-links')
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
