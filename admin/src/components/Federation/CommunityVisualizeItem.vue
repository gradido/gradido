<template>
  <div class="community-visualize-item">
    <BRow v-on="{ click: toggleDetails }">
      <BCol cols="1">
        <variant-icon :icon="icon" :variant="variant" />
      </BCol>
      <BCol>
        <div>
          <a :href="item.url" target="_blank">{{ item.url }}</a>
        </div>
        <small>{{ `${item.publicKey.substring(0, 26)}…` }}</small>
      </BCol>
      <BCol>
        <span v-b-tooltip="`${item.description}`">{{ item.name }}</span>
      </BCol>
      <BCol cols="2">{{ lastAnnouncedAt }}</BCol>
      <BCol cols="2">{{ createdAt }}</BCol>
    </BRow>
    <BRow v-if="details" class="details">
      <BCol colspan="5">
        <BListGroup>
          <BListGroupItem v-if="item.uuid">
            {{ $t('federation.communityUuid') }}&nbsp;{{ item.uuid }}
          </BListGroupItem>
          <BListGroupItem v-if="item.authenticatedAt">
            {{ $t('federation.authenticatedAt') }}&nbsp;{{ item.authenticatedAt }}
          </BListGroupItem>
          <BListGroupItem>
            {{ $t('federation.publicKey') }}&nbsp;{{ item.publicKey }}
          </BListGroupItem>
          <BListGroupItem v-if="!item.foreign">
            <editable-group
              :allow-edit="$store.state.moderator.roles.includes('ADMIN')"
              @save="handleUpdateHomeCommunity"
              @reset="resetHomeCommunityEditable"
            >
              <template #view>
                <label>{{ $t('federation.gmsApiKey') }}&nbsp;{{ gmsApiKey }}</label>
                <BFormGroup>
                  {{ $t('federation.coordinates') }}
                  <span v-if="isValidLocation">
                    {{
                      $t('geo-coordinates.format', {
                        latitude: location.latitude,
                        longitude: location.longitude,
                      })
                    }}
                  </span>
                </BFormGroup>
              </template>
              <template #edit>
                <editable-groupable-label
                  v-model="gmsApiKey"
                  :label="$t('federation.gmsApiKey')"
                  id-name="home-community-api-key"
                />
                <coordinates v-model="location" />
              </template>
            </editable-group>
          </BListGroupItem>
          <BListGroup-item>
            <BListGroup>
              <BRow>
                <BCol class="ms-1">{{ $t('federation.verified') }}</BCol>
                <BCol>{{ $t('federation.apiVersion') }}</BCol>
                <BCol>{{ $t('federation.createdAt') }}</BCol>
                <BCol>{{ $t('federation.lastAnnouncedAt') }}</BCol>
                <BCol>{{ $t('federation.verifiedAt') }}</BCol>
                <BCol>{{ $t('federation.lastErrorAt') }}</BCol>
              </BRow>
              <BListGroup-item
                v-for="federation in item.federatedCommunities"
                :key="federation.id"
                :variant="!item.foreign ? 'primary' : 'warning'"
              >
                <federation-visualize-item :item="federation" />
              </BListGroup-item>
            </BListGroup>
          </BListGroup-item>
        </BListGroup>
      </BCol>
    </BRow>
  </div>
</template>

