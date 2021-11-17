<template>
  <div class="componente-creation-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <b-form>
        <b-row class="">
          <b-col>
            <b-form-radio
              v-model="radioSelected"
              :value="MonatBevorLast"
              size="lg"
              @change="updateRadioSelected(MonatBevorLast, 0, creation[0])"
            >
              {{ MonatBevorLast }} {{ creation[0] != null ? creation[0] + ' GDD' : '' }}
            </b-form-radio>
          </b-col>
          <b-col>
            <b-form-radio
              v-model="radioSelected"
              :value="MonatLast"
              size="lg"
              @change="updateRadioSelected(MonatLast, 1, creation[1])"
            >
              {{ MonatLast }} {{ creation[1] != null ? creation[1] + ' GDD' : '' }}
            </b-form-radio>
          </b-col>
          <b-col>
            <b-form-radio
              v-model="radioSelected"
              :value="MonatAktuell"
              size="lg"
              @change="updateRadioSelected(MonatAktuell, 2, creation[2])"
            >
              {{ MonatAktuell }} {{ creation[2] != null ? creation[2] + ' GDD' : '' }}
            </b-form-radio>
          </b-col>
        </b-row>
        <b-row class="m-4">
          <label for="range-2 h4">
            Betrag Auswählen
            <span class="mt-2 h3" v-if="value > 0">{{ value }} GDD</span>
          </label>
          <b-input
            id="range-2"
            v-model="value"
            type="range"
            :min="rangeMin"
            :max="rangeMax"
            step="10"
            class="mr-4 ml-4"
          ></b-input>
        </b-row>
        <b-row class="m-4">
          <div>
            <b-form-textarea
              id="textarea-state"
              v-model="text"
              :state="text.length >= 10"
              placeholder="Enter at least 10 characters"
              rows="3"
            ></b-form-textarea>
          </div>
        </b-row>
        <b-row class="m-4">
          <b-col class="text-center">
            <b-button type="reset" variant="danger">Reset</b-button>
          </b-col>
          <b-col class="text-center">
            <div class="text-right">
              <b-button type="submit" variant="primary">Submit ({{ type }})</b-button>
            </div>
          </b-col>
        </b-row>
      </b-form>
    </div>
  </div>
</template>
<script>
export default {
  name: 'CreationFormular',
  props: ['type', 'creation'],
  data() {
    return {
      radioSelected: '',
      text: 'datatext',
      value: 0,
      rangeMin: 0,
      rangeMax: 1000,
      MonatAktuell: this.$moment().format('MMMM'),
      MonatLast: this.$moment().subtract(1, 'month').format('MMMM'),
      MonatBevorLast: this.$moment().subtract(2, 'month').format('MMMM'),
    }
  },
  created() {},
  methods: {
    updateRadioSelected(name, index, openCreation) {
      // console.log(
      //  'CreationFormular.vue updateRadioSelected(' + name + ',' + index + ', ' + openCreation + ')',
      // )
      if (this.type === 'massCreation') {
        // console.log("updateRadioSelected type=> '", this.type)

        this.$emit('update-radio-selected', [name, index])
      } else {
        // console.log("updateRadioSelected type=> '", this.type)

        this.rangeMin = 0
        this.rangeMax = openCreation

        // console.log("this.rangeMax => '", this.rangeMax)
      }
    },
  },
}
</script>
