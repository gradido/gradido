<template>
  <div class="component-edit-creation-formular">
    <div class="shadow p-3 mb-5 bg-white rounded">
      <b-form ref="updateCreationForm">
        <b-row class="m-4">
          <label>Monat Auswählen</label>
          <b-col class="text-left">
            <b-form-radio
              v-model="radioSelected"
              :value="beforeLastMonth"
              :disabled="creation[0] === 0"
              size="lg"
              @change="updateRadioSelected(beforeLastMonth, 0, creation[0])"
            >
              <label for="beforeLastMonth">
                {{ beforeLastMonth.short }} {{ creation[0] != null ? creation[0] + ' GDD' : '' }}
              </label>
            </b-form-radio>
          </b-col>
          <b-col>
            <b-form-radio
              v-model="radioSelected"
              :value="lastMonth"
              :disabled="creation[1] === 0"
              size="lg"
              @change="updateRadioSelected(lastMonth, 1, creation[1])"
            >
              <label for="lastMonth">
                {{ lastMonth.short }} {{ creation[1] != null ? creation[1] + ' GDD' : '' }}
              </label>
            </b-form-radio>
          </b-col>
          <b-col class="text-right">
            <b-form-radio
              v-model="radioSelected"
              :value="currentMonth"
              :disabled="creation[2] === 0"
              size="lg"
              @change="updateRadioSelected(currentMonth, 2, creation[2])"
            >
              <label for="currentMonth">
                {{ currentMonth.short }} {{ creation[2] != null ? creation[2] + ' GDD' : '' }}
              </label>
            </b-form-radio>
          </b-col>
        </b-row>

        <b-row class="m-4">
          <label>Betrag Auswählen</label>
          <div>
            <b-input-group prepend="GDD" append=".00">
              <b-form-input
                type="number"
                v-model="value"
                :min="rangeMin"
                :max="rangeMax"
              ></b-form-input>
            </b-input-group>

            <b-input-group prepend="0" :append="String(rangeMax)" class="mt-3">
              <b-form-input
                type="range"
                v-model="value"
                :min="rangeMin"
                :max="rangeMax"
                step="10"
              ></b-form-input>
            </b-input-group>
          </div>
        </b-row>
        <b-row class="m-4">
          <label>Text eintragen</label>
          <div>
            <b-form-textarea
              id="textarea-state"
              v-model="text"
              :state="text.length >= 10"
              placeholder="Mindestens 10 Zeichen eingeben"
              rows="3"
            ></b-form-textarea>
          </div>
        </b-row>
        <b-row class="m-4">
          <b-col class="text-center">
            <b-button type="reset" variant="danger" @click="$refs.updateCreationForm.reset()">
              zurücksetzen
            </b-button>
          </b-col>
          <b-col class="text-center">
            <div class="text-right">
              <b-button
                type="button"
                variant="success"
                @click="submitCreation"
                :disabled="radioSelected === '' || value <= 0 || text.length < 10"
              >
                Update Schöpfung ({{ type }},{{ pagetype }})
              </b-button>
            </div>
          </b-col>
        </b-row>
      </b-form>
    </div>
  </div>
