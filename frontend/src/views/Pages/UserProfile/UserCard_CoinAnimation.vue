<template>
  <b-card
    id="formusercoinanimation"
    class="bg-transparent"
    style="background-color: #ebebeba3 !important; border-radius: 0px"
  >
    <div>
      <b-row class="mb-3">
        <b-col class="mb-2 col-12">
          <small>
            <b>{{ $t('setting.coinanimation') }}</b>
          </small>
        </b-col>
        <b-col class="col-12">
          <b-form-checkbox
            class="Test-BFormCheckbox"
            v-model="CoinAnimationStatus"
            name="check-button"
            switch
          >
            {{
              CoinAnimationStatus
                ? $t('setting.coinanimationTrue')
                : $t('setting.coinanimationFalse')
            }}
          </b-form-checkbox>
        </b-col>
      </b-row>
    </div>
  </b-card>
</template>
<script>
import { updateUserInfos } from '../../../graphql/queries'
export default {
  name: 'FormUserCoinAnimation',
  data() {
    return {
      CoinAnimationStatus: true,
    }
  },
  created() {
    this.CoinAnimationStatus = this.$store.state.coinanimation /* exestiert noch nicht im store */
  },
  methods: {
    async onSubmit() {
      this.$apollo
        .query({
          query: updateUserInfos,
          variables: {
            coinanimation: this.$store.state.coinanimation,
          },
        })
        .then(() => {
          this.$toasted.success(
            this.CoinAnimationStatus
              ? this.$t('setting.coinanimationTrue')
              : this.$t('setting.coinanimationFalse'),
          )
        })
        .catch((error) => {
          this.$toasted.error(error.message)
        })
    },
  },
}
</script>
