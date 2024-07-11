<template>
  <div class="admin-overview">
    <BCard
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
    </BCard>
    <BCard
      v-show="$store.state.openCreations < 1"
      border-variant="success"
      :header="$t('not_open_creations')"
      header-bg-variant="success"
      header-text-variant="white"
      align="center"
    >
      <BCardText>
        <BLink to="creation-confirm">
          <h1 data-test="open-creation">{{ $store.state.openCreations }}</h1>
        </BLink>
      </BCardText>
    </BCard>
  </div>
</template>
<script>
import { adminListContributions } from '../graphql/adminListContributions'
import { BCard, BCardText } from 'bootstrap-vue-next'

export default {
  name: 'overview',
  components: { BCard, BCardText },
  data() {
    return {
      statusFilter: ['IN_PROGRESS', 'PENDING'],
    }
  },
  apollo: {
    AllContributions: {
      query() {
        return adminListContributions
      },
      variables() {
        // may be at some point we need a pagination here
        return {
          statusFilter: this.statusFilter,
          hideResubmission: true,
        }
      },
      update({ adminListContributions }) {
        this.$store.commit('setOpenCreations', adminListContributions.contributionCount)
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
}
</script>