</template>
<script>
import { updatePendingCreation } from '../graphql/updatePendingCreation'
export default {
  name: 'CreationFormular',
  props: {
    type: {
      type: String,
      required: false,
    },
    pagetype: {
      type: String,
      required: false,
      default: '',
    },
    item: {
      type: Object,
      required: false,
      default() {
        return {}
      },
    },
    items: {
      type: Array,
      required: false,
      default() {
        return []
      },
    },
    creationUserData: {
      type: Object,
      required: false,
      default() {
        return {}
      },
    },
    creation: {
      type: Array,
      required: true,
    },
  },
  created() {
    console.log(' created this.pagetype', this.pagetype)
    if (this.pagetype === 'PageCreationConfirm' && this.creationUserData.date) {
      console.log('if created CreationFormular.vue', this.creationUserData.date)
      console.log(
        'this.$moment(this.creationUserData.date).format("MMMM")',
        this.$moment(this.creationUserData.date).format('MMMM'),
      )
      console.log(
        'this.$moment(this.creationUserData.date).format("YYYY-MM")',
        this.$moment(this.creationUserData.date).format('YYYY-MM'),
      )
      switch (this.$moment(this.creationUserData.date).format('MMMM')) {
        case this.currentMonth.short:
          this.createdIndex = 2
          break
        case this.lastMonth.short:
          this.createdIndex = 1
          break
        case this.beforeLastMonth.short:
          this.createdIndex = 0
          break
        default:
          throw new Error('Something went wrong')
      }
      this.selectedOpenCreationAmount = this.creation[this.createdIndex]
      this.rangeMax =  this.selectedOpenCreationAmount 
    }
  },
  data() {
    return {
      radioSelected: '',
      text: !this.creationUserData.note ? '' : this.creationUserData.note,
      value: !this.creationUserData.amount ? 0 : this.creationUserData.amount / 10000,
      rangeMin: 0,
      rangeMax: 1000,
      currentMonth: {
        short: this.$moment().format('MMMM'),
        long: this.$moment().format('YYYY-MM-DD'),
      },
      lastMonth: {
        short: this.$moment().subtract(1, 'month').format('MMMM'),
        long: this.$moment().subtract(1, 'month').format('YYYY-MM') + '-01',
      },
      beforeLastMonth: {
        short: this.$moment().subtract(2, 'month').format('MMMM'),
        long: this.$moment().subtract(2, 'month').format('YYYY-MM') + '-01',
      },
      submitObj: null,
      isdisabled: true,
      createdIndex: null,
      selectedOpenCreationAmount:{},
    }
  },

  methods: {
    updateRadioSelected(name, index, openCreation) {
      console.log('createdIndex before update', this.createdIndex)
      this.createdIndex = index
      console.log('radioSelected', this.radioSelected)
      console.log('openCreation', openCreation)

      this.rangeMin = 0
      this.rangeMax = this.creation[index]
    },
    submitCreation() {
      // Formular Prüfen ob ein Zeitraum ausgewählt wurde. Ansonsten abbrechen und Hinweis anzeigen
      if (this.radioSelected === '') {
        return alert('Bitte wähle einen Zeitraum!')
      }
      // Formular Prüfen ob der GDD Betrag grösser 0 ist. Ansonsten abbrechen und Hinweis anzeigen
      if (this.value <= 0) {
        return alert('Bitte gib einen GDD Betrag an!')
      }
      // Formular Prüfen ob der Text vorhanden ist. Ansonsten abbrechen und Hinweis anzeigen
      if (this.text === '') {
        return alert('Bitte gib einen Text ein!')
      }
      // Formular Prüfen ob der Text länger als 10 Zeichen hat. Ansonsten abbrechen und Hinweis anzeigen
      if (this.text.length < 10) {
        return alert('Bitte gib einen Text ein der länger als 10 Zeichen ist!')
      }
      if (this.type === 'singleCreation') {
        this.submitObj = {
          email: this.item.email,
          creationDate: this.radioSelected.long,
          amount: Number(this.value),
          note: this.text,
          moderator: Number(this.$store.state.moderator.id),
        }

        if (this.pagetype === 'PageCreationConfirm') {
          // hinweis das eine ein einzelne Schöpfung abgesendet wird an (email)
          alert('UPDATE EINZELSCHÖPFUNG ABSENDEN FÜR >> ' + JSON.stringify(this.submitObj))

          this.$apollo
            .query({
              query: updatePendingCreation,
              variables: this.submitObj,
            })
            .then((result) => {
              this.$emit('update-user-data', this.item, result.data.createPendingCreation)
              this.$toasted.success(
                `Offene schöpfung (${this.value} GDD) für ${this.item.email} wurde geändert, liegt zur Bestätigung bereit`,
              )
              this.submitObj = null
              this.createdIndex = null
              // das creation Formular reseten
              this.$refs.creationForm.reset()
              // Den geschöpften Wert auf o setzen
              this.value = 0
            })
            .catch((error) => {
              this.$toasted.error(error.message)
              this.submitObj = null
              // das creation Formular reseten
              this.$refs.creationForm.reset()
              // Den geschöpften Wert auf o setzen
              this.value = 0
            })
        }
      }
    },
  },
}
</script>
