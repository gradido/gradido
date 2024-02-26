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
      const selected = this.dropdownOptions.find((option) => option.value === this.selectedOption)
      return selected ? selected.label : this.selectedOption
    },
  },
  methods: {
    async update(option) {
      if (option === this.selectedOption) {
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
.user-gms-location-format > div,
.user-gms-location-format ul.dropdown-menu {
  width: 100%;
}
.user-gms-location-format > div > button {
  border-radius: 17px;
  height: 50px;
  text-align: left;
}
.user-gms-location-format .dropdown-toggle::after {
  float: right;
  top: 50%;
  transform: translateY(-50%);
  position: relative;
}
</style>
