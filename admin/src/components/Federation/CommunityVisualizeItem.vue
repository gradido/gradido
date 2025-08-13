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
          <BListGroupItem v-if="item.hieroTopicId && item.foreign">
            {{ $t('federation.hieroTopicId') }}&nbsp;{{ item.hieroTopicId }}
          </BListGroupItem>
          <BListGroupItem v-if="!item.foreign">
            <editable-group
              :allow-edit="$store.state.moderator.roles.includes('ADMIN')"
              @save="handleUpdateHomeCommunity"
              @reset="resetHomeCommunityEditable"
            >
              <template #view>
                <div class="d-flex">
                  <p style="text-wrap: nowrap">{{ $t('federation.gmsApiKey') }}&nbsp;</p>
                  <span class="d-block" style="overflow-x: auto">{{ gmsApiKey }}</span>
                </div>
                <div class="d-flex">
                  <p style="text-wrap: nowrap">{{ $t('federation.hieroTopicId') }}&nbsp;</p>
                  <span class="d-block" style="overflow-x: auto">{{ hieroTopicId }}</span>
                </div>
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
                <editable-groupable-label
                  v-model="hieroTopicId"
                  :label="$t('federation.hieroTopicId')"
                  id-name="home-community-hiero-topic-id"
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
import { useDateLocale } from '@/composables/useDateLocale'
import { useMutation } from '@vue/apollo-composable'
import { formatDistanceToNow } from 'date-fns'
import EditableGroup from '@/components/input/EditableGroup.vue'
import FederationVisualizeItem from './FederationVisualizeItem.vue'
import { updateHomeCommunity } from '@/graphql/updateHomeCommunity'
import Coordinates from '../input/Coordinates.vue'
import EditableGroupableLabel from '../input/EditableGroupableLabel.vue'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  item: { type: Object, required: true },
})

const { item } = toRefs(props)

const { t } = useI18n()

const { toastSuccess, toastError } = useAppToast()

const details = ref(false)
const gmsApiKey = ref(item.value.gmsApiKey)
const hieroTopicId = ref(item.value.hieroTopicId)
const location = ref(item.value.location)
const originalGmsApiKey = ref(item.value.gmsApiKey)
const originalLocation = ref(item.value.location)
const originalHieroTopicId = ref(item.value.hieroTopicId)

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
      locale: useDateLocale(),
    })
  }
  return ''
})

const createdAt = computed(() => {
  if (item.value.createdAt) {
    return formatDistanceToNow(new Date(item.value.createdAt), {
      includeSecond: true,
      addSuffix: true,
      locale: useDateLocale(),
    })
  }
  return ''
})

const isLocationChanged = computed(() => originalLocation.value !== location.value)
const isGMSApiKeyChanged = computed(() => originalGmsApiKey.value !== gmsApiKey.value)
const isHieroTopicIdChanged = computed(() => originalHieroTopicId.value !== hieroTopicId.value)
const isValidLocation = computed(
  () => location.value && location.value.latitude && location.value.longitude,
)

const toggleDetails = () => {
  details.value = !details.value
}

const handleUpdateHomeCommunity = async () => {
  try {
    await updateHomeCommunityMutation({
      uuid: item.value.uuid,
      gmsApiKey: gmsApiKey.value,
      location: location.value,
      hieroTopicId: hieroTopicId.value,
    })

    if (isLocationChanged.value && isGMSApiKeyChanged.value) {
      toastSuccess(t('federation.toast_gmsApiKeyAndLocationUpdated'))
    } else if (isGMSApiKeyChanged.value) {
      toastSuccess(t('federation.toast_gmsApiKeyUpdated'))
    } else if (isLocationChanged.value) {
      toastSuccess(t('federation.toast_gmsLocationUpdated'))
    }
    if (isHieroTopicIdChanged.value) {
      toastSuccess(t('federation.toast_hieroTopicIdUpdated'))
    }
    originalLocation.value = location.value
    originalGmsApiKey.value = gmsApiKey.value
    originalHieroTopicId.value = hieroTopicId.value
  } catch (error) {
    toastError(error.message)
  }
}

const resetHomeCommunityEditable = () => {
  location.value = originalLocation.value
  gmsApiKey.value = originalGmsApiKey.value
  hieroTopicId.value = originalHieroTopicId.value
}
</script>
