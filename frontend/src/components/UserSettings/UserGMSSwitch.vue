<template>
  <div class="form-user-gms-switch">
    <b-form-checkbox
      test="BFormCheckbox"
      v-model="gmsAllowed"
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
      gmsAllowed: this.$store.state.gmsAllowed,
    }
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .mutate({
          mutation: updateUserInfos,
          variables: {
            gmsAllowed: this.gmsAllowed,
          },
        })
        .then(() => {
          this.$store.commit('gmsState', this.gmsAllowed)
          this.$emit('gmsStateSwitch', this.gmsAllowed)
          this.toastSuccess(
            this.gmsAllowed ? this.$t('settings.GMS.enabled') : this.$t('settings.GMS.disabled'),
          )
        })
        .catch((error) => {
          this.gmsAllowed = this.$store.state.gmsAllowed
          this.toastError(error.message)
        })
    },
  },
}
</script>
