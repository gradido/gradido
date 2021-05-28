<template>
  <b-card id="formusername" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a href="#formusername" v-if="edit_username" @click="edit_username = !edit_username">
            <span>{{ $t('form.username') }} {{ $t('form.change') }}</span>
          </a>
          <div v-else>
            <a href="#formusername" @click="onSubmit">
              <span class="mr-4 text-success display-4">{{ $t('form.save') }}</span>
            </a>
            <a href="#formusername" @click="edit_username = !edit_username">
              <span>
                <b>{{ $t('form.cancel') }}</b>
              </span>
            </a>
          </div>
        </b-col>
      </b-row>

      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>{{ $t('form.username') }}</small>
        </b-col>
        <b-col v-if="edit_username" class="col-md-9 col-sm-10">@{{ username }}</b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-input type="text" v-model="this.username"></b-input>
          <div>
            {{ $t('form.change_username_info') }}
          </div>
        </b-col>
      </b-row>
    </b-container>
  </b-card>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'

export default {
  name: 'FormUsername',
  data() {
    return {
      edit_username: true,
      username: this.UserProfileTestData.username,
    }
  },
  props: {
    UserProfileTestData: { type: Object },
  },
  methods: {
    async onSubmit() {
      // console.log(this.data)
      const result = await loginAPI.changeUsernameProfil(this.username)
      if (result.success) {
        alert('changeUsername success')
      } else {
        alert(result.result.message)
      }
    },
  },
}
</script>
<style></style>
