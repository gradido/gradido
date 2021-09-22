<template>
  <div id="register-select-community">
    <b-container class="justify-content-center text-center">
      <div class="mb-4">{{ $t('community.current-community') }}</div>

      <div v-for="community in communitys.community" :key="community.id" class="pb-3">
        <b-card
          v-show="community.name === $store.state.community_name"
          bg-variant="success"
          text-variant=""
          :header="community.name"
        >
          <b-card-text>
            {{ $store.state.community.description }}, Location:
            {{ $store.state.community.location }}
          </b-card-text>
          <b-button size="sm" to="/register">{{ $t('community.continue-to-registration') }}</b-button>
        </b-card>
      </div>

      <hr />
      <div>{{ $t('community.other-communities') }}</div>
      <div v-for="community in communitys.community" :key="community.id" class="pb-5">
        <b-card
          v-show="community.name != $store.state.community_name"
          bg-variant="info"
          text-variant=""
          :header="community.name"
        >
          <b-card-text>beschreibung für community 1, Location:</b-card-text>
          <b-button size="sm" :href="community.url">{{ $t('community.switch-to-this-community')}}</b-button>
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
import json from '/public/json-example/communitys.json'

export default {
  name: 'registerSelectCommunity',
  data() {
    return {
      communitys: json,
    }
  },
  methods: {},
}
</script>
<style></style>
