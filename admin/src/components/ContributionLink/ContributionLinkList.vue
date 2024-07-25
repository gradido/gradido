<template>
  <div class="contribution-link-list">
    <BTable :items="items" :fields="fields" striped hover stacked="lg">
      <template #cell(delete)="data">
        <BButton
          variant="danger"
          size="md"
          class="mr-2 test-delete-link"
          @click="deleteContributionLink(data.item.id, data.item.name)"
        >
          <IBiTrash />
        </BButton>
      </template>
      <template #cell(edit)="data">
        <BButton variant="success" size="md" class="mr-2" @click="editContributionLink(data.item)">
          <IBiPencil />
        </BButton>
      </template>
      <template #cell(show)="data">
        <BButton
          variant="info"
          size="md"
          class="mr-2 test-show"
          @click="showContributionLink(data.item)"
        >
          <IBiEye />
        </BButton>
      </template>
    </BTable>

    <BModal ref="my-modal" ok-only hide-header-close>
      <BCard header-tag="header" footer-tag="footer">
        <template #header>
          <h6 class="mb-0">{{ modalData ? modalData.name : '' }}</h6>
        </template>
        <BCardText>
          {{ modalData.memo ? modalData.memo : '' }}
          <figure-qr-code :link="modalData ? modalData.link : ''" />
        </BCardText>
        <template #footer>
          <em>{{ modalData ? modalData.link : '' }}</em>
        </template>
      </BCard>
    </BModal>
  </div>
</template>
<script>
import { deleteContributionLink } from '@/graphql/deleteContributionLink.js'
import FigureQrCode from '../FigureQrCode'

export default {
  name: 'ContributionLinkList',
  components: {
    FigureQrCode,
  },
  props: {
    items: { type: Array, required: true },
  },
  emits: [
    'close-contribution-form',
    'edit-contribution-link-data',
    'get-contribution-links',
    'get-contribution-link',
  ],
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
            }
          },
        },
        {
          key: 'validTo',
          label: this.$t('contributionLink.validTo'),
          formatter: (value, key, item) => {
            if (value) {
              return this.$d(new Date(value))
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
                this.$emit('close-contribution-form')
                this.$emit('get-contribution-links')
              })
              .catch((err) => {
                this.toastError(err.message)
              })
        })
    },
    editContributionLink(row) {
      this.$emit('edit-contribution-link-data', row)
    },

    showContributionLink(row) {
      this.modalData = row
      this.$refs['my-modal'].show()
    },
  },
}
</script>
