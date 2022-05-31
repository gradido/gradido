<template>
  <div>
    <b-form class="m-5" @submit="onSubmit">
      <!-- Date -->
      <b-row>
        <b-col>
          <b-form-group id="input-group-4" label="Start-Datum:">
            <b-form-datepicker
              v-model="form.startDate"
              size="lg"
              :min="min"
              class="mb-4"
              required
            ></b-form-datepicker>
          </b-form-group>
        </b-col>
        <b-col>
          <b-form-group id="input-group-4" label="End-Datum:">
            <b-form-datepicker
              v-model="form.endDate"
              size="lg"
              :min="form.startDate ? form.startDate : min"
              class="mb-4"
              required
            ></b-form-datepicker>
          </b-form-group>
        </b-col>
      </b-row>

      <!-- Name -->
      <b-form-group id="input-group-1" label="Name:">
        <b-form-input
          v-model="form.name"
          size="lg"
          type="text"
          placeholder="Name Contribution"
          required
        ></b-form-input>
      </b-form-group>
      <!-- Desc -->
      <b-form-group id="input-group-2" label="Beschreibung:">
        <b-form-textarea
          v-model="form.text"
          size="lg"
          placeholder="Text Contribution"
          required
        ></b-form-textarea>
      </b-form-group>
      <!-- Amount -->
      <b-form-group id="input-group-3" label="Betrag:">
        <b-form-input
          v-model="form.amount"
          size="lg"
          type="number"
          placeholder="0"
          required
        ></b-form-input>
      </b-form-group>

      <b-jumbotron>
        <b-row class="mb-4">
          <b-col>
            <!-- Cycle -->
            <label for="cycle-repetition">Zyclus</label>
            <b-form-select v-model="form.cycle" :options="cycle" class="mb-3" size="lg">
              <!-- This slot appears above the options from 'options' prop -->
              <template #first>
                <b-form-select-option :value="null" disabled>
                  -- Please select an cycle --
                </b-form-select-option>
              </template>
            </b-form-select>
          </b-col>
          <b-col>
            <!-- Repetition -->
            <label for="cycle-repetition">Wiederholung</label>
            <b-form-select v-model="form.repetition" :options="repetition" class="mb-3" size="lg">
              <!-- This slot appears above the options from 'options' prop -->
              <template #first>
                <b-form-select-option :value="null" disabled>
                  -- Please select an repetition --
                </b-form-select-option>
              </template>
            </b-form-select>
          </b-col>
        </b-row>

        <!-- Max amount -->
        <b-form-group label="maximaler Betrag:">
          <b-form-input
            v-model="form.maxAmount"
            size="lg"
            type="number"
            placeholder="0"
            required
          ></b-form-input>
        </b-form-group>
      </b-jumbotron>
      <div class="mt-6">
        <b-button type="submit" variant="primary">Anlegen</b-button>
        <b-button type="reset" variant="danger">Reset</b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
export default {
  name: 'AutomaticCreationForm',
  data() {
    return {
      form: {
        name: null,
        text: null,
        amount: null,
        startDate: null,
        endDate: null,
        cycle: null,
        repetition: null,
        maxAmount: null,
      },
      min: new Date(),
      cycle: [
        { value: 'stündlich', text: 'stündlich' },
        { value: 'täglich', text: 'täglich' },
        { value: 'wöchentlich', text: 'wöchentlich' },
        { value: 'monatlich', text: 'monatlich' },
        { value: 'jährlich', text: 'jährlich' },
      ],
      repetition: [
        { value: '1', text: '1 mal' },
        { value: '2', text: '2 mal' },
        { value: '3', text: '3 mal' },
        { value: '4', text: '4 mal' },
        { value: '5', text: '5 mal' },
      ],
    }
  },
  methods: {
    onSubmit(event) {
      event.preventDefault()
      if (this.form.startDate === null) return this.toastError('No start Date')
      if (this.form.endDate === null) return this.toastError('No end Date')
      alert(JSON.stringify(this.form))
    },
  },
}
</script>
