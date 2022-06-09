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
        <li>1</li>
        <li>2</li>
        <li>3</li>
      </ul>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.moderators') }}</div>
      <ul>
        <li>Bernd</li>
        <li>Elfi</li>
        <li>Manuela</li>
      </ul>
      <mail>support@supportemail.de</mail>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">{{ $t('community.statistic') }}</div>
      <div>
        <div>
          {{ $t('community.members') }}
          <span class="h4">1203</span>
        </div>
      </div>
    </b-container>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'Community',
  data() {
    return {
      CONFIG,
    }
  },
}
</script>
