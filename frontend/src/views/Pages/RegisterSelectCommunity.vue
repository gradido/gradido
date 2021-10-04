<template>
  <div id="register-select-community">
    <b-container class="justify-content-center text-center">
      <div class="mb-4">{{ $t('community.current-community') }}</div>

      <div v-for="community in communities" :key="community.id" class="pb-3">
        <b-card
          v-show="community.name === $store.state.community.name"
          bg-variant="success"
          text-variant=""
          :header="community.name"
        >
          <b-card-text>
            {{ $store.state.community.description }}, Location:
            {{ $store.state.community.location }}
          </b-card-text>
          <b-button size="sm" to="/register">
            {{ $t('community.continue-to-registration') }}
          </b-button>
        </b-card>
      </div>

      <hr />
      <div>{{ $t('community.other-communities') }}</div>
      <div v-for="community in communities" :key="community.id" class="pb-5">
        <b-card
          v-show="community.name != $store.state.community.name"
          bg-variant="info"
          text-variant=""
          :header="community.name"
        >
          <b-card-text>
            {{ community.description }}, Location:
            {{ community.location }}
          </b-card-text>
          <b-button size="sm" :href="community.url">
            {{ $t('community.switch-to-this-community') }}
          </b-button>
        </b-card>
      </div>

      <hr />
      <div class="text-center py-lg-4">
        <router-link to="/login" class="mt-3">{{ $t('back') }}</router-link>
      </div>
    </b-container>
  </div>
</template>
<script>
import { communities } from '../../graphql/queries'

export default {
  name: 'registerSelectCommunity',
  data() {
    return {
      communities: [],
    }
  },
  methods: {
    async onCreated() {
      this.$apollo
        .query({
          query: communities,
        })
        .then((result) => {
          this.communities = result.data.communities
        })
        .catch((error) => {
          this.$toasted.error(error)
        })
    },
  },
  created() {
    this.onCreated()
  },
}
</script>
<style></style>
