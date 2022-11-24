<template>
  <div class="profile break">
    <b-card class="justify-content-center bg-white appBoxShadow gradido-border-radius">
      <b-form @submit.prevent="submit">
        <b-row>
          <b-col>
            <first-name v-model="firstName" />
          </b-col>
          <b-col>
            <last-name v-model="lastName" />
          </b-col>
        </b-row>
        <div></div>
        <div></div>

        <b-row class="mt-5">
          <b-col><language-switch /></b-col>
          <b-col><job v-model="job" /></b-col>
        </b-row>
        <div class="h3 mt-5">Email und Passwort</div>
        <b-row>
          <b-col><input-email v-model="email" /></b-col>
          <b-col><input-password /></b-col>
        </b-row>
        <div class="h3 mt-5">Style & News</div>
        <b-row>
          <b-col>Newsletter abonnieren</b-col>
          <b-col>on / of</b-col>
          <b-col><b-form-checkbox switch size="lg"></b-form-checkbox></b-col>
        </b-row>
        <b-row class="mt-3">
          <b-col>Lightning Mode</b-col>
          <b-col>on / of</b-col>
          <b-col><b-form-checkbox switch size="lg"></b-form-checkbox></b-col>
        </b-row>
        <b-button type="submit" class="mt-5">speichern</b-button>
      </b-form>
    </b-card>
  </div>
</template>
<script>
import FirstName from '@/components/Inputs/FirstName.vue'
import LastName from '@/components/Inputs/LastName.vue'
import LanguageSwitch from '@/components/LanguageSwitch.vue'
import Job from '@/components/Inputs/Job.vue'
import InputEmail from '@/components/Inputs/InputEmail.vue'
import InputPassword from '@/components/Inputs/InputPassword.vue'

export default {
  name: 'Profile',
  components: {
    FirstName,
    LastName,
    LanguageSwitch,
    Job,
    InputEmail,
    InputPassword,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  data() {
    return {
      firstName: this.$store.state.firstName,
      lastName: this.$store.state.lastName,
      job: '',
      email: this.$store.state.email,
    }
  },
  methods: {
    submit() {
      console.log('submit')
      console.log(this.firstName)
      console.log(this.lastName)
      console.log(this.job)
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.updateTransactions(0)
  },
}
</script>
