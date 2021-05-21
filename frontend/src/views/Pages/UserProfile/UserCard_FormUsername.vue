<template>
  <b-card class="bg-transparent" style="background-color: #ebebeba3 !important">
    <b-container>
      <b-row class="mb-4 text-right">
        <b-col class="text-right" @click="edit_username = !edit_username">
          <span v-if="edit_username">{{ $t('form.username') }} {{ $t('form.change') }}</span>
          <div v-else>
            <span>
              {{ $t('form.username') }} {{ $t('form.change') }}
              <b>{{ $t('form.cancel') }}</b>
            </span>
            <span class="ml-4 text-success display-4">{{ $t('form.save') }}</span>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-row class="mb-3">
      <b-col class="col-lg-3 col-md-10 col-sm-10 text-md-left text-lg-right">
        <small>{{ $t('form.username') }}</small>
      </b-col>
      <b-col v-if="edit_username" class="col-md-9 col-sm-10">
        @{{ UserProfileTestData.username }}
      </b-col>
      <b-col v-else class="col-md-9 col-sm-10">
        <b-input type="text" v-model="$props.UserProfileTestData.username"></b-input>
        <div>
          {{ $t('form.change_username_info') }}
        </div>
      </b-col>
    </b-row>
  </b-card>
</template>
<script>
export default {
  name: 'FormUsername',
  data() {
    return {
      edit_username: true,
    }
  },
  props: {
    UserProfileTestData: { type: Object },
  },
}
</script>
<style></style>
