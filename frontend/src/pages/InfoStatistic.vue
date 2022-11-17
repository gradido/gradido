<template>
  <div class="info-statistic">
    <b-container>
      <div class="h3">{{ $t('community.community') }}</div>
      <div class="h1">{{ CONFIG.COMMUNITY_NAME }}</div>
      <div>
        {{ CONFIG.COMMUNITY_DESCRIPTION }}
      </div>
      <div>
        {{ CONFIG.COMMUNITY_URL }}
      </div>
    </b-container>

    <hr />
    <b-container>
      <div class="h3">{{ $t('community.openContributionLinks') }}</div>
      <small v-if="count > 0">
        {{
          $t('community.openContributionLinkText', {
            name: CONFIG.COMMUNITY_NAME,
            count,
          })
        }}
      </small>
      <small v-else>
        {{ $t('community.noOpenContributionLinkText') }}
      </small>
      <ul>
        <li v-for="item in itemsContributionLinks" v-bind:key="item.id">
          <div>{{ item.name }}</div>
          <div>{{ item.memo }}</div>
          <div>
            {{ item.amount | GDD }}
            <span v-if="item.cycle === 'ONCE'">{{ $t('contribution-link.unique') }}</span>
          </div>
        </li>
      </ul>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.moderators') }}</div>
      <ul>
        <li v-for="item in itemsAdminUser" v-bind:key="item.id">
          {{ item.firstName }} {{ item.lastName }}
        </li>
      </ul>
      <b-link href="mailto: abc@example.com">{{ supportMail }}</b-link>
    </b-container>
    <!-- 
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.statistic') }}</div>
      <div>
        <div>
          {{ $t('community.members') }}
          <span class="h4">{{ totalUsers }}</span>
        </div>
        <div>
          {{ $t('statistic.totalGradidoCreated') }}
          <span class="h4">{{ totalGradidoCreated | GDD }}</span>
        </div>
        <div>
          {{ $t('statistic.totalGradidoDecayed') }}
          <span class="h4">{{ totalGradidoDecayed | GDD }}</span>
        </div>
        <div>
          {{ $t('statistic.totalGradidoAvailable') }}
          <span class="h4">{{ totalGradidoAvailable | GDD }}</span>
        </div>
      </div>
    </b-container>
    -->
  </div>
</template>
<script>
import CONFIG from '@/config'
import { listContributionLinks, searchAdminUsers } from '@/graphql/queries'
// , communityStatistics

export default {
  name: 'InfoStatistic',
  data() {
    return {
      CONFIG,
      count: null,
      countAdminUser: null,
      itemsContributionLinks: [],
      itemsAdminUser: [],
      supportMail: CONFIG.SUPPORT_MAIL,
      membersCount: '1203',
      totalUsers: null,
      totalGradidoCreated: null,
      totalGradidoDecayed: null,
      totalGradidoAvailable: null,
    }
  },
  methods: {
    getContributionLinks() {
      this.$apollo
        .query({
          query: listContributionLinks,
        })
        .then((result) => {
          this.count = result.data.listContributionLinks.count
          this.itemsContributionLinks = result.data.listContributionLinks.links
        })
        .catch(() => {
          this.toastError('listContributionLinks has no result, use default data')
        })
    },
    getAdminUsers() {
      this.$apollo
        .query({
          query: searchAdminUsers,
        })
        .then((result) => {
          this.countAdminUser = result.data.searchAdminUsers.userCount
          this.itemsAdminUser = result.data.searchAdminUsers.userList
        })
        .catch(() => {
          this.toastError('searchAdminUsers has no result, use default data')
        })
    },
    // getCommunityStatistics() {
    //   this.$apollo
    //     .query({
    //       query: communityStatistics,
    //       // cache statistics here? default is "fetchPolicy: 'network-only'"
    //     })
    //     .then((result) => {
    //       this.totalUsers = result.data.communityStatistics.totalUsers
    //       this.totalGradidoCreated = result.data.communityStatistics.totalGradidoCreated
    //       this.totalGradidoDecayed =
    //         Number(result.data.communityStatistics.totalGradidoDecayed) +
    //         Number(result.data.communityStatistics.totalGradidoUnbookedDecayed)
    //       this.totalGradidoAvailable = result.data.communityStatistics.totalGradidoAvailable
    //     })
    //     .catch(() => {
    //       this.toastError('communityStatistics has no result, use default data')
    //     })
    // },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.getContributionLinks()
    this.getAdminUsers()
    // this.getCommunityStatistics()
    this.updateTransactions(0)
  },
}
</script>
