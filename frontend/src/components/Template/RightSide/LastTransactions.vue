<template>
  <div class="rightside-last-transactions d-none d-lg-block">
    <BRow class="mb-3">
      <BCol class="h3">{{ $t('transaction.lastTransactions') }}</BCol>
    </BRow>

    <div v-for="(transaction, index) in transactions" :key="transaction.id">
      <BRow
        v-if="
          index <= 8 &&
          transaction.typeId !== 'DECAY' &&
          transaction.typeId !== 'LINK_SUMMARY' &&
          transaction.typeId !== 'CREATION'
        "
        align-v="center"
        class="mb-4"
      >
        <BCol cols="auto">
          <div class="align-items-center">
            <avatar
              :size="72"
              :color="'#fff'"
              :username="`${transaction.linkedUser.firstName} ${transaction.linkedUser.lastName}`"
              :initials="`${transaction.linkedUser.firstName[0]}${transaction.linkedUser.lastName[0]}`"
            ></avatar>
          </div>
        </BCol>
        <BCol class="p-1">
          <BRow>
            <BCol>
              <div class="fw-bold">
                <name :linked-user="transaction.linkedUser" font-color="text-dark" />
              </div>
              <div class="d-flex mt-3">
                <div class="small">
                  {{ $filters.GDD(transaction.amount) }}
                </div>
                <div class="small ms-3 text-right">
                  {{ $d(new Date(transaction.balanceDate), 'short') }}
                </div>
              </div>
            </BCol>
          </BRow>
        </BCol>
      </BRow>
    </div>
  </div>
</template>
<script>
import Avatar from 'vue-avatar'
import Name from '@/components/TransactionRows/Name'

export default {
  name: 'LastTransactions',
  components: {
    Avatar,
    Name,
  },
  props: {
    transactions: {
      default: () => [],
      type: Array,
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
}
</script>
