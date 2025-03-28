<template>
  <div class="user-gms-location-format">
    <BDropdown :text="selectedOptionLabel">
      <BDropdownItem
        v-for="option in dropdownOptions"
        :key="option.value"
        :value="option.value"
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
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next'
import { useAppToast } from '@/composables/useToast'

const { t } = useI18n()
const store = useStore()
const { toastError, toastSuccess } = useAppToast()

const selectedOption = ref(
  store.state.gmsPublishLocation === 'GMS_LOCATION_TYPE_RANDOM'
    ? 'GMS_LOCATION_TYPE_APPROXIMATE'
    : store.state.gmsPublishLocation,
)
const dropdownOptions = [
  {
    label: t('settings.GMS.publish-location.exact'),
    value: 'GMS_LOCATION_TYPE_EXACT',
  },
  {
    label: t('settings.GMS.publish-location.approximate'),
    value: 'GMS_LOCATION_TYPE_APPROXIMATE',
  },
  /*
  {
    label: t('settings.GMS.publish-location.random'),
    value: 'GMS_LOCATION_TYPE_RANDOM',
  },
  */
]

const selectedOptionLabel = computed(() => {
  return dropdownOptions.find((option) => option.value === selectedOption.value)?.label
})

const emit = defineEmits(['gmsPublishLocation'])

const { mutate: updateUserData } = useMutation(updateUserInfos)

const update = async (option) => {
  if (option.value === selectedOption.value) {
    return
  }
  try {
    await updateUserData({
      gmsPublishLocation: option.value,
    })
    toastSuccess(t('settings.GMS.publish-location.updated'))
    selectedOption.value = option.value
    store.commit('gmsPublishLocation', option.value)
    emit('gmsPublishLocation', option.value)
  } catch (error) {
    toastError(error.message)
  }
}
</script>
<style>
.user-gms-location-format > .dropdown,
.user-gms-location-format > .dropdown > .dropdown-toggle > ul.dropdown-menu {
  width: 100%;
}
</style>
