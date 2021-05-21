<template>
  <b-card class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit_userdata = !edit_userdata">
          <span v-if="edit_userdata">{{ $t('form.edit') }}</span>
          <div v-else>
            <span>
              {{ $t('form.edit') }}
              <b>{{ $t('form.cancel') }}</b>
            </span>
            <span class="ml-4 text-success display-4">{{ $t('form.save') }}</span>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <div>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
          <small>{{ $t('form.firstname') }}</small>
        </b-col>
        <b-col v-if="edit_userdata" class="col-lg-9 col-md-12 col-sm-12">
          {{ UserProfileTestData.name }}
        </b-col>
        <b-col v-else class="col-lg-9 col-md-12 col-sm-12">
          <b-input type="text" v-model="$props.UserProfileTestData.name"></b-input>
        </b-col>
      </b-row>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
          <small>{{ $t('form.lastname') }}</small>
        </b-col>
        <b-col v-if="edit_userdata" class="col-lg-9 col-md-12 col-sm-12">
          {{ UserProfileTestData.lastname }}
        </b-col>
        <b-col v-else class="col-lg-9 col-md-12 col-sm-12">
          <b-input type="text" v-model="$props.UserProfileTestData.lastname"></b-input>
        </b-col>
      </b-row>
      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-12 col-sm-12 text-md-left text-lg-right">
          <small>{{ $t('form.description') }}</small>
        </b-col>
        <b-col v-if="edit_userdata" class="col-lg-9 col-md-12 col-sm-12">
          {{ UserProfileTestData.desc }}
        </b-col>
        <b-col v-else class="col-lg-9 col-md-12 col-sm-12">
          <b-textarea
            rows="3"
            max-rows="6"
            placeholder="UserProfileTestData.dec"
            v-model="$props.UserProfileTestData.dec"
          ></b-textarea>
        </b-col>
      </b-row>
    </div>
  </b-card>
</template>
<script>
export default {
  name: 'FormUserData',

  data() {
    return {
      edit_userdata: true,
    }
  },
  props: {
    UserProfileTestData: { type: Object },
  },
}
</script>
<style></style>
