<template>
  <div id="register-community">
    <!-- Header -->
    <div class="p-3">
      <b-container>
        <div class="text-center mb-7 header">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ $store.state.community.name }}</h1>
              <p class="text-lead">
                {{ $store.state.community.description }}
              </p>
              <p class="text-lead community-location">Location: {{ $store.state.community.url }}</p>
            </b-col>
          </b-row>
          <b-row>
            <b-col class="text-center">
              <b-button variant="outline-secondary" to="/register">
                {{ $t('community.continue-to-registration') }}
              </b-button>
            </b-col>
          </b-row>

          <hr />
          <b-row>
            <b-col class="text-center">
              <b-button variant="outline-secondary" to="/select-community">
                {{ $t('community.choose-another-community') }}
              </b-button>
            </b-col>
          </b-row>
          <hr />
          <b-row>
            <b-col class="text-center">
              <b-button variant="outline-secondary" to="/login">{{ $t('back') }}</b-button>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>
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
