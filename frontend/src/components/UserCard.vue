<template>
  <div class="userdata-card">
    <b-card class="bg-transparent border-0">
      <div class="w-100 text-center">
        <b-avatar variant="primary" :text="avatar" size="6rem"></b-avatar>
      </div>

      <b-container class="d-flex justify-content-center mt-md-5">
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
            <div class="text-center font-weight-bold">{{ $t('em-dash') }}</div>
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
export default {
  name: 'UserCard',
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
  computed: {
    avatar() {
      return `${this.$store.state.firstName[0]}  ${this.$store.state.lastName[0]}`
    },
  },
}
</script>
