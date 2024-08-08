<template>
  <div class="user-naming-format">
    <BDropdown v-model="selectedOption">
      <template #button-content>{{ selectedOptionLabel }}</template>
      <BDropdownItem
        v-for="option in dropdownOptions"
        :key="option.value"
        :value="option.value"
        :title="option.title"
        @click.prevent="update(option)"
      >
        {{ option.label }}
      </BDropdownItem>
    </BDropdown>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { useMutation } from '@vue/apollo-composable'
import { updateUserInfos } from '@/graphql/mutations'
import { BDropdownItem, BDropdown } from 'bootstrap-vue-next'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()
const store = useStore()
const { toastError } = useAppToast()

const props = defineProps({
  initialValue: { type: String, default: 'PUBLISH_NAME_ALIAS_OR_INITALS' },
  attrName: { type: String },
  successMessage: { type: String },
})

const emit = defineEmits(['valueChanged'])

const selectedOption = ref(props.initialValue)
const dropdownOptions = [
  {
    label: t('settings.publish-name.alias-or-initials'),
    title: t('settings.publish-name.alias-or-initials-tooltip'),
    value: 'PUBLISH_NAME_ALIAS_OR_INITALS',
  },
  {
    label: t('settings.publish-name.initials'),
    title: t('settings.publish-name.initials-tooltip'),
    value: 'PUBLISH_NAME_INITIALS',
  },
  {
    label: t('settings.publish-name.first'),
    title: t('settings.publish-name.first-tooltip'),
    value: 'PUBLISH_NAME_FIRST',
  },
  {
    label: t('settings.publish-name.first-initial'),
    title: t('settings.publish-name.first-initial-tooltip'),
    value: 'PUBLISH_NAME_FIRST_INITIAL',
  },
  {
    label: t('settings.publish-name.name-full'),
    title: t('settings.publish-name.name-full-tooltip'),
    value: 'PUBLISH_NAME_FULL',
  },
]

const selectedOptionLabel = computed(() => {
  const selected = dropdownOptions.find((option) => option.value === selectedOption.value)?.label
  return selected || t('settings.publish-name.alias-or-initials')
})

const { mutate: updateUserData } = useMutation(updateUserInfos)

const update = async (option) => {
  if (option.value === selectedOption.value) {
    return
  }
  try {
    const variables = {}
    variables[props.attrName] = option.value
    await updateUserData({ variables })
    toastSuccess(props.successMessage)
    selectedOption.value = option.value
    store.commit(props.attrName, option.value)
    emit('valueChanged', option.value)
  } catch (error) {
    toastError(error.message)
  }
}
</script>
<style>
.user-naming-format > .dropdown,
.user-naming-format > .dropdown > .dropdown-toggle > ul.dropdown-menu {
  width: 100%;
}
</style>
