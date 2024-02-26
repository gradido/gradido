<template>
  <div class="user-gms-naming-format">
    <b-dropdown v-model="selectedOption">
      <template slot="button-content">{{ selectedOptionLabel }}</template>
      <b-dropdown-item
        v-for="option in dropdownOptions"
        @click.prevent="update(option)"
        :key="option.value"
        :value="option.value"
        :title="option.title"
      >
        {{ option.label }}
      </b-dropdown-item>
    </b-dropdown>
  </div>
</template>
<script>
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'UserGMSNamingFormat',
  data() {
    return {
      selectedOption: this.$store.state.gmsPublishName ?? 'GMS_PUBLISH_NAME_ALIAS_OR_INITALS',
      dropdownOptions: [
        {
          label: this.$t('settings.GMS.publish-name.alias-or-initials'),
          title: this.$t('settings.GMS.publish-name.alias-or-initials-tooltip'),
          value: 'GMS_PUBLISH_NAME_ALIAS_OR_INITALS',
        },
        {
          label: this.$t('settings.GMS.publish-name.initials'),
          title: this.$t('settings.GMS.publish-name.initials-tooltip'),
          value: 'GMS_PUBLISH_NAME_INITIALS',
        },
        {
          label: this.$t('settings.GMS.publish-name.first'),
          title: this.$t('settings.GMS.publish-name.first-tooltip'),
          value: 'GMS_PUBLISH_NAME_FIRST',
        },
        {
          label: this.$t('settings.GMS.publish-name.first-initial'),
          title: this.$t('settings.GMS.publish-name.first-initial-tooltip'),
          value: 'GMS_PUBLISH_NAME_FIRST_INITIAL',
        },
        {
          label: this.$t('settings.GMS.publish-name.name-full'),
          title: this.$t('settings.GMS.publish-name.name-full-tooltip'),
          value: 'GMS_PUBLISH_NAME_FULL',
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
            gmsPublishName: option.value,
          },
        })
        this.toastSuccess(this.$t('settings.GMS.publish-name.updated'))
        this.selectedOption = option.value
        this.$store.commit('gmsPublishName', option.value)
        this.$emit('gmsPublishName', option.value)
      } catch (error) {
        this.toastError(error.message)
      }
    },
  },
}
</script>
<style>
.user-gms-naming-format > div,
.user-gms-naming-format ul.dropdown-menu {
  width: 100%;
}
.user-gms-naming-format > div > button {
  border-radius: 17px;
  height: 50px;
  text-align: left;
}
.user-gms-naming-format .dropdown-toggle::after {
  float: right;
  top: 50%;
  transform: translateY(-50%);
  position: relative;
}
</style>
