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
      <ul>
        <li v-for="item in items" v-bind:key="item">{{ item.id }}</li>
      </ul>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.moderators') }}</div>
      <ul>
        <li v-for="item in items" v-bind:key="item">{{ item.id }}</li>
      </ul>
      <mail>{{ supportMail }}</mail>
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

export default {
  name: 'InfoStatistic',
  data() {
    return {
      CONFIG,
      items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      supportMail: 'support@supportemail.de',
      membersCount: '1203',
    }
  },
}
</script>
