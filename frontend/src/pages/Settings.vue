<template>
  <div class="card bg-white gradido-border-radius app-box-shadow p-4 mt--3">
    <b-tabs v-model="tabIndex" content-class="mt-3">
      <b-tab :title="$t('PersonalDetails')">
        <div class="h2">{{ $t('PersonalDetails') }}</div>
        <div class="my-4 text-small">
          {{ $t('settings.info') }}
        </div>

        <BRow>
          <BCol cols="12" md="6" lg="6">
            <user-name />
          </BCol>
          <BCol cols="12" md="6" lg="6">
            <b-form-group :label="$t('form.email')" :description="$t('settings.emailInfo')">
              <b-form-input v-model="email" readonly></b-form-input>
            </b-form-group>
          </BCol>
        </BRow>

        <hr />
        <b-form>
          <BRow class="mt-3">
            <BCol cols="12" md="6" lg="6">
              <label>{{ $t('form.firstname') }}</label>
              <b-form-input
                v-model="firstName"
                :placeholder="$t('settings.name.enterFirstname')"
                data-test="firstname"
                trim
              ></b-form-input>
            </BCol>
            <BCol cols="12" md="6" lg="6">
              <label>{{ $t('form.lastname') }}</label>
              <b-form-input
                v-model="lastName"
                :placeholder="$t('settings.name.enterLastname')"
                data-test="lastname"
                trim
              ></b-form-input>
            </BCol>
          </BRow>
          <div v-if="!isDisabled" class="mt-4 pt-4 text-center">
            <b-button
              type="submit"
              variant="primary"
              data-test="submit-userdata"
              @click.prevent="onSubmit"
            >
              {{ $t('form.save') }}
            </b-button>
          </div>
        </b-form>
        <hr />
        <BRow>
          <BCol cols="12" md="6" lg="6">{{ $t('language') }}</BCol>
          <BCol cols="12" md="6" lg="6" class="text-right">
            <user-language />
          </BCol>
        </BRow>

        <hr />
        <div class="mt-5">{{ $t('form.password') }}</div>
        <user-password />
        <hr />
        <BRow class="mb-5">
          <BCol cols="12" md="6" lg="6">
            {{ $t('settings.newsletter.newsletter') }}
            <div class="text-small">
              {{
                newsletterState
                  ? $t('settings.newsletter.newsletterTrue')
                  : $t('settings.newsletter.newsletterFalse')
              }}
            </div>
          </BCol>
          <BCol cols="12" md="6" lg="6" class="text-right">
            <user-newsletter />
          </BCol>
        </BRow>
      </b-tab>
      <div v-if="isCommunityService">
        <b-tab class="community-service-tabs" :title="$t('settings.community')">
          <div class="h2">{{ $t('settings.allow-community-services') }}</div>
          <div v-if="isHumhub" class="mt-3">
            <BRow>
              <BCol cols="12" md="6" lg="6">
                <div class="h3">{{ $t('Humhub.title') }}</div>
              </BCol>
              <BCol cols="12" md="6" lg="6" class="text-right">
                <user-settings-switch
                  :initial-value="$store.state.humhubAllowed"
                  :attr-name="'humhubAllowed'"
                  :disabled="isHumhubActivated"
                  :enabled-text="$t('settings.humhub.enabled')"
                  :disabled-text="$t('settings.humhub.disabled')"
                  :not-allowed-text="$t('settings.humhub.delete-disabled')"
                  @value-changed="humhubStateSwitch"
                />
              </BCol>
            </BRow>
            <div class="h4">{{ $t('Humhub.desc') }}</div>
            <BRow v-if="humhubAllowed" class="mb-4 humhub-publish-name-row">
              <BCol cols="12" md="6" lg="6">
                {{ $t('settings.humhub.naming-format') }}
              </BCol>
              <BCol cols="12" md="6" lg="6">
                <user-naming-format
                  :initial-value="$store.state.humhubPublishName"
                  :attr-name="'humhubPublishName'"
                  :success-message="$t('settings.humhub.publish-name.updated')"
                />
              </BCol>
            </BRow>
          </div>
          <div v-if="isGMS" class="mt-3">
            <BRow>
              <BCol cols="12" md="6" lg="6">
                <div class="h3">{{ $t('GMS.title') }}</div>
              </BCol>
              <BCol cols="12" md="6" lg="6" class="text-right">
                <user-settings-switch
                  :initial-value="$store.state.gmsAllowed"
                  :attr-name="'gmsAllowed'"
                  :enabled-text="$t('settings.GMS.enabled')"
                  :disabled-text="$t('settings.GMS.disabled')"
                  @value-changed="gmsStateSwitch"
                />
              </BCol>
            </BRow>
            <div class="h4 mt-3">{{ $t('GMS.desc') }}</div>
            <div v-if="gmsAllowed">
              <BRow class="mb-4">
                <BCol cols="12" md="6" lg="6">
                  {{ $t('settings.GMS.naming-format') }}
                </BCol>
                <BCol cols="12" md="6" lg="6">
                  <user-naming-format
                    :initial-value="$store.state.gmsPublishName"
                    :attr-name="'gmsPublishName'"
                    :success-message="$t('settings.GMS.publish-name.updated')"
                  />
                </BCol>
              </BRow>
              <BRow class="mb-4">
                <BCol cols="12" md="6" lg="6">
                  {{ $t('settings.GMS.location-format') }}
                </BCol>
                <BCol cols="12" md="6" lg="6">
                  <user-g-m-s-location-format />
                </BCol>
              </BRow>
              <BRow class="mb-5">
                <BCol cols="12" md="6" lg="6">
                  {{ $t('settings.GMS.location.label') }}
                </BCol>
                <BCol cols="12" md="6" lg="6">
                  <user-g-m-s-location />
                </BCol>
              </BRow>
            </div>
          </div>
          <div v-else>
            <BRow>
              <BCol cols="12" md="6" lg="6">
                <div class="h3 text-muted">{{ $t('GMS.title') }}</div>
              </BCol>
              <BCol cols="12" md="6" lg="6" class="text-right">
                <user-settings-switch :disabled="true" />
              </BCol>
            </BRow>
            <div class="h4 mt-3 text-muted">{{ $t('GMS.desc') }}</div>
          </div>
        </b-tab>
      </div>
    </b-tabs>

    <!-- TODO<BRow>
      <BCol cols="12" md="6" lg="6">{{ $t('settings.darkMode') }}</BCol>
      <BCol cols="12" md="6" lg="6" class="text-right">
        <b-form-checkbox v-model="darkMode" name="dark-mode" switch aligne></b-form-checkbox>
      </BCol>
    </BRow> -->
  </div>
