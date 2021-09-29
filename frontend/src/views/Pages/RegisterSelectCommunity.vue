<template>
  <div id="register-select-community">
    <b-container class="text-center">
      <div class="pb-3">{{ $t('community.current-community') }}</div>

      <div v-for="community in communitys.community" :key="community.name">
        <b-card
          v-show="community.name === $store.state.community.name"
          class="border-0 mb-0"
          bg-variant="primary"
        >
          <b>{{ community.name }}</b>
          <br />
          {{ $store.state.community.description }}
          <br />
          <b-button variant="outline-secondary" to="/register">
            {{ $t('community.continue-to-registration') }}
          </b-button>
        </b-card>
      </div>

      <hr />

      <div>{{ $t('community.other-communities') }}</div>

      <div v-for="community in communitys.community" :key="community.id" class="pb-3">
        <b-card v-show="community.name != $store.state.community.name" bg-variant="secondary">
          <b>{{ community.name }}</b>
          <br />
          {{ community.description }}
          <br />
          Location:
          <b>
            <small>
              <b-link :href="community.url">{{ community.url }}</b-link>
            </small>
          </b>
          <br />
          <b-button variant="outline-secondary" :href="community.url">
            {{ $t('community.switch-to-this-community') }}
          </b-button>
        </b-card>
      </div>

      <div class="text-center py-lg-4">
        <b-button variant="outline-secondary" to="/login">{{ $t('back') }}</b-button>
      </div>
    </b-container>
  </div>
</template>
<script>
import MyCommunitys from '../../../public/json-example/communitys.json'

export default {
  name: 'registerSelectCommunity',
  data() {
    return {
      communitys: MyCommunitys,
    }
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
