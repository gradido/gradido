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
            {{ userdata.first_name }}
          </b-col>
          <b-col v-else class="col-md-9 col-sm-10">
            <b-input type="text" v-model="form.first_name"></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
            <small>{{ $t('form.lastname') }}</small>
          </b-col>
          <b-col v-if="edit_userdata" class="col-md-9 col-sm-10">
            {{ userdata.last_name }}
          </b-col>
          <b-col v-else class="col-md-9 col-sm-10">
            <b-input type="text" v-model="form.last_name"></b-input>
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
            <b-textarea rows="3" max-rows="6" v-model="form.desc"></b-textarea>
          </b-col>
        </b-row>
      </div>
    </b-container>
  </b-card>
</template>
<script>
export default {
  name: 'FormUserData',
  props: {
    userdata: { type: Object },
    UserProfileTestData: { type: Object },
  },
  data() {
    return {
      edit_userdata: true,
      sessionId: null,
      email: null,
      form: {
        first_name: this.userdata.first_name,
        last_name: this.userdata.last_name,
        desc: this.UserProfileTestData.desc,
      },
    }
  },
  methods: {
    async onSubmit() {
      // this.$emit('update-userdata')
      // console.log("form name:", this.first_name)
      // console.log("form nachname:", this.last_name)
      // console.log("form desc:", this.desc)
      //  if (result.success) {
      //    console.log("updateUserdata success")
      //    console.log(result)
      //
      //  } else {
      //    alert(result.result.message)
      //  }
    },
  },
}
</script>
<style></style>
