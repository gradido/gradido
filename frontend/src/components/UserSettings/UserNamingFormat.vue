<template>
  <div class="user-naming-format">
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
  name: 'UserNamingFormat',
  props: {
    initialValue: { type: String, default: 'PUBLISH_NAME_ALIAS_OR_INITALS' },
    attrName: { type: String },
    successMessage: { type: String },
  },
  data() {
    return {
      selectedOption: this.initialValue,
      dropdownOptions: [
        {
          label: this.$t('settings.publish-name.alias-or-initials'),
          title: this.$t('settings.publish-name.alias-or-initials-tooltip'),
          value: 'PUBLISH_NAME_ALIAS_OR_INITALS',
        },
        {
          label: this.$t('settings.publish-name.initials'),
          title: this.$t('settings.publish-name.initials-tooltip'),
          value: 'PUBLISH_NAME_INITIALS',
        },
        {
          label: this.$t('settings.publish-name.first'),
          title: this.$t('settings.publish-name.first-tooltip'),
          value: 'PUBLISH_NAME_FIRST',
        },
        {
          label: this.$t('settings.publish-name.first-initial'),
          title: this.$t('settings.publish-name.first-initial-tooltip'),
          value: 'PUBLISH_NAME_FIRST_INITIAL',
        },
        {
          label: this.$t('settings.publish-name.name-full'),
          title: this.$t('settings.publish-name.name-full-tooltip'),
          value: 'PUBLISH_NAME_FULL',
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
        const variables = []
        variables[this.attrName] = option.value
        await this.$apollo.mutate({
          mutation: updateUserInfos,
          variables,
        })
        this.toastSuccess(this.successMessage)
        this.selectedOption = option.value
        this.$store.commit(this.attrName, option.value)
        this.$emit('valueChanged', option.value)
      } catch (error) {
        this.toastError(error.message)
      }
    },
  },
}
</script>
<style>
.user-naming-format > .dropdown,
.user-naming-format > .dropdown > .dropdown-toggle > ul.dropdown-menu {
  width: 100%;
}
</style>
