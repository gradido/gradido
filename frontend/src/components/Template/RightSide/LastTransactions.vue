<template>
  <div class="rightside-last-transactions">
    <b-row>
      <b-col>{{ $t('transaction.lastTransactions') }}</b-col>
      <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col>
    </b-row>
    <b-list-group class="mt-5">
      <div v-for="(transaction, index) in transactions" :key="transaction.id">
        <b-list-group-item
          v-if="
            index <= 7 &&
            transaction.typeId !== 'DECAY' &&
            transaction.typeId !== 'LINK_SUMMARY' &&
            transaction.typeId !== 'CREATION'
          "
        >
          <div class="d-flex align-items-center">
            <b-avatar
              :text="transaction.linkedUser.firstName[0] + transaction.linkedUser.lastName[0]"
              :variant="transaction.typeId === 'SEND' ? 'danger' : 'success'"
              class="mr-3"
            ></b-avatar>
            <span class="mr-auto">
              {{ transaction.linkedUser.firstName }} {{ transaction.linkedUser.lastName }}
            </span>
            <b-badge>{{ transaction.amount | GDD }}</b-badge>
          </div>
        </b-list-group-item>
      </div>
    </b-list-group>
  </div>
</template>
<script>
export default {
  name: 'LastTransactions',
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
}
</script>
