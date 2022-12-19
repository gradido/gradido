<template>
  <div class="userdata-card">
    <b-card class="border-0">
      <div class="justify-content-center">
        <avatar :username="username" :color="'#fff'" :size="90"></avatar>
      </div>

      <b-container class="justify-content-center mt-md-5">
        <b-row>
          <b-col>
            <div class="text-center font-weight-bold">
              {{ $n(balance, 'decimal') }}
            </div>
            <div class="text-center">{{ $t('GDD') }}</div>
          </b-col>
          <b-col>
            <div class="text-center font-weight-bold">
              {{ transactionCount }}
            </div>
            <div class="text-center">
              {{ $t('navigation.transactions') }}
            </div>
          </b-col>
          <b-col>
            <div class="text-center font-weight-bold">{{ CONFIG.COMMUNITY_NAME }}</div>
            <div class="text-center">
              {{ $t('community.community') }}
            </div>
          </b-col>
        </b-row>
      </b-container>
    </b-card>
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
      return `${this.$store.state.firstName} ${this.$store.state.lastName}`
    },
  },
}
</script>
