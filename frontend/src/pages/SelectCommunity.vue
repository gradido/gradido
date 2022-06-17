<template>
  <div id="register-select-community">
    <b-container class="text-center">
      <div class="pb-3">{{ $t('community.current-community') }}</div>

      <div v-if="!pending">
        <b-card class="border-0 mb-0" bg-variant="primary">
          <b>{{ CONFIG.COMMUNITY_NAME }}</b>
          <br />
          <p>{{ CONFIG.COMMUNITY_DESCRIPTION }}</p>
          <br />
          <router-link to="/register">
            <b-button variant="outline-secondary">
              {{ $t('community.continue-to-registration') }}
            </b-button>
          </router-link>
        </b-card>

        <hr />

        <div>{{ $t('community.other-communities') }}</div>

        <div v-for="community in communities" :key="community.id" class="pb-3">
          <b-card bg-variant="secondary">
            <b>{{ community.name }}</b>
            <br />
            <p>{{ community.description }}</p>
            <br />
            <b>
              <small>
                <b-link :href="community.url">{{ community.url }}</b-link>
              </small>
            </b>
            <br />
            <b-button variant="outline-secondary" :href="community.registerUrl">
              {{ $t('community.switch-to-this-community') }}
            </b-button>
          </b-card>
        </div>
      </div>

      <div class="text-center py-lg-4">
        <router-link to="/login">
          <b-button variant="outline-secondary">{{ $t('back') }}</b-button>
        </router-link>
      </div>
    </b-container>
  </div>
</template>
<script>
import { communities } from '@/graphql/queries'
import CONFIG from '@/config'

export default {
  name: 'SelectCommunity',
  data() {
    return {
      communities: [],
      pending: true,
      CONFIG,
    }
  },
  methods: {
    async getCommunities() {
      const loader = this.$loading.show({
        container: this.$refs.header,
      })
      this.$apollo
        .query({
          query: communities,
          fetchPolicy: 'network-only',
        })
        .then((response) => {
          this.communities = response.data.communities.filter(
            (c) => c.name !== CONFIG.COMMUNITY_NAME,
          )
        })
        .catch((error) => {
          this.toastError(error.message)
        })
      loader.hide()
      this.pending = false
    },
  },
  created() {
    this.getCommunities()
  },
}
</script>
<style>
.alert-light {
  color: #424543;
  background-color: #bac1c84a;
  border-color: #ffffff00;
}
.bg-primary {
  background-color: #5e72e41f !important;
}
.bg-secondary {
  background-color: #525f7f0f !important;
}

.card-footer {
  background-color: #ffffff5e !important;
}
</style>
