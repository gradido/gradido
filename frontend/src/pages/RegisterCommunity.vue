<template>
  <div id="register-community">
    <!-- Header -->
    <div class="p-3">
      <b-container>
        <div class="text-center mb-7 header">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="8" class="px-2">
              <h1>{{ CONFIG.COMMUNITY_NAME }}</h1>
              <p class="text-lead">
                {{ CONFIG.COMMUNITY_DESCRIPTION }}
              </p>
              <p class="text-lead community-location">
                {{ CONFIG.COMMUNITY_URL }}
              </p>
            </b-col>
          </b-row>
          <b-row>
            <b-col class="text-center">
              <router-link to="/register">
                <b-button variant="outline-secondary">
                  {{ $t('community.continue-to-registration') }}
                </b-button>
              </router-link>
            </b-col>
          </b-row>

          <hr />
          <b-row>
            <b-col class="text-center">
              <router-link to="/select-community">
                <b-button variant="outline-secondary">
                  {{ $t('community.choose-another-community') }}
                </b-button>
              </router-link>
            </b-col>
          </b-row>
          <hr />
          <b-row>
            <b-col class="text-center">
              <router-link to="/login">
                <b-button variant="outline-secondary">{{ $t('back') }}</b-button>
              </router-link>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </div>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'RegisterCommunity',
  data() {
    return {
      CONFIG,
    }
  },
}
</script>
