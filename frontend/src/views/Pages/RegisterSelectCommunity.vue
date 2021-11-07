<template>
  <div id="register-select-community">
    <b-container class="text-center">
      <div class="pb-3">{{ $t('community.current-community') }}</div>

      <div v-if="!pending">
        <b-card class="border-0 mb-0" bg-variant="primary">
          <b>{{ $store.state.community.name }}</b>
          <br />
          <p>{{ $store.state.community.description }}</p>
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
import { communities } from '../../graphql/queries'
import { getCommunityInfoMixin } from '../../mixins/getCommunityInfo'

export default {
  name: 'registerSelectCommunity',
  data() {
    return {
      communities: [],
      pending: true,
    }
  },
  mixins: [getCommunityInfoMixin],
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
            (c) => c.name !== this.$store.state.community.name,
          )
        })
        .catch((error) => {
          this.$toasted.error(error.message)
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
