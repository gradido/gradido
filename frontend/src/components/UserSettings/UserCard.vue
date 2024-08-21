<template>
  <div class="userdata-card">
    <div class="center-per-margin">
      <avatar
        :username="username.username"
        :initials="username.initials"
        :color="'#fff'"
        :size="90"
      ></avatar>
    </div>

    <div class="justify-content-center mt-5 mb-5">
      <BRow align-v="stretch">
        <BCol cols="4">
          <div class="text-center fw-bold">
            {{ $n(balance, 'decimal') }}
          </div>
        </BCol>
        <BCol cols="4">
          <div class="text-center fw-bold">
            {{ transactionCount }}
          </div>
        </BCol>
        <BCol cols="4">
          <div class="text-center fw-bold">{{ CONFIG.COMMUNITY_NAME }}</div>
        </BCol>
      </BRow>
      <BRow>
        <BCol cols="4">
          <div class="text-center">{{ $t('GDD') }}</div>
        </BCol>
        <BCol cols="4">
          <div class="text-center">
            {{ $t('navigation.transactions') }}
          </div>
        </BCol>
        <BCol cols="4">
          <div class="text-center">
            {{ $t('community.community') }}
          </div>
        </BCol>
      </BRow>
    </div>
  </div>
</template>
<script>
import Avatar from 'vue-avatar'
import CONFIG from '@/config'

export default {
  name: 'UserCard',
  components: {
    Avatar,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  data() {
    return {
      CONFIG,
    }
  },
  computed: {
    username() {
      return {
        username: `${this.$store.state.firstName} ${this.$store.state.lastName}`,
        initials: `${this.$store.state.firstName[0]}${this.$store.state.lastName[0]}`,
      }
    },
  },
}
</script>
<style scoped>
.center-per-margin {
  padding-left: 44%;
}

@media screen and (width <= 850px) {
  .center-per-margin {
    padding-left: 38%;
  }
}

@media screen and (width <= 450px) {
  .center-per-margin {
    padding-left: 34%;
  }
}
</style>
