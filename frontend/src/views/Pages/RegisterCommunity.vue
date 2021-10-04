<template>
  <div id="register-select-community">
    <b-container class="container text-center">
      <div class="justify-content-center container">
        <b-card
          bg-variant="info"
          text-variant=""
          :header="$store.state.community.name"
          class="text-center"
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
      <div class="text-center py-lg-4">
        <router-link to="/select-community" class="mt-3">
          {{ $t('community.choose-another-aommunity') }}
        </router-link>
      </div>

      <hr />
      <div class="text-center py-lg-4">
        <router-link to="/login" class="mt-3">{{ $t('back') }}</router-link>
      </div>
    </b-container>
  </div>
</template>
<script>
export default {
  name: 'registerSelectCommunity',
  data() {
    return {}
  },
  methods: {},
}
</script>
<style></style>
