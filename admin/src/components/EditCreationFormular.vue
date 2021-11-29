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

        <b-row class="m-4" v-show="createdIndex != null">
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