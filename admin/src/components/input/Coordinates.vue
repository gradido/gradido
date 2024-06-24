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
          v-model="latitudeLongitude"
          id="home-community-latitude-longitude-smart"
          type="text"
          @input="splitCoordinates"
        />
      </b-form-group>
      <b-form-group :label="$t('latitude')" label-for="home-community-latitude">
        <b-form-input
          v-model="latitude"
          id="home-community-latitude"
          type="text"
          @input="valueUpdated"
        />
      </b-form-group>
      <b-form-group :label="$t('longitude')" label-for="home-community-longitude">
        <b-form-input
          v-model="longitude"
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
  props: {
    value: Object,
    default: () => ({
      type: 'Point',
      coordinates: [],
    }),
  },
  data() {
    return {
      inputValue: this.value,
      originalValueString: this.getLatitudeLongitudeString(this.value),
      longitude: this.value.coordinates[0],
      latitude: this.value.coordinates[1],
      latitudeLongitude: this.getLatitudeLongitudeString(this.value),
    }
  },
  computed: {
    isValid() {
      return this.inputValue.coordinates.length === 0 || this.inputValue.coordinates.length === 2
    },
    isChanged() {
      return this.getLatitudeLongitudeString(this.inputValue) !== this.originalValueString
    },
  },
  methods: {
    splitCoordinates(value) {
      // format from google maps 'latitude, longitude'
      const parts = value.split(',').map((part) => part.trim())
      // console.log("parts: %o, length: %d", parts, parts.length)

      if (parts.length === 2) {
        const [lat, lon] = parts
        // format in geojson Point: coordinates[longitude, latitude]
        if (!isNaN(parseFloat(lon) && !isNaN(parseFloat(lat)))) {
          this.longitude = parseFloat(lon)
          this.latitude = parseFloat(lat)
        }
      }
      this.valueUpdated()
    },
    getLatitudeLongitudeString(geoJSONPoint) {
      if (geoJSONPoint.coordinates.length !== 2) {
        return ''
      }
      return `${geoJSONPoint.coordinates[1] ?? '0'}, ${geoJSONPoint.coordinates[0] ?? '0'}`
    },
    valueUpdated() {
      this.inputValue.coordinates = [this.longitude, this.latitude]
      this.latitudeLongitude = this.getLatitudeLongitudeString(this.inputValue)

      // make sure all coordinates are numbers
      this.inputValue.coordinates = this.inputValue.coordinates
        .map((coord) => parseFloat(coord))
        // Remove null and NaN values
        .filter((coord) => coord !== null && !isNaN(coord))

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
