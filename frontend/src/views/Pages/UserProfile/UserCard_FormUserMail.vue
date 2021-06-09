<template>
  <b-card id="formusermail" class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right">
          <a href="#formusermail" v-if="edit_email" @click="edit_email = !edit_email">
            <span>E-Mail {{ $t('form.change') }}</span>
          </a>
          <div v-else>
            <a href="#formusermail" @click="onSubmit">
              <span class="mr-4 text-success display-4">{{ $t('form.save') }}</span>
            </a>
            <a href="#formusermail" @click="edit_email = !edit_email">
              <span>
                <b>{{ $t('form.cancel') }}</b>
              </span>
            </a>
          </div>
        </b-col>
      </b-row>

      <b-row class="mb-3">
        <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
          <small>E-Mail</small>
        </b-col>
        <b-col v-if="edit_email" class="col-md-9 col-sm-10">{{ $store.state.email }}</b-col>
        <b-col v-else class="col-md-9 col-sm-10">
          <b-input type="text" v-model="newEmail"></b-input>
        </b-col>
      </b-row>
    </b-container>
  </b-card>
</template>
<script>
import loginAPI from '../../../apis/loginAPI'

export default {
  name: 'FormUserMail',
  data() {
    return {
      edit_email: true,
      newEmail: '',
    }
  },
  methods: {
    async onSubmit() {
      // console.log(this.data)
      const result = await loginAPI.changeEmailProfil(
        this.$store.state.sessionId,
        this.email,
        this.newEmail,
      )
      if (result.success) {
        alert('changePassword success')
      } else {
        alert(result.result.message)
      }
    },
  },
}
</script>
<style></style>
