<template>
  <div class="card bg-white gradido-border-radius appBoxShadow p-4 mt--3">
    <b-tabs v-model="tabIndex" content-class="mt-3">
      <b-tab :title="$t('PersonalDetails')">
        <div class="h2">{{ $t('PersonalDetails') }}</div>
        <div class="my-4 text-small">
          {{ $t('settings.info') }}
        </div>

        <b-row>
          <b-col cols="12" md="6" lg="6">
            <user-name />
          </b-col>
          <b-col cols="12" md="6" lg="6">
            <b-form-group :label="$t('form.email')" :description="$t('settings.emailInfo')">
              <b-form-input v-model="email" readonly></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>

        <hr />
        <b-form>
          <b-row class="mt-3">
            <b-col cols="12" md="6" lg="6">
              <label>{{ $t('form.firstname') }}</label>
              <b-form-input
                v-model="firstName"
                :placeholder="$t('settings.name.enterFirstname')"
                data-test="firstname"
                trim
              ></b-form-input>
            </b-col>
            <b-col cols="12" md="6" lg="6">
              <label>{{ $t('form.lastname') }}</label>
              <b-form-input
                v-model="lastName"
                :placeholder="$t('settings.name.enterLastname')"
                data-test="lastname"
                trim
              ></b-form-input>
            </b-col>
          </b-row>
          <div v-if="!isDisabled" class="mt-4 pt-4 text-center">
            <b-button
              type="submit"
              variant="primary"
              @click.prevent="onSubmit"
              data-test="submit-userdata"
            >
              {{ $t('form.save') }}
            </b-button>
          </div>
        </b-form>
        <hr />
        <b-row>
          <b-col cols="12" md="6" lg="6">{{ $t('language') }}</b-col>
          <b-col cols="12" md="6" lg="6" class="text-right">
            <user-language />
          </b-col>
        </b-row>

        <hr />
        <div class="mt-5">{{ $t('form.password') }}</div>
        <user-password />
        <hr />
        <b-row class="mb-5">
          <b-col cols="12" md="6" lg="6">
            {{ $t('settings.newsletter.newsletter') }}
            <div class="text-small">
              {{
                newsletterState
                  ? $t('settings.newsletter.newsletterTrue')
                  : $t('settings.newsletter.newsletterFalse')
              }}
            </div>
          </b-col>
          <b-col cols="12" md="6" lg="6" class="text-right">
            <user-newsletter />
          </b-col>
        </b-row>
      </b-tab>
      <div v-if="isCommunityService">
        <b-tab :title="$t('settings.community')">
          <div class="h2">{{ $t('settings.allow-community-services') }}</div>
          <div v-if="isGMS">
            <div class="h3">{{ $t('GMS.title') }}</div>
            <div class="h4">{{ $t('GMS.desc') }}</div>
            <b-row class="mb-3">
              <b-col cols="12" md="6" lg="6">
                {{ $t('settings.GMS.switch') }}
                <div class="text-small">
                  {{ gmsAllowed ? $t('settings.GMS.enabled') : $t('settings.GMS.disabled') }}
                </div>
              </b-col>
              <b-col cols="12" md="6" lg="6" class="text-right">
                <user-settings-switch
                  @valueChanged="gmsStateSwitch"
                  :initialValue="$store.state.gmsAllowed"
                  :attrName="'gmsAllowed'"
                  :enabledText="$t('settings.GMS.enabled')"
                  :disabledText="$t('settings.GMS.disabled')"
                />
              </b-col>
            </b-row>
            <div v-if="gmsAllowed">
              <b-row class="mb-4">
                <b-col cols="12" md="6" lg="6">
                  {{ $t('settings.GMS.naming-format') }}
                </b-col>
                <b-col cols="12" md="6" lg="6">
                  <user-naming-format
                    :initialValue="$store.state.gmsPublishName"
                    :attrName="'gmsPublishName'"
                    :successMessage="$t('settings.GMS.publish-name.updated')"
                  />
                </b-col>
              </b-row>
              <b-row class="mb-4">
                <b-col cols="12" md="6" lg="6">
                  {{ $t('settings.GMS.location-format') }}
                </b-col>
                <b-col cols="12" md="6" lg="6">
                  <user-g-m-s-location-format />
                </b-col>
              </b-row>
              <b-row class="mb-5">
                <b-col cols="12" md="6" lg="6">
                  {{ $t('settings.GMS.location.label') }}
                </b-col>
                <b-col cols="12" md="6" lg="6">
                  <user-g-m-s-location />
                </b-col>
              </b-row>
            </div>
          </div>
          <div v-if="isHumhub">
            <div class="h3">{{ $t('Humhub.title') }}</div>
            <div class="h4">{{ $t('Humhub.desc') }}</div>
            <b-row class="mb-3">
              <b-col cols="12" md="6" lg="6">
                {{ $t('settings.humhub.switch') }}
                <div class="text-small">
                  {{
                    humhubAllowed ? $t('settings.humhub.enabled') : $t('settings.humhub.disabled')
                  }}
                </div>
              </b-col>
              <b-col cols="12" md="6" lg="6" class="text-right">
                <user-settings-switch
                  @valueChanged="humhubStateSwitch"
                  :initialValue="$store.state.humhubAllowed"
                  :attrName="'humhubAllowed'"
                  :enabledText="$t('settings.humhub.enabled')"
                  :disabledText="$t('settings.humhub.disabled')"
                />
              </b-col>
            </b-row>
            <b-row v-if="humhubAllowed" class="mb-4 humhub-publish-name-row">
              <b-col cols="12" md="6" lg="6">
                {{ $t('settings.humhub.naming-format') }}
              </b-col>
              <b-col cols="12" md="6" lg="6">
                <user-naming-format
                  :initialValue="$store.state.humhubPublishName"
                  :attrName="'humhubPublishName'"
                  :successMessage="$t('settings.humhub.publish-name.updated')"
                />
              </b-col>
            </b-row>
          </div>
        </b-tab>
      </div>
    </b-tabs>

    <!-- TODO<b-row>
      <b-col cols="12" md="6" lg="6">{{ $t('settings.darkMode') }}</b-col>
      <b-col cols="12" md="6" lg="6" class="text-right">
        <b-form-checkbox v-model="darkMode" name="dark-mode" switch aligne></b-form-checkbox>
      </b-col>
    </b-row> -->
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
    const {
      darkMode,
      firstName,
      lastName,
      email,
      newsletterState,
      gmsAllowed,
      humhubAllowed,
    } = state

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
    isCommunityService() {
      return this.isGMS || this.isHumhub
    },
    isGMS() {
      return CONFIG.GMS_ACTIVE
    },
    isHumhub() {
      return CONFIG.HUMHUB_ACTIVE
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
.humhub-publish-name-row {
  min-height: 200px;
}
.card-border-radius {
  border-radius: 0px 5px 5px 0px !important;
}
@media screen and (max-width: 1235px) {
  .card-border-radius {
    border-radius: 0px !important;
  }
}
.card-background-gray {
  background-color: #ebebeba3 !important;
}
</style>
