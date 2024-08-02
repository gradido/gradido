<template>
  <div class="rightside-last-transactions d-none d-lg-block">
    <BRow class="mb-3">
      <BCol class="h3">{{ $t('transaction.lastTransactions') }}</BCol>
      <!-- <BCol cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </BCol> -->
    </BRow>

    <div v-for="(transaction, index) in transactions" :key="transaction.id">
      <BRow
        align-v="center"
        v-if="
          index <= 8 &&
          transaction.typeId !== 'DECAY' &&
          transaction.typeId !== 'LINK_SUMMARY' &&
          transaction.typeId !== 'CREATION'
        "
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
              <div class="font-weight-bold">
                <name :linkedUser="transaction.linkedUser" fontColor="text-dark" />
              </div>
              <div class="d-flex mt-3">
                <div class="small">
                  {{ transaction.amount | GDD }}
                </div>
                <div class="small ml-3 text-right">
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
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
}
</script>
