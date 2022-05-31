<template>
  <div>
    <b-form class="m-5" @submit="onSubmit">
      <validation-provider name="Name" :rules="{ required: true, min: 3 }">
        <b-form-group id="input-group-1" label="Name:">
          <b-form-input
            v-model="form.name"
            type="text"
            placeholder="Name Contribution"
            required
          ></b-form-input>
        </b-form-group>
      </validation-provider>
      <b-form-group id="input-group-2" label="Beschreibung:">
        <b-form-textarea
          v-model="form.text"
          placeholder="Text Contribution"
          required
        ></b-form-textarea>
      </b-form-group>
      <b-form-group id="input-group-3" label="Betrag:">
        <b-form-input v-model="form.amount" type="number" placeholder="0" required></b-form-input>
      </b-form-group>
      <div>
        <b-form-group id="input-group-4" label="Start-Datum:">
          <b-form-datepicker
            v-model="form.startDate"
            :min="min"
            class="mb-4"
            required
          ></b-form-datepicker>
        </b-form-group>

        <label for="datepicker-invalid">End-Datum</label>
        <b-form-datepicker
          v-model="form.endDate"
          :min="form.startDate ? form.startDate : min"
          class="mb-4"
          required
        ></b-form-datepicker>
      </div>
      <div class="mt-6">
        <b-button type="submit" variant="primary">Anlegen</b-button>
        <b-button type="reset" variant="danger">Reset</b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
export default {
  name: 'ContributionsForm',
}
</script>
