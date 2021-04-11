<template>
  <card style="background-color: #ebebeba3 !important">
    <b-form @submit.prevent="updateProfile" @change.prevent="alert('änderung')">
      <h6 class="heading-small text-muted mb-4">{{ $t('form.userInfo') }}</h6>

      <div class="pl-lg-4">
        <b-row>
          <b-col lg="6">
            <base-input
              type="text"
              label="Username"
              :placeholder="$t('form.username')"
              v-model="user.username"
            ></base-input>
          </b-col>
          <b-col lg="6">
            <base-input
              type="email"
              :label="$t('form.email')"
              :placeholder="$t('form.email')"
              v-model="user.email"
            ></base-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col lg="6">
            <base-input
              type="text"
              :label="$t('form.firstname')"
              :placeholder="$t('form.firstname')"
              v-model="user.firstName"
            ></base-input>
          </b-col>
          <b-col lg="6">
            <base-input
              type="text"
              :label="$t('form.lastname')"
              :placeholder="$t('form.lastname')"
              v-model="user.lastName"
            ></base-input>
          </b-col>
        </b-row>
      </div>
      <hr class="my-4" />

      <!-- Address -->
      <h6 class="heading-small text-muted mb-4">{{ $t('form.contactInfo') }}</h6>

      <div class="pl-lg-4">
        <b-row>
          <b-col md="12">
            <base-input
              type="text"
              :label="$t('form.address')"
              :placeholder="$t('form.address')"
              v-model="user.address"
            ></base-input>
          </b-col>
        </b-row>
        <b-row>
          <b-col lg="4">
            <base-input
              type="text"
              :label="$t('form.city')"
              :placeholder="$t('form.city')"
              v-model="user.city"
            ></base-input>
          </b-col>
          <b-col lg="4">
            <base-input
              type="text"
              :label="$t('form.country')"
              :placeholder="$t('form.country')"
              v-model="user.country"
            ></base-input>
          </b-col>
          <b-col lg="4">
            <base-input
              :label="$t('form.postalCode')"
              :placeholder="$t('form.postalCode')"
              v-model="user.postalCode"
            ></base-input>
          </b-col>
        </b-row>
      </div>

      <hr class="my-4" />
      <!-- Description -->
      <h6 class="heading-small text-muted mb-4">{{ $t('form.aboutMe') }}</h6>
      <div class="pl-lg-4">
        <b-form-group
          :label="$t('form.aboutMe')"
          label-class="form-control-label"
          class="mb-0"
          label-for="about-form-textaria"
        >
          <!--  <label class="form-control-label">About Me</label> -->
          <b-form-textarea
            rows="4"
            v-model="user.aboutMe"
            id="about-form-textaria"
            :placeholder="$t('form.aboutMePlaceholder')"
          ></b-form-textarea>
        </b-form-group>
      </div>
      <div class="text-center">
        <b-button type="submit" variant="secondary" class="mt-4">
          {{ $t('form.save') }}
        </b-button>
      </div>
    </b-form>
  </card>
</template>
<script>
export default {
  data() {
    return {
      form: {
        change: false,
      },
      user: {
        company: 'Gradido Akademie',
        username: this.$store.state.user.userName,
        email: this.$store.state.email,
        firstName: this.$store.state.user.firstName,
        lastName: this.$store.state.user.lastName,
        address: '',
        city: '',
        country: '',
        postalCode: '',
        aboutMe: '',
      },
    }
  },
  methods: {
    alert(str) {
      alert('ALERT FUNCTION :)=>', str)
    },
    updateProfile() {
      alert('Your data: ' + JSON.stringify(this.user))
    },
  },
}
</script>
<style></style>
