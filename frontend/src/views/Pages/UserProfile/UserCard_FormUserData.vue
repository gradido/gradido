<template>
  <b-card id="userdata_form" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a href="#userdata_form" v-if="edit_userdata" @click="edit_userdata = !edit_userdata">
            <span>{{ $t('form.edit') }}</span>
          </a>
          <div v-else>
            <a href="#userdata_form" @click="onSubmit">
              <span class="mr-4 text-success display-4">{{ $t('form.save') }}</span>
            </a>
            <a href="#userdata_form" @click="edit_userdata = !edit_userdata">
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
          <b-col v-if="edit_userdata" class="col-md-9 col-sm-10">
            {{ UserProfileTestData.name }}
          </b-col>
          <b-col v-else class="col-md-9 col-sm-10">
            <b-input type="text" v-model="name"></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
            <small>{{ $t('form.lastname') }}</small>
          </b-col>
          <b-col v-if="edit_userdata" class="col-md-9 col-sm-10">
            {{ UserProfileTestData.lastname }}
          </b-col>
          <b-col v-else class="col-md-9 col-sm-10">
            <b-input type="text" v-model="lastname"></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.description') }}</small>
          </b-col>
          <b-col v-if="edit_userdata" class="col-md-9 col-sm-10">
            {{ UserProfileTestData.desc }}
          </b-col>
          <b-col v-else class="col-md-9 col-sm-10">
            <b-textarea
              rows="3"
              max-rows="6"
              placeholder="UserProfileTestData.dec"
              v-model="dec"
            ></b-textarea>
          </b-col>
        </b-row>
      </div>
    </b-container>
  </b-card>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'

export default {
  name: 'FormUserData',

  data() {
    return {
      edit_userdata: true,
      sessionId: null,
      email: null,
      name: this.UserProfileTestData.name,
      lastname: this.UserProfileTestData.lastname,
      desc: this.UserProfileTestData.desc,
    }
  },
  props: {
    UserProfileTestData: { type: Object },
  },
  methods: {
    async onSubmit() {
      // console.log(this.$props.UserProfileTestData)
      const result = await loginAPI.updateUserdata(
        this.sessionId,
        this.email,
        this.name,
        this.lastname,
        this.desc,
      )
      if (result.success) {
        alert('updateUserdata success')
      } else {
        alert(result.result.message)
      }
    },
  },
}
</script>
<style></style>
