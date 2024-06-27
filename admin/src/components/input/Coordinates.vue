<template>
  <div>
    <b-form-group
      :label="$t('geo-coordinates.label')"
      :invalid-feedback="$t('geo-coordinates.both-or-none')"
      :state="isValid"
    >
      <b-form-group
        :label="$t('latitude-longitude-smart')"
        label-for="home-community-latitude-longitude-smart"
        :description="$t('geo-coordinates.latitude-longitude-smart.describe')"
      >
        <b-form-input
          v-model="locationString"
          id="home-community-latitude-longitude-smart"
          type="text"
          @input="splitCoordinates"
        />
      </b-form-group>
      <b-form-group :label="$t('latitude')" label-for="home-community-latitude">
        <b-form-input
          v-model="inputValue.latitude"
          id="home-community-latitude"
          type="text"
          @input="valueUpdated"
        />
      </b-form-group>
      <b-form-group :label="$t('longitude')" label-for="home-community-longitude">
        <b-form-input
          v-model="inputValue.longitude"
          id="home-community-longitude"
          type="text"
          @input="valueUpdated"
        />
      </b-form-group>
    </b-form-group>
  </div>
</template>

<script>
export default {
  name: 'Coordinates',
  props: {
    value: Object,
    default: null,
  },
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
      const parts = value.split(',').map((part) => part.trim())

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
    valueUpdated(value) {
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
