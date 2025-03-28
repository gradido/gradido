<template>
  <div class="card bg-white gradido-border-radius appBoxShadow p-4 mt--3">
    <BTabs :model-value="tabIndex" content-class="mt-3" @update:modelValue="tabIndex = $event">
      <BTab :title="$t('PersonalDetails')">
        <div class="h2">{{ $t('PersonalDetails') }}</div>
        <div class="my-4 text-small">
          {{ $t('settings.info') }}
        </div>

        <BRow>
          <BCol cols="12" md="6" lg="6">
            <user-name />
          </BCol>
          <BCol cols="12" md="6" lg="6">
            <BFormGroup :label="$t('form.email')" :description="$t('settings.emailInfo')">
              <BFormInput :model-value="email" readonly @update:modelValue="email = $event" />
            </BFormGroup>
          </BCol>
        </BRow>

        <hr />
        <BForm>
          <BRow class="mt-3">
            <BCol cols="12" md="6" lg="6">
              <label>{{ $t('form.firstname') }}</label>
              <BFormInput
                :model-value="firstName"
                :placeholder="$t('settings.name.enterFirstname')"
                data-test="firstname"
                trim
                @update:modelValue="firstName = $event"
              />
            </BCol>
            <BCol cols="12" md="6" lg="6">
              <label>{{ $t('form.lastname') }}</label>
              <BFormInput
                :model-value="lastName"
                :placeholder="$t('settings.name.enterLastname')"
                data-test="lastname"
                trim
                @update:modelValue="lastName = $event"
              />
            </BCol>
          </BRow>
          <div v-if="isButtonVisible" class="mt-4 pt-4 text-center">
            <BButton
              type="submit"
              variant="primary"
              data-test="submit-userdata"
              @click.prevent="onSubmit"
            >
              {{ $t('form.save') }}
            </BButton>
          </div>
        </BForm>
        <hr />
        <BRow>
          <BCol cols="12" md="6" lg="6">{{ $t('language') }}</BCol>
          <BCol cols="12" md="6" lg="6" class="text-end">
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
          <BCol cols="12" md="6" lg="6" class="text-end">
            <user-newsletter />
          </BCol>
        </BRow>
      </BTab>
      <BTab
        v-if="isCommunityService"
        class="community-service-tabs"
        :title="$t('settings.community')"
      >
        <div v-if="isHumhub" class="mt-3">
          <BRow>
            <BCol cols="12" md="6" lg="6">
              <div class="h3">{{ $t('Humhub.title') }}</div>
            </BCol>
            <BCol cols="12" md="6" lg="6" class="text-end">
              <user-settings-switch
                :initial-value="state.humhubAllowed"
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
                :initial-value="state.humhubPublishName"
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
            <BCol cols="12" md="6" lg="6" class="text-start">
              <user-settings-switch
                :initial-value="state.gmsAllowed"
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
                  :initial-value="state.gmsPublishName"
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
                <user-gms-location-capturing />
              </BCol>
            </BRow>
          </div>
        </div>
        <div v-else>
          <BRow>
            <BCol cols="12" md="6" lg="6">
              <div class="h3 text-muted">{{ $t('GMS.title') }}</div>
            </BCol>
            <BCol cols="12" md="6" lg="6" class="text-end">
              <user-settings-switch :disabled="true" />
            </BCol>
          </BRow>
          <div class="h4 mt-3 text-muted">{{ $t('GMS.desc') }}</div>
        </div>
      </BTab>
    </BTabs>

    <!-- TODO<BRow>
      <BCol cols="12" md="6" lg="6">{{ $t('settings.darkMode') }}</BCol>
      <BCol cols="12" md="6" lg="6" class="text-end">
        <BForm-checkbox v-model="darkMode" name="dark-mode" switch aligne></BForm-checkbox>
      </BCol>
    </BRow> -->
  </div>
</template>
<script setup>
import CONFIG from '../config'
import { useStore } from 'vuex'
import { updateUserInfos } from '@/graphql/mutations'
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import UserName from '@/components/UserSettings/UserName.vue'
import UserLanguage from '@/components/LanguageSwitch2.vue'
import UserPassword from '@/components/UserSettings/UserPassword'
import UserSettingsSwitch from '../components/UserSettings/UserSettingsSwitch.vue'
import UserNamingFormat from '@/components/UserSettings/UserNamingFormat'
import UserGMSLocationFormat from '@/components/UserSettings/UserGMSLocationFormat'
import UserGmsLocationCapturing from '@/components/UserSettings/UserGmsLocationCapturing'
import UserNewsletter from '@/components/UserSettings/UserNewsletter.vue'
import { BTabs, BTab, BRow, BCol, BFormInput, BFormGroup, BForm, BButton } from 'bootstrap-vue-next'

const props = defineProps({
  balance: { type: Number, default: 0 },
  transactionCount: { type: Number, default: 0 },
})

const route = useRoute()
const { t } = useI18n()
const { toastError, toastSuccess } = useAppToast()
const store = useStore()
const state = store.state

const darkMode = ref(state.darkMode)
const firstName = ref(state.firstName || '')
const email = ref(state.email || '')
const newsletterState = ref(state.newsletterState)
const gmsAllowed = ref(state.gmsAllowed)
const humhubAllowed = ref(state.humhubAllowed)
const username = ref(state.username || '')
const lastName = ref(state.lastName || '')

let tabIndex = 0
if (route.params.tabAlias === 'extern') {
  tabIndex = 1
}

const isButtonVisible = computed(() => {
  return firstName.value !== state.firstName || lastName.value !== state.lastName
})

const isHumhubActivated = computed(() => {
  return humhubAllowed.value === true
})

// setting if gms and/or humhub are enabled in frontend config .env
const isGMS = CONFIG.GMS_ACTIVE
const isHumhub = CONFIG.HUMHUB_ACTIVE
const isCommunityService = isGMS || isHumhub

const { mutate: updateUserData } = useMutation(updateUserInfos)

const onSubmit = async (key) => {
  try {
    await updateUserData({
      firstName: firstName.value,
      lastName: lastName.value,
    })
    store.commit('firstName', firstName.value)
    store.commit('lastName', lastName.value)
    toastSuccess(t('settings.name.change-success'))
  } catch (error) {
    toastError(error)
  }
}

const gmsStateSwitch = (eventData) => {
  gmsAllowed.value = eventData
}

const humhubStateSwitch = (eventData) => {
  humhubAllowed.value = eventData
}

// TODO: watch: {
//   darkMode(val) {
//     this.$store.commit('setDarkMode', this.darkMode)
//     this.toastSuccess(
//       this.darkMode ? this.$t('settings.modeDark') : this.$t('settings.modeLight'),
//     )
//   },
// },
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
<style scoped>
:deep(.form-label) {
  padding-bottom: 0;
}

:deep(.nav-link) {
  color: #383838 !important;
}

:deep(.nav-link.active) {
  color: #525f7f !important;
}
</style>
