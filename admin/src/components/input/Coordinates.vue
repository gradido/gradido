<template>
  <div>
    <BFormGroup
      :label="$t('geo-coordinates.label')"
      :invalid-feedback="$t('geo-coordinates.both-or-none')"
      :state="isValid"
    >
      <BFormGroup
        :label="$t('latitude-longitude-smart')"
        label-for="home-community-latitude-longitude-smart"
        :description="$t('geo-coordinates.latitude-longitude-smart.describe')"
      >
        <BFormInput
          id="home-community-latitude-longitude-smart"
          v-model="locationString"
          type="text"
          @input="splitCoordinates"
        />
      </BFormGroup>
      <BFormGroup :label="$t('latitude')" label-for="home-community-latitude">
        <BFormInput
          id="home-community-latitude"
          v-model="inputValue.latitude"
          type="text"
          @input="valueUpdated"
        />
      </BFormGroup>
      <BFormGroup :label="$t('longitude')" label-for="home-community-longitude">
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

<script>
export default {
  name: 'Coordinates',
  props: {
    value: {
      type: Object,
      default: null,
    },
  },
  emits: ['input'],
  data() {
    return {
      inputValue: this.value,
      originalValue: this.value,
      locationString: this.getLatitudeLongitudeString(this.value),
    }
  },
  computed: {
    isValid() {
      return (
        (!isNaN(parseFloat(this.inputValue.longitude)) &&
          !isNaN(parseFloat(this.inputValue.latitude))) ||
        (this.inputValue.longitude === '' && this.inputValue.latitude === '')
      )
    },
    isChanged() {
      return this.inputValue !== this.originalValue
    },
  },
  methods: {
    splitCoordinates(value) {
      // default format for geo-coordinates: 'latitude, longitude'
      const parts = this.locationString.split(',').map((part) => part.trim())

      if (parts.length === 2) {
        const [lat, lon] = parts
        if (!isNaN(parseFloat(lon) && !isNaN(parseFloat(lat)))) {
          this.inputValue.longitude = parseFloat(lon)
          this.inputValue.latitude = parseFloat(lat)
        }
      }
      this.valueUpdated()
    },
    sanitizeLocation(location) {
      if (!location) return { latitude: '', longitude: '' }

      const parseNumber = (value) => {
        const number = parseFloat(value)
        return isNaN(number) ? '' : number
      }

      return {
        latitude: parseNumber(location.latitude),
        longitude: parseNumber(location.longitude),
      }
    },
    getLatitudeLongitudeString({ latitude, longitude } = {}) {
      return latitude && longitude ? this.$t('geo-coordinates.format', { latitude, longitude }) : ''
    },
    valueUpdated() {
      this.locationString = this.getLatitudeLongitudeString(this.inputValue)
      this.inputValue = this.sanitizeLocation(this.inputValue)

      if (this.isValid && this.isChanged) {
        if (this.$parent.valueChanged) {
          this.$parent.valueChanged()
        }
      } else {
        if (this.$parent.invalidValues) {
          this.$parent.invalidValues()
        }
      }

      this.$emit('input', this.inputValue)
    },
  },
}
</script>
