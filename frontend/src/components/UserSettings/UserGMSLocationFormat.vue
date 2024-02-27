<template>
  <div class="user-gms-location-format">
    <b-dropdown v-model="selectedOption">
      <template slot="button-content">{{ selectedOptionLabel }}</template>
      <b-dropdown-item
        v-for="option in dropdownOptions"
        @click.prevent="update(option)"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </b-dropdown-item>
    </b-dropdown>
  </div>
</template>
<script>
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'UserGMSLocationFormat',
  data() {
    return {
      selectedOption: this.$store.state.gmsPublishLocation ?? 'GMS_LOCATION_TYPE_RANDOM',
      dropdownOptions: [
        {
          label: this.$t('settings.GMS.publish-location.exact'),
          value: 'GMS_LOCATION_TYPE_EXACT',
        },
        {
          label: this.$t('settings.GMS.publish-location.approximate'),
          value: 'GMS_LOCATION_TYPE_APPROXIMATE',
        },
        {
          label: this.$t('settings.GMS.publish-location.random'),
          value: 'GMS_LOCATION_TYPE_RANDOM',
        },
      ],
    }
  },
  computed: {
    selectedOptionLabel() {
      return this.dropdownOptions.find((option) => option.value === this.selectedOption).label
    },
  },
  methods: {
    async update(option) {
      if (option.value === this.selectedOption) {
        return
      }
      try {
        await this.$apollo.mutate({
          mutation: updateUserInfos,
          variables: {
            gmsPublishLocation: option.value,
          },
        })
        this.toastSuccess(this.$t('settings.GMS.publish-location.updated'))
        this.selectedOption = option.value
        this.$store.commit('gmsPublishLocation', option.value)
        this.$emit('gmsPublishLocation', option.value)
      } catch (error) {
        this.toastError(error.message)
      }
    },
  },
}
</script>
<style>
.user-gms-location-format > .dropdown,
.user-gms-location-format > .dropdown > .dropdown-toggle > ul.dropdown-menu {
  width: 100%;
}
</style>
