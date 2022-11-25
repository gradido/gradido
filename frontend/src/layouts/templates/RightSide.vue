<template>
  <div class="right-side mt-3 mt-lg-0">
    <b-container v-if="path === '/overview'">
      <!-- <b-row>
        <b-col>
          <div class="p-4">
            <favourites />
          </div>
        </b-col>
      </b-row> -->
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 h-100">
            <last-transactions
              :transactions="transactions"
              :transactionCount="transactionCount"
              :transactionLinkCount="transactionLinkCount"
            />
          </div>
        </b-col>
      </b-row>
    </b-container>
    <!-- <b-container v-if="path === '/storys'">
      <b-row>
        <b-col>
          <div class="p-4">
            <favourites />
          </div>
        </b-col>
      </b-row>
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 h-100">
            <top-storys-by-month />
          </div>
        </b-col>
      </b-row>
    </b-container> -->
    <!-- <b-container v-if="path === '/addresses'">favourites ride side</b-container> -->
    <b-container v-if="path === '/send'">
      <!-- <b-row>
        <b-col>
          <div class="p-4">
            <favourites />
          </div>
        </b-col>
      </b-row> -->
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 h-100">
            <last-transactions
              :transactions="transactions"
              :transactionCount="transactionCount"
              :transactionLinkCount="transactionLinkCount"
            />
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-if="path === '/transactions'">
      <!-- <b-row>
        <b-col>
          <div class="p-4">
            <favourites />
          </div>
        </b-col>
      </b-row> -->
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 h-100">
            <last-transactions
              :transactions="transactions"
              :transactionCount="transactionCount"
              :transactionLinkCount="transactionLinkCount"
            />
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-if="path === '/gdt'">
      <!-- <b-row>
        <b-col>
          <div class="p-4">
            <favourites />
          </div>
        </b-col>
      </b-row> -->
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 h-100">
            <last-transactions
              :transactions="transactions"
              :transactionCount="transactionCount"
              :transactionLinkCount="transactionLinkCount"
            />
          </div>
        </b-col>
      </b-row>
    </b-container>
    <!-- <b-container v-if="path === '/profile'">
      <b-row>
        <b-col>
          <div class="p-4">
            <favourites />
          </div>
        </b-col>
      </b-row>
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 h-100">
            <your-overview />
          </div>
        </b-col>
      </b-row>
    </b-container> -->
    <b-container v-if="path === '/community'">
      <contribution-info />
      <last-contributions class="mt-5" />
    </b-container>
    <b-container v-if="path === '/settings'">settings ride side</b-container>
  </div>
</template>
<script>
import LastTransactions from '@/components/Template/RightSide/LastTransactions.vue'
// import Favourites from '@/components/Template/RightSide/Favourites.vue'
// import TopStorysByMonth from '@/components/Template/RightSide/TopStorysByMonth.vue'
import ContributionInfo from '@/components/Template/RightSide/ContributionInfo.vue'
import LastContributions from '@/components/Template/RightSide/LastContributions.vue'
// import YourOverview from '@/components/Template/RightSide/YourOverview.vue'

export default {
  name: 'RightSide',
  components: {
    LastTransactions,
    // Favourites,
    // TopStorysByMonth,
    LastContributions,
    ContributionInfo,
    // YourOverview,
  },
  props: {
    transactions: {
      default: () => [],
    },
    transactionCount: { type: Number, default: 0 },
    transactionLinkCount: { type: Number, default: 0 },
  },
  computed: {
    path() {
      return this.$route.path
    },
  },
}
</script>
