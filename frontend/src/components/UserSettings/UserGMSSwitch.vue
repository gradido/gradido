<template>
  <div class="form-user-gms-switch">
    <b-form-checkbox
      test="BFormCheckbox"
      v-model="gmsState"
      name="check-button"
      switch
      @change="onSubmit"
    ></b-form-checkbox>
  </div>
</template>
<script>
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'UserGMSSwitch',
  data() {
    return {
      gmsState: this.$store.state.gmsState,
    }
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: updateUserInfos,
          variables: {
            gmsAllowed: this.gmsState,
          },
        })
        .then(() => {
          this.$store.commit('gmsState', this.gmsState)
          this.$emit('gmsStateSwitch', this.gmsState)
          this.toastSuccess(
            this.gmsState ? this.$t('settings.GMS.enabled') : this.$t('settings.GMS.disabled'),
          )
        })
        .catch((error) => {
          this.gmsState = this.$store.state.gmsState
          this.toastError(error.message)
        })
    },
  },
}
</script>
