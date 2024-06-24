<template>
  <div class="community-visualize-item">
    <b-row @click="toggleDetails">
      <b-col cols="1"><b-icon :icon="icon" :variant="variant" class="mr-4"></b-icon></b-col>
      <b-col>
        <div>
          <a :href="item.url" target="_blank">{{ item.url }}</a>
        </div>
        <small>{{ `${item.publicKey.substring(0, 26)}…` }}</small>
      </b-col>
      <b-col v-b-tooltip="item.description">{{ item.name }}</b-col>
      <b-col cols="2">{{ lastAnnouncedAt }}</b-col>
      <b-col cols="2">{{ createdAt }}</b-col>
    </b-row>
    <b-row v-if="details" class="details">
      <b-col colspan="5">
        <b-list-group>
          <b-list-group-item v-if="item.uuid">
            {{ $t('federation.communityUuid') }}&nbsp;{{ item.uuid }}
          </b-list-group-item>
          <b-list-group-item v-if="item.authenticatedAt">
            {{ $t('federation.authenticatedAt') }}&nbsp;{{ item.authenticatedAt }}
          </b-list-group-item>
          <b-list-group-item>
            {{ $t('federation.publicKey') }}&nbsp;{{ item.publicKey }}
          </b-list-group-item>
          <b-list-group-item v-if="!item.foreign">
            <editable-group
              :allowEdit="$store.state.moderator.roles.includes('ADMIN')"
              @save="handleUpdateHomeCommunity"
              @reset="resetHomeCommunityEditable"
            >
              <template #view>
                <label>{{ $t('federation.gmsApiKey') }}&nbsp;{{ gmsApiKey }}</label>
                <b-form-group>
                  {{ $t('federation.coordinates') }}&nbsp;{{ item.location.coordinates[1] }}&nbsp;{{
                    item.location.coordinates[0]
                  }}
                </b-form-group>
              </template>
              <template #edit>
                <g-m-s-api-key v-model="gmsApiKey" />
                <coordinates v-model="location" />
              </template>
            </editable-group>
          </b-list-group-item>
          <b-list-group-item>
            <b-list-group>
              <b-row>
                <b-col class="ml-1">{{ $t('federation.verified') }}</b-col>
                <b-col>{{ $t('federation.apiVersion') }}</b-col>
                <b-col>{{ $t('federation.createdAt') }}</b-col>
                <b-col>{{ $t('federation.lastAnnouncedAt') }}</b-col>
                <b-col>{{ $t('federation.verifiedAt') }}</b-col>
                <b-col>{{ $t('federation.lastErrorAt') }}</b-col>
              </b-row>
              <b-list-group-item
                v-for="federation in item.federatedCommunities"
                :key="federation.id"
                :variant="!item.foreign ? 'primary' : 'warning'"
              >
                <federation-visualize-item :item="federation" />
              </b-list-group-item>
            </b-list-group>
          </b-list-group-item>
        </b-list-group>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import { formatDistanceToNow } from 'date-fns'
import { de, enUS as en, fr, es, nl } from 'date-fns/locale'
import EditableGroup from '@/components/input/EditableGroup'
import FederationVisualizeItem from './FederationVisualizeItem.vue'
import { updateHomeCommunity } from '../../graphql/updateHomeCommunity'
import Coordinates from '../input/Coordinates.vue'
import GMSApiKey from './GMSApiKey.vue'

const locales = { en, de, es, fr, nl }

export default {
  name: 'CommunityVisualizeItem',
  components: {
    Coordinates,
    EditableGroup,
    FederationVisualizeItem,
    GMSApiKey,
  },
  props: {
    item: { type: Object },
  },
  data() {
    return {
      formatDistanceToNow,
      locale: this.$i18n.locale,
      details: false,
      gmsApiKey: '',
      location: () => ({
        type: 'Point',
        coordinates: [],
      }),
    }
  },
  created() {
    this.resetHomeCommunityEditable()
  },
  computed: {
    verified() {
      if (!this.item.federatedCommunities || this.item.federatedCommunities.length === 0) {
        return false
      }
      return (
        this.item.federatedCommunities.filter(
          (federatedCommunity) =>
            new Date(federatedCommunity.verifiedAt) >= new Date(federatedCommunity.lastAnnouncedAt),
        ).length > 0
      )
    },
    icon() {
      return this.verified ? 'check' : 'x-circle'
    },
    variant() {
      return this.verified ? 'success' : 'danger'
    },
    lastAnnouncedAt() {
      if (!this.item.federatedCommunities || this.item.federatedCommunities.length === 0) return ''
      const minDate = new Date(0)
      const lastAnnouncedAt = this.item.federatedCommunities.reduce(
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
          locale: locales[this.locale],
        })
      }
      return ''
    },
    createdAt() {
      if (this.item.createdAt) {
        return formatDistanceToNow(new Date(this.item.createdAt), {
          includeSecond: true,
          addSuffix: true,
          locale: locales[this.locale],
        })
      }
      return ''
    },
  },
  methods: {
    toggleDetails() {
      this.details = !this.details
    },
    handleUpdateHomeCommunity() {
      this.$apollo
        .mutate({
          mutation: updateHomeCommunity,
          variables: {
            uuid: this.item.uuid,
            gmsApiKey: this.gmsApiKey,
            location: this.location,
          },
        })
        .then(() => {
          this.toastSuccess(this.$t('federation.toast_gmsApiKeyUpdated'))
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    resetHomeCommunityEditable() {
      this.gmsApiKey = this.item.gmsApiKey
      this.location = this.item.location
    },
  },
}
</script>
