<template>
  <div>
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
        {{ $t('community.openContributionLinkText', { _name_: CONFIG.COMMUNITY_NAME }) }}
      </small>
      Momentan gibt es aktuell {{ count }} Aktionen.
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
        <li v-for="item in itemsModerators" v-bind:key="item.id">{{ item.name }}</li>
      </ul>
      <b-link href="mailto: abc@example.com">{{ supportMail }}</b-link>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.statistic') }}</div>
      <div>
        <div>
          {{ $t('community.members') }}
          <span class="h4">{{ membersCount }}</span>
        </div>
      </div>
    </b-container>
  </div>
</template>
<script>
import CONFIG from '@/config'
import { listContributionLinks } from '@/graphql/queries'

export default {
  name: 'InfoStatistic',
  data() {
    return {
      CONFIG,
      count: null,
      itemsContributionLinks: [],
      itemsModerators: [
        { id: 1, name: 'name1' },
        { id: 2, name: 'name2' },
        { id: 3, name: 'name3' },
      ],
      supportMail: 'support@supportemail.de',
      membersCount: '1203',
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
    updateTransactions(pagination) {
      this.$emit('update-transactions', pagination)
    },
  },
  created() {
    this.getContributionLinks()
    this.updateTransactions(0)
  },
}
</script>