</template>
<script>
import UserNamingFormat from '@/components/UserSettings/UserNamingFormat'
import UserGMSLocationFormat from '@/components/UserSettings/UserGMSLocationFormat'
import UserGMSLocation from '@/components/UserSettings/UserGMSLocation'
import UserName from '@/components/UserSettings/UserName.vue'
import UserPassword from '@/components/UserSettings/UserPassword'
import UserLanguage from '@/components/LanguageSwitch2.vue'
import UserNewsletter from '@/components/UserSettings/UserNewsletter.vue'
import UserSettingsSwitch from '../components/UserSettings/UserSettingsSwitch.vue'
import { updateUserInfos } from '@/graphql/mutations'
import CONFIG from '../config'

export default {
  name: 'Profile',
  components: {
    UserNamingFormat,
    UserGMSLocationFormat,
    UserGMSLocation,
    UserName,
    UserPassword,
    UserLanguage,
    UserNewsletter,
    UserSettingsSwitch,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },

  data() {
    const { state } = this.$store
    const { darkMode, firstName, lastName, email, newsletterState, gmsAllowed, humhubAllowed } =
      state

    const username = this.$store.state.username || ''
    let tabIndex = 0
    if (this.$route.params.tabAlias === 'extern') {
      tabIndex = 1
    }

    return {
      darkMode,
      username,
      firstName,
      lastName,
      email,
      newsletterState,
      gmsAllowed,
      humhubAllowed,
      mutation: '',
      variables: {},
      tabIndex,
    }
  },

  computed: {
    isDisabled() {
      const { firstName, lastName } = this.$store.state
      return firstName === this.firstName && lastName === this.lastName
    },
    isHumhubActivated() {
      return this.humhubAllowed === true
    },
    isCommunityService() {
      return this.isGMS || this.isHumhub
    },
    isGMS() {
      return CONFIG.GMS_ACTIVE === 'true'
    },
    isHumhub() {
      return CONFIG.HUMHUB_ACTIVE === 'true'
    },
  },
  // TODO: watch: {
  //   darkMode(val) {
  //     this.$store.commit('setDarkMode', this.darkMode)
  //     this.toastSuccess(
  //       this.darkMode ? this.$t('settings.modeDark') : this.$t('settings.modeLight'),
  //     )
  //   },
  // },
  methods: {
    async onSubmit(key) {
      try {
        await this.$apollo.mutate({
          mutation: updateUserInfos,
          variables: {
            firstName: this.firstName,
            lastName: this.lastName,
          },
        })
        this.$store.commit('firstName', this.firstName)
        this.$store.commit('lastName', this.lastName)
        this.showUserData = true
        this.toastSuccess(this.$t('settings.name.change-success'))
      } catch (error) {}
    },
    gmsStateSwitch(eventData) {
      this.gmsAllowed = eventData
    },
    humhubStateSwitch(eventData) {
      this.humhubAllowed = eventData
    },
  },
}
</script>
<style>
.community-service-tabs {
  min-height: 315px;
}

.card-border-radius {
  border-radius: 0 5px 5px 0 !important;
}

@media screen and (width <= 1235px) {
  .card-border-radius {
    border-radius: 0 !important;
  }
}

.card-background-gray {
  background-color: #ebebeba3 !important;
}
</style>
