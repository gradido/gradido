<template>
  <div class="gdd-amount translucent-color-opacity">
    <div class="text-center">
      <b-badge
        v-if="badgeShow"
        class="position-absolute mt--2 ml--4 px-3 zindex1"
        :class="showStatus ? 'bg-gradient' : ''"
        :variant="showStatus ? '' : 'light'"
      >
        {{ $t('GDD') }}
      </b-badge>
    </div>
    <div
      class="wallet-amount bg-white appBoxShadow gradido-border-radius p-4 border"
      :class="
        showStatus || path === '/overview'
          ? 'gradido-global-border-color-accent'
          : 'border-light opacity-05'
      "
    >
      <b-row>
        <b-col class="h4">{{ $t('gddKonto') }}</b-col>
      </b-row>

      <b-row>
        <b-col cols="9">
          <b-icon
            icon="layers"
            class="mr-3 gradido-global-border-color-accent d-none d-lg-inline"
          ></b-icon>
          <span v-if="hideAmount" class="font-weight-bold gradido-global-color-accent">
            {{ $t('asterisks') }}
          </span>
          <span v-else class="font-weight-bold gradido-global-color-accent">
            {{ balance | GDD }}
          </span>
        </b-col>
        <b-col cols="3" class="border-left border-light">
          <b-icon
            :icon="hideAmount ? 'eye-slash' : 'eye'"
            class="mr-3 gradido-global-border-color-accent pointer hover-icon"
            @click="updateHideAmountGDD"
          ></b-icon>
        </b-col>
      </b-row>
    </div>
  </div>
</template>
<script>
import { updateUserInfos } from '@/graphql/mutations'

export default {
  name: 'GddAmount',
  props: {
    path: { type: String, required: false, default: '' },
    balance: { type: Number, required: true },
    badgeShow: { type: Boolean, default: true },
    showStatus: { type: Boolean, default: false },
  },
  computed: {
    hideAmount() {
      return this.$store.state.hideAmountGDD
    },
  },
  methods: {
    async updateHideAmountGDD() {
      this.$apollo
        .mutate({
          mutation: updateUserInfos,
          variables: {
            hideAmountGDD: !this.hideAmount,
          },
        })
        .then(() => {
          this.$store.commit('hideAmountGDD', !this.hideAmount)
          if (!this.hideAmount) {
            this.toastSuccess(this.$t('settings.showAmountGDD'))
          } else {
            this.toastSuccess(this.$t('settings.hideAmountGDD'))
          }
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
  },
}
</script>
