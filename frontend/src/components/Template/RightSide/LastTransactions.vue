<template>
  <div class="rightside-last-transactions d-none d-lg-block">
    <b-row class="mb-3">
      <b-col class="h3">{{ $t('transaction.lastTransactions') }}</b-col>
      <!-- <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col> -->
    </b-row>

    <div v-for="(transaction, index) in transactions" :key="transaction.id">
      <b-row
        align-v="center"
        v-if="
          index <= 8 &&
          transaction.typeId !== 'DECAY' &&
          transaction.typeId !== 'LINK_SUMMARY' &&
          transaction.typeId !== 'CREATION'
        "
        class="mb-4"
      >
        <b-col cols="auto">
          <div class="align-items-center">
            <avatar
              :size="72"
              :color="'#fff'"
              :username="`${transaction.linkedUser.firstName} ${transaction.linkedUser.lastName}`"
              :initials="`${transaction.linkedUser.firstName[0]}${transaction.linkedUser.lastName[0]}`"
            ></avatar>
          </div>
        </b-col>
        <b-col class="p-1">
          <b-row>
            <b-col>
              <div class="font-weight-bold">
                <name
                  :linkedUser="transaction.linkedUser"
                  v-on="$listeners"
                  fontColor="text-dark"
                />
              </div>
              <div class="d-flex mt-3">
                <div class="small">
                  {{ transaction.amount | GDD }}
                </div>
                <div class="small ml-3 text-right">
                  {{ $d(new Date(transaction.balanceDate), 'short') }}
                </div>
              </div>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
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
