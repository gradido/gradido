<template>
  <div class="mb-4">
    <BFormGroup
      :label="t('geo-coordinates.label')"
      :invalid-feedback="t('geo-coordinates.both-or-none')"
      :state="isValid"
    >
      <BFormGroup
        :label="t('latitude-longitude-smart')"
        label-for="home-community-latitude-longitude-smart"
        :description="t('geo-coordinates.latitude-longitude-smart.describe')"
      >
        <BFormInput
          id="home-community-latitude-longitude-smart"
          v-model="locationString"
          type="text"
          @input="splitCoordinates"
        />
      </BFormGroup>
      <BFormGroup :label="t('latitude')" label-for="home-community-latitude">
        <BFormInput
          id="home-community-latitude"
          v-model="inputValue.latitude"
          type="text"
          @input="valueUpdated"
        />
      </BFormGroup>
      <BFormGroup :label="t('longitude')" label-for="home-community-longitude">
        <BFormInput
          id="home-community-longitude"
          v-model="inputValue.longitude"
          type="text"
          @input="valueUpdated"
        />
      </BFormGroup>
    </BFormGroup>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { BFormGroup, BFormInput } from 'bootstrap-vue-next'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const editableGroup = inject('editableGroup')

const inputValue = ref(sanitizeLocation(props.modelValue))
const originalValue = ref(props.modelValue)
const locationString = ref(getLatitudeLongitudeString(props.modelValue))

const isValid = computed(() => {
  return (
    (!isNaN(parseFloat(inputValue.value.longitude)) &&
      !isNaN(parseFloat(inputValue.value.latitude))) ||
    (inputValue.value.longitude === '' && inputValue.value.latitude === '')
  )
})

const isChanged = computed(() => {
  return inputValue.value !== originalValue.value
})

function splitCoordinates() {
  const parts = locationString.value.split(',').map((part) => part.trim())

  if (parts.length === 2) {
    const [lat, lon] = parts
    if (!isNaN(parseFloat(lon)) && !isNaN(parseFloat(lat))) {
      inputValue.value.longitude = parseFloat(lon)
      inputValue.value.latitude = parseFloat(lat)
    }
  }
  valueUpdated()
}

function sanitizeLocation(location) {
  if (!location) return { latitude: '', longitude: '' }

  const parseNumber = (value) => {
    const number = parseFloat(value)
    return isNaN(number) ? '' : number
  }

  return {
    latitude: parseNumber(location.latitude),
    longitude: parseNumber(location.longitude),
  }
}

function getLatitudeLongitudeString(locationData) {
  return locationData?.latitude && locationData?.longitude
    ? t('geo-coordinates.format', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      })
    : ''
}

function valueUpdated() {
  locationString.value = getLatitudeLongitudeString(inputValue.value)
  inputValue.value = sanitizeLocation(inputValue.value)

  if (isValid.value && isChanged.value) {
    editableGroup.valueChanged()
  } else {
    editableGroup.invalidValues()
  }

  emit('update:modelValue', inputValue.value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    inputValue.value = sanitizeLocation(newValue)
    originalValue.value = newValue
    locationString.value = getLatitudeLongitudeString(newValue)
  },
)
</script>
