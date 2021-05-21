<template>
  <b-card class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit_pwd = !edit_pwd">
          <span v-if="edit_pwd">{{ $t('form.password') }} {{ $t('form.change') }}</span>
          <div v-else>
            <span>
              {{ $t('form.password') }} {{ $t('form.change') }}
              <b>{{ $t('form.cancel') }}</b>
            </span>
            <span class="ml-4 text-success display-4">{{ $t('form.save') }}</span>
          </div>
        </b-col>
      </b-row>

      <div v-if="!edit_pwd">
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_old') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input type="text" :placeholder="$t('form.password_old')"></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_new') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input type="text" :placeholder="$t('form.password_new')"></b-input>
          </b-col>
        </b-row>
        <b-row class="mb-3">
          <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
            <small>{{ $t('form.password_new_repeat') }}</small>
          </b-col>
          <b-col class="col-md-9 col-sm-10">
            <b-input type="text" :placeholder="$t('form.password_new_repeat')"></b-input>
          </b-col>
        </b-row>
      </div>
    </b-container>
  </b-card>
</template>
<script>
export default {
  name: 'FormUserPasswort',
  data() {
    return {
      edit_pwd: true,
    }
  },
  props: {
    UserProfileTestData: { type: Object },
  },
}
</script>
<style></style>
