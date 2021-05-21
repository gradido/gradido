<template>
  <b-card class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit_email = !edit_email">
          <span v-if="edit_email">E-Mail {{ $t('form.change') }}</span>
          <div v-else>
            <span>
              E-Mail {{ $t('form.change') }}
              <b>{{ $t('form.cancel') }}</b>
            </span>
            <span class="ml-4 text-success display-4">{{ $t('form.save') }}</span>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-row class="mb-3">
      <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
        <small>E-Mail</small>
      </b-col>
      <b-col v-if="edit_email" class="col-md-9 col-sm-10">{{ $store.state.email }}</b-col>
      <b-col v-else class="col-md-9 col-sm-10">
        <b-input type="text" v-model="$store.state.email"></b-input>
      </b-col>
    </b-row>
  </b-card>
</template>
<script>
export default {
  name: 'FormUserMail',
  data() {
    return {
      edit_email: true,
    }
  },
  props: {
    UserProfileTestData: { type: Object },
  },
}
</script>
<style></style>
