<template>
  <div class="userdata_form">
    <b-card
      id="userdata_form"
      class="bg-transparent"
      style="background-color: #ebebeba3 !important"
    >
      <b-container>
        <b-row class="mb-4 text-right">
          <b-col class="text-right">
            <a href="#userdata_form" v-if="editUserdata" @click="editUserdata = !editUserdata">
              <span>{{ $t('form.edit') }}</span>
            </a>
            <div v-else>
              <a href="#userdata_form" @click="onSubmit">
                <span class="mr-4 text-success display-4">{{ $t('form.save') }}</span>
              </a>
              <a href="#userdata_form" @click="editUserdata = !editUserdata">
                <span>
                  <b>{{ $t('form.cancel') }}</b>
                </span>
              </a>
            </div>
          </b-col>
        </b-row>

        <div>
          <b-row class="mb-3">
            <b-col class="col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
              <small>{{ $t('form.firstname') }}</small>
            </b-col>
            <b-col v-if="editUserdata" class="col-md-9 col-sm-10">
              {{ form.firstName }}
            </b-col>
            <b-col v-else class="col-md-9 col-sm-10">
              <b-input type="text" v-model="form.firstName"></b-input>
            </b-col>
          </b-row>
          <b-row class="mb-3">
            <b-col class="col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
              <small>{{ $t('form.lastname') }}</small>
            </b-col>
            <b-col v-if="editUserdata" class="col-md-9 col-sm-10">
              {{ form.lastName }}
            </b-col>
            <b-col v-else class="col-md-9 col-sm-10">
              <b-input type="text" v-model="form.lastName"></b-input>
            </b-col>
          </b-row>
          <b-row class="mb-3">
            <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
              <small>{{ $t('form.description') }}</small>
            </b-col>
            <b-col v-if="editUserdata" class="col-md-9 col-sm-10">
              {{ form.description }}
            </b-col>
            <b-col v-else class="col-md-9 col-sm-10">
              <b-textarea rows="3" max-rows="6" v-model="form.description"></b-textarea>
            </b-col>
          </b-row>
        </div>
      </b-container>
    </b-card>
  </div>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'

export default {
  name: 'FormUserData',
  props: {
    UserProfileTestData: { type: Object },
  },
  data() {
    return {
      editUserdata: true,
      sessionId: this.$store.state.sessionId,
      form: {
        firstName: this.$store.state.firstName,
        lastName: this.$store.state.lastName,
        description: this.$store.state.description,
      },
    }
  },
  methods: {
    async onSubmit() {
      const result = await loginAPI.updateUserInfos(
        this.$store.state.sessionId,
        this.$store.state.email,
        {
          firstName: this.form.firstName,
          lastName: this.form.lastName,
          description: this.form.description,
        },
      )
      if (result.success) {
        this.$store.commit('firstName', this.form.firstName)
        this.$store.commit('lastName', this.form.lastName)
        this.$store.commit('description', this.form.description)
        this.editUserdata = true
      } else {
        alert(result.result.message)
      }
    },
  },
}
</script>
<style></style>
