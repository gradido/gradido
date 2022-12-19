<template>
  <div class="rightside-last-transactions d-none d-lg-block">
    <b-row>
      <b-col>{{ $t('transaction.lastTransactions') }}</b-col>
      <!-- <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col> -->
    </b-row>
    <b-list-group class="mt-5">
      <div v-for="(transaction, index) in transactions" :key="transaction.id">
        <b-list-group-item
          class="border-0"
          v-if="
            index <= 7 &&
            transaction.typeId !== 'DECAY' &&
            transaction.typeId !== 'LINK_SUMMARY' &&
            transaction.typeId !== 'CREATION'
          "
        >
          <div class="d-flex align-items-center">
            <avatar
              :username="`${transaction.linkedUser.firstName} ${transaction.linkedUser.lastName}`"
            ></avatar>
            <span>
              <name :linkedUser="transaction.linkedUser" @set-tunneled-email="setTunneledEmail" />
            </span>
            <b-badge>{{ transaction.amount | GDD }}</b-badge>
          </div>
        </b-list-group-item>
      </div>
    </b-list-group>
  </div>
</template>
<script>
import Avatar from 'vue-avatar'
import Name from '@/components/TransactionRows/Name.vue'

export default {
  name: 'LastTransactions',
  components: {
    Avatar,
    Name,
  },
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
  methods: {
    setTunneledEmail(email) {
      console.log('setTunneledEmail LastTransaction', email)
      this.$emit('set-tunneled-email', email)
    },
  },
}
</script>
