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
      <small>
        {{
          $t('community.openContributionLinkText', {
            _name_: CONFIG.COMMUNITY_NAME,
            _count_: count,
          })
        }}
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
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.statistic') }}</div>
      <div>
        <div>
          {{ $t('community.members') }}
          <span class="h4">{{ totalUsers }}</span>
        </div>
        <div>
          {{ $t('statistic.activeUsers') }}
          <span class="h4">{{ activeUsers }}</span>
        </div>
        <div>
          {{ $t('statistic.deletedUsers') }}
          <span class="h4">{{ deletedUsers }}</span>
        </div>
        <div>
          {{ $t('statistic.totalGradidoCreated') }}
          <span class="h4">{{ totalGradidoCreated }}</span>
        </div>
        <div>
          {{ $t('statistic.totalGradidoDecayed') }}
          <span class="h4">{{ totalGradidoDecayed }}</span>
        </div>
        <div>
          {{ $t('statistic.totalGradidoAvailable') }}
          <span class="h4">{{ totalGradidoAvailable }}</span>
        </div>
        <div>
          {{ $t('statistic.totalGradidoUnbookedDecayed') }}
          <span class="h4">{{ totalGradidoUnbookedDecayed }}</span>
        </div>
      </div>
    </b-container>
  </div>
</template>
<script>
import CONFIG from '@/config'
import { listContributionLinks, communityStatistics, searchAdminUsers } from '@/graphql/queries'

export default {
  name: 'InfoStatistic',
  data() {
    return {
      CONFIG,
      count: null,
      countAdminUser: null,
      itemsContributionLinks: [],
      itemsAdminUser: [],
      supportMail: 'support@supportemail.de',
      membersCount: '1203',
      totalUsers: null,
      activeUsers: null,
      deletedUsers: null,
      totalGradidoCreated: null,
      totalGradidoDecayed: null,
      totalGradidoAvailable: null,
      totalGradidoUnbookedDecayed: null,
    }
  },
  methods: {
    async getContributionLinks() {
      this.$apollo
        .query({
          query: listContributionLinks,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.count = result.data.listContributionLinks.count
          this.itemsContributionLinks = result.data.listContributionLinks.links
        })
        .catch(() => {
          this.toastError('listContributionLinks has no result, use default data')
        })
    },
    async getAdminUsers() {
      this.$apollo
        .query({
          query: searchAdminUsers,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.countAdminUser = result.data.searchAdminUsers.userCount
          this.itemsAdminUser = result.data.searchAdminUsers.userList
        })
        .catch(() => {
          this.toastError('searchAdminUsers has no result, use default data')
        })
    },
    async getCommunityStatistics() {
      this.$apollo
        .query({
          query: communityStatistics,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          this.totalUsers = result.data.communityStatistics.totalUsers
          this.activeUsers = result.data.communityStatistics.activeUsers
          this.deletedUsers = result.data.communityStatistics.deletedUsers
          this.totalGradidoCreated = result.data.communityStatistics.totalGradidoCreated
          this.totalGradidoDecayed = result.data.communityStatistics.totalGradidoDecayed
          this.totalGradidoAvailable = result.data.communityStatistics.totalGradidoAvailable
          this.totalGradidoUnbookedDecayed =
            result.data.communityStatistics.totalGradidoUnbookedDecayed
        })
        .catch(() => {
          this.toastError('listContributionLinks has no result, use default data')
        })
    },
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.getContributionLinks()
    this.getAdminUsers()
    this.getCommunityStatistics()
    this.updateTransactions(0)
  },
}
</script>