<script setup>
import { ref, computed, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { formatDistanceToNow } from 'date-fns'
import { de, enUS as en, fr, es, nl } from 'date-fns/locale'
import EditableGroup from '@/components/input/EditableGroup.vue'
import FederationVisualizeItem from './FederationVisualizeItem.vue'
import { updateHomeCommunity } from '@/graphql/updateHomeCommunity'
import Coordinates from '../input/Coordinates.vue'
import EditableGroupableLabel from '../input/EditableGroupableLabel.vue'
import { useAppToast } from '@/composables/useToast'

const locales = { en, de, es, fr, nl }

const props = defineProps({
  item: { type: Object, required: true },
})

const { item } = toRefs(props)

const { t, locale } = useI18n()

const { toastSuccess, toastError } = useAppToast()

const details = ref(false)
const gmsApiKey = ref(item.value.gmsApiKey)
const location = ref(item.value.location)
const originalGmsApiKey = ref(item.value.gmsApiKey)
const originalLocation = ref(item.value.location)

const { mutate: updateHomeCommunityMutation } = useMutation(updateHomeCommunity)

const verified = computed(() => {
  if (!item.value.federatedCommunities || item.value.federatedCommunities.length === 0) {
    return false
  }
  return item.value.federatedCommunities.some(
    (federatedCommunity) =>
      new Date(federatedCommunity.verifiedAt) >= new Date(federatedCommunity.lastAnnouncedAt),
  )
})

const icon = computed(() => (verified.value ? 'check' : 'x-circle'))
const variant = computed(() => (verified.value ? 'success' : 'danger'))

const lastAnnouncedAt = computed(() => {
  if (!item.value.federatedCommunities || item.value.federatedCommunities.length === 0) return ''
  const minDate = new Date(0)
  const lastAnnouncedAt = item.value.federatedCommunities.reduce(
    (lastAnnouncedAt, federateCommunity) => {
      if (!federateCommunity.lastAnnouncedAt) return lastAnnouncedAt
      const date = new Date(federateCommunity.lastAnnouncedAt)
      return date > lastAnnouncedAt ? date : lastAnnouncedAt
    },
    minDate,
  )
  if (lastAnnouncedAt !== minDate) {
    return formatDistanceToNow(lastAnnouncedAt, {
      includeSecond: true,
      addSuffix: true,
      locale: locales[locale.value],
    })
  }
  return ''
})

const createdAt = computed(() => {
  if (item.value.createdAt) {
    return formatDistanceToNow(new Date(item.value.createdAt), {
      includeSecond: true,
      addSuffix: true,
      locale: locales[locale.value],
    })
  }
  return ''
})

const isLocationChanged = computed(() => originalLocation.value !== location.value)
const isGMSApiKeyChanged = computed(() => originalGmsApiKey.value !== gmsApiKey.value)
const isValidLocation = computed(
  () => location.value && location.value.latitude && location.value.longitude,
)

const toggleDetails = () => {
  details.value = !details.value
}

const handleUpdateHomeCommunity = async () => {
  try {
    await updateHomeCommunityMutation({
      variables: {
        uuid: item.value.uuid,
        gmsApiKey: gmsApiKey.value,
        location: location.value,
      },
    })

    if (isLocationChanged.value && isGMSApiKeyChanged.value) {
      toastSuccess(t('federation.toast_gmsApiKeyAndLocationUpdated'))
    } else if (isGMSApiKeyChanged.value) {
      toastSuccess(t('federation.toast_gmsApiKeyUpdated'))
    } else if (isLocationChanged.value) {
      toastSuccess(t('federation.toast_gmsLocationUpdated'))
    }
    originalLocation.value = location.value
    originalGmsApiKey.value = gmsApiKey.value
  } catch (error) {
    toastError(error.message)
  }
}

const resetHomeCommunityEditable = () => {
  location.value = originalLocation.value
  gmsApiKey.value = originalGmsApiKey.value
}
</script>

<!--<script>-->
<!--import { formatDistanceToNow } from 'date-fns'-->
<!--import { de, enUS as en, fr, es, nl } from 'date-fns/locale'-->
<!--import EditableGroup from '@/components/input/EditableGroup'-->
<!--import FederationVisualizeItem from './FederationVisualizeItem.vue'-->
<!--import { updateHomeCommunity } from '../../graphql/updateHomeCommunity'-->
<!--import Coordinates from '../input/Coordinates.vue'-->
<!--import EditableGroupableLabel from '../input/EditableGroupableLabel.vue'-->

<!--const locales = { en, de, es, fr, nl }-->

<!--export default {-->
<!--  name: 'CommunityVisualizeItem',-->
<!--  components: {-->
<!--    Coordinates,-->
<!--    EditableGroup,-->
<!--    FederationVisualizeItem,-->
<!--    EditableGroupableLabel,-->
<!--  },-->
<!--  props: {-->
<!--    item: { type: Object },-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      formatDistanceToNow,-->
<!--      locale: this.$i18n.locale,-->
<!--      details: false,-->
<!--      gmsApiKey: this.item.gmsApiKey,-->
<!--      location: this.item.location,-->
<!--      originalGmsApiKey: this.item.gmsApiKey,-->
<!--      originalLocation: this.item.location,-->
<!--    }-->
<!--  },-->
<!--  computed: {-->
<!--    verified() {-->
<!--      if (!this.item.federatedCommunities || this.item.federatedCommunities.length === 0) {-->
<!--        return false-->
<!--      }-->
<!--      return (-->
<!--        this.item.federatedCommunities.filter(-->
<!--          (federatedCommunity) =>-->
<!--            new Date(federatedCommunity.verifiedAt) >= new Date(federatedCommunity.lastAnnouncedAt),-->
<!--        ).length > 0-->
<!--      )-->
<!--    },-->
<!--    icon() {-->
<!--      return this.verified ? 'check' : 'x-circle'-->
<!--    },-->
<!--    variant() {-->
<!--      return this.verified ? 'success' : 'danger'-->
<!--    },-->
<!--    lastAnnouncedAt() {-->
<!--      if (!this.item.federatedCommunities || this.item.federatedCommunities.length === 0) return ''-->
<!--      const minDate = new Date(0)-->
<!--      const lastAnnouncedAt = this.item.federatedCommunities.reduce(-->
<!--        (lastAnnouncedAt, federateCommunity) => {-->
<!--          if (!federateCommunity.lastAnnouncedAt) return lastAnnouncedAt-->
<!--          const date = new Date(federateCommunity.lastAnnouncedAt)-->
<!--          return date > lastAnnouncedAt ? date : lastAnnouncedAt-->
<!--        },-->
<!--        minDate,-->
<!--      )-->
<!--      if (lastAnnouncedAt !== minDate) {-->
<!--        return formatDistanceToNow(lastAnnouncedAt, {-->
<!--          includeSecond: true,-->
<!--          addSuffix: true,-->
<!--          locale: locales[this.locale],-->
<!--        })-->
<!--      }-->
<!--      return ''-->
<!--    },-->
<!--    createdAt() {-->
<!--      if (this.item.createdAt) {-->
<!--        return formatDistanceToNow(new Date(this.item.createdAt), {-->
<!--          includeSecond: true,-->
<!--          addSuffix: true,-->
<!--          locale: locales[this.locale],-->
<!--        })-->
<!--      }-->
<!--      return ''-->
<!--    },-->
<!--    isLocationChanged() {-->
<!--      return this.originalLocation !== this.location-->
<!--    },-->
<!--    isGMSApiKeyChanged() {-->
<!--      return this.originalGmsApiKey !== this.gmsApiKey-->
<!--    },-->
<!--    isValidLocation() {-->
<!--      return this.location && this.location.latitude && this.location.longitude-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    toggleDetails() {-->
<!--      this.details = !this.details-->
<!--    },-->
<!--    handleUpdateHomeCommunity() {-->
<!--      this.$apollo-->
<!--        .mutate({-->
<!--          mutation: updateHomeCommunity,-->
<!--          variables: {-->
<!--            uuid: this.item.uuid,-->
<!--            gmsApiKey: this.gmsApiKey,-->
<!--            location: this.location,-->
<!--          },-->
<!--        })-->
<!--        .then(() => {-->
<!--          if (this.isLocationChanged && this.isGMSApiKeyChanged) {-->
<!--            this.toastSuccess(this.$t('federation.toast_gmsApiKeyAndLocationUpdated'))-->
<!--          } else if (this.isGMSApiKeyChanged) {-->
<!--            this.toastSuccess(this.$t('federation.toast_gmsApiKeyUpdated'))-->
<!--          } else if (this.isLocationChanged) {-->
<!--            this.toastSuccess(this.$t('federation.toast_gmsLocationUpdated'))-->
<!--          }-->
<!--          this.originalLocation = this.location-->
<!--          this.originalGmsApiKey = this.gmsApiKey-->
<!--        })-->
<!--        .catch((error) => {-->
<!--          this.toastError(error.message)-->
<!--        })-->
<!--    },-->
<!--    resetHomeCommunityEditable() {-->
<!--      this.location = this.originalLocation-->
<!--      this.gmsApiKey = this.originalGmsApiKey-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->
