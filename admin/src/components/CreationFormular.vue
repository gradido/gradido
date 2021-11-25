<template>
  <div class="component-creation-formular">
    <div>
      <h3>
        {{
          this.type === 'singleCreation'
            ? 'Einzelschöpfung für ' + item.firstName + ' ' + item.lastName + ''
            : 'Mehrfachschöpfung für ' + Object.keys(this.itemsMassCreation).length + ' Mitglieder'
        }}
        {{ item }}
      </h3>
      <div v-show="this.type === 'massCreation' && Object.keys(this.itemsMassCreation).length <= 0">
        Bitte wähle ein oder Mehrere Mitglieder aus für die du Schöpfen möchtest
      </div>
    </div>
    <div
      v-show="this.type === 'singleCreation' || Object.keys(this.itemsMassCreation).length > 0"
      class="shadow p-3 mb-5 bg-white rounded"
    >
      <b-form ref="creationForm">
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
              {{ beforeLastMonth.short }} {{ creation[0] != null ? creation[0] + ' GDD' : '' }}
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
              {{ lastMonth.short }} {{ creation[1] != null ? creation[1] + ' GDD' : '' }}
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
              {{ currentMonth.short }} {{ creation[2] != null ? creation[2] + ' GDD' : '' }}
            </b-form-radio>
          </b-col>
        </b-row>

        <b-row class="m-4">
          <label>Betrag Auswählen</label>
          <b-input-group>
            <template #append>
              <b-input-group-text><strong class="text-danger">GDD</strong></b-input-group-text>
            </template>
            <b-form-input
              type="number"
              v-model="value"
              :min="rangeMin"
              :max="rangeMax"
            ></b-form-input>
          </b-input-group>

          <b-input
            id="range-2"
            class="mt-2"
            v-model="value"
            type="range"
            :min="rangeMin"
            :max="rangeMax"
            step="10"
            @load="checkFormForUpdate('range')"
          ></b-input>
        </b-row>
        <b-row class="m-4">
          <label>Text eintragen</label>
          <div>
            <b-form-textarea
              id="textarea-state"
              v-model="text"
              :state="text.length >= 10"
              placeholder="Mindestens 10 Zeichen eingeben"
              @load="checkFormForUpdate('text')"
              rows="3"
            ></b-form-textarea>
          </div>
        </b-row>
        <b-row class="m-4">
          <b-col class="text-center">
            <b-button type="reset" variant="danger" @click="$refs.creationForm.reset()">
              zurücksetzen
            </b-button>
          </b-col>
          <b-col class="text-center">
            <div class="text-right">
              <b-button
                v-if="pagetype === 'PageCreationConfirm'"
                type="button"
                variant="success"
                @click="submitCreation"
                :disabled="radioSelected === '' || value <= 0 || text.length < 10"
              >
                Update Schöpfung ({{ type }},{{ pagetype }})
              </b-button>

              <b-button
                v-else
                type="button"
                variant="success"
                @click="submitCreation"
                :disabled="radioSelected === '' || value <= 0 || text.length < 10"
              >
                Schöpfung einreichen ({{ type }})
              </b-button>
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
    },
    creationUserData: {
      type: Object,
      required: false,
    },
    creation: {
      type: Array,
      required: true,
    },
    itemsMassCreation: {
      type: Object,
      required: false,
    },
  },
  data() {
    return {
      radioSelected: '',
      text: '',
      value: 0,
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
    }
  },
  methods: {
    // Auswählen eines Zeitraumes
    updateRadioSelected(name, index, openCreation) {
      // Wenn Mehrfachschöpfung
      if (this.type === 'massCreation') {
        // An Creation.vue emitten und radioSelectedMass aktualisieren
        this.$emit('update-radio-selected', [name, index])
      }
      // Wenn Einzelschöpfung
      if (this.type === 'singleCreation') {
        this.rangeMin = 0
        // Der maximale offene Betrag an GDD die für ein User noch geschöpft werden kann
        this.rangeMax = openCreation
      }
    },
    checkFormForUpdate(input) {
      switch (input) {
        case 'text':
          this.text = this.creationUserData.text
          break
        case 'range':
          this.value = this.creationUserData.creationGdd
          break
        default:
          // TODO: Toast
          alert("I don't know such values")
      }
    },
    submitCreation() {
      // Formular Prüfen ob ein Zeitraum ausgewählt wurde. Ansonsten abbrechen und Hinweis anzeigen
      if (this.radioSelected === '') {
        return alert('Bitte wähle einen Zeitraum!')
      }
      // Formular Prüfen ob der GDD Betrag grösser 0 ist. Ansonsten abbrechen und Hinweis anzeigen
      if (this.value === 0) {
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
      if (this.type === 'massCreation') {
        // Die anzahl der Mitglieder aus der Mehrfachschöpfung
        const i = Object.keys(this.itemsMassCreation).length
        // hinweis das eine Mehrfachschöpfung ausgeführt wird an (Anzahl der MItgleider an die geschöpft wird)
        alert('SUBMIT CREATION => ' + this.type + ' >> für VIELE ' + i + ' Mitglieder')
        this.submitObj = [
          {
            item: this.itemsMassCreation,
            email: this.item.email,
            creationDate: this.radioSelected.long,
            amount: this.value,
            note: this.text,
            moderator: this.$store.state.moderator.id,

          },
        ]
        alert('MehrfachSCHÖPFUNG ABSENDEN FÜR >> ' + i + ' Mitglieder')

        // $store - offene Schöpfungen hochzählen
        this.$store.commit('openCreationsPlus', i)

        // lösche alle Mitglieder aus der MehrfachSchöpfungsListe nach dem alle Mehrfachschpfungen zum bestätigen gesendet wurden.
        this.$emit('remove-all-bookmark')
      }

      if (this.type === 'singleCreation') {
        // hinweis das eine einzelne schöpfung ausgeführt wird an (Vorname)
        alert('SUBMIT CREATION => ' + this.type + ' >> für ' + this.item.firstName + '')
        // erstellen eines Arrays (submitObj) mit allen Daten
        this.submitObj = {
          email: this.item.email,
          creationDate: this.radioSelected.long,
          amount: this.value,
          note: this.text,
          moderator: this.$store.state.moderator.id,
        }

        if (this.pagetype === 'PageCreationConfirm') {
          // hinweis das eine ein einzelne Schöpfung abgesendet wird an (email)
          alert('UPDATE EINZEL SCHÖPFUNG ABSENDEN FÜR >> ')
          // umschreiben, update eine bestehende Schöpfung eine
          this.$emit('update-creation-data', {
            datum: this.radioSelected.long,
            creationGdd: this.value,
            text: this.text,
          })
        } else {
          // hinweis das eine ein einzelne Schöpfung abgesendet wird an (email)
          alert('EINZEL SCHÖPFUNG ABSENDEN FÜR >> ' + this.item.firstName + '')
          // $store - offene Schöpfungen hochzählen
          this.$store.commit('openCreationsPlus', 1)
        }
      }

      // das absendeergebniss im string ansehen
      alert(JSON.stringify(this.submitObj))
      // das submitObj zurücksetzen
      this.submitObj = null
      // das creation Formular reseten
      this.$refs.creationForm.reset()
      // Den geschöpften Wert auf o setzen
      this.value = 0
    },
  },
}
</script>
