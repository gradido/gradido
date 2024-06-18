<template>
  <div>
    <b-form-group 
      :label="$t('geo-coordinates.label')"
      :invalid-feedback="$t('geo-coordinates.both-or-none')"
      :state="isValid"
      >
      <b-form-group
        :label="$t('latitude')"
        label-for="home-community-latitude"
        :description="$t('geo-coordinates.latitude.describe')"
      >
        <b-form-input
          v-model="inputValue.coordinates[1]"
          id="home-community-latitude"
          type="text"
          @input="splitCoordinates"
        />
      </b-form-group>
      <b-form-group :label="$t('longitude')" label-for="home-community-longitude">
        <b-form-input
          v-model="inputValue.coordinates[0]"
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
    }
  },
  created() {
    console.log("created value: %o, inputValue: %o", this.value, this.inputValue)
  },
  computed: {
    isValid() {
      return this.inputValue.coordinates.length === 0 || this.inputValue.coordinates.length === 2
    }
  },
  methods: {
    splitCoordinates(value) {
      // format from google maps 'longitude, latitude'
      const parts = value.split(',').map((part) => part.trim())

      if (parts.length === 2) {
        const [lat, lon] = parts
        // format in geojson Point: coordinates[longitude, latitude]
        if (!isNaN(parseFloat(lon) && !isNaN(parseFloat(lat)))) {
          this.inputValue.coordinates[0] = parseFloat(lon)
          this.inputValue.coordinates[1] = parseFloat(lat)
        }
      }
      this.valueUpdated()
    },
    valueUpdated() {
      // make sure all coordinates are numbers
      this.inputValue.coordinates = this.inputValue.coordinates
        .map((coord) => parseFloat(coord))
        // Remove null and NaN values
        .filter((coord) => coord !== null && !isNaN(coord))

      if (this.isValid) {
        if (this.$parent.valueChanged) {
          this.$parent.valueChanged()
        }
      } else {
        if (this.$parent.invalidValues) {
          this.$parent.invalidValues();
        }
      }

      this.$emit('input', this.inputValue)
    },
  },
}
</script>
