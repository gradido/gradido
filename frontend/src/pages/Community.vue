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
      <div class="h3">öffentliche Beitragslinkliste</div>
      <small>
        Folgende automatische Schöpfungen werden zur Zeit durch die Gemeinschaft
        {{ CONFIG.COMMUNITY_NAME }} bereitgestellt.
      </small>
      <ul>
        <li>1</li>
        <li>2</li>
        <li>3</li>
      </ul>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">Moderatoren</div>
      <ul>
        <li>Bernd Hückstedt</li>
        <li>Elfi</li>
        <li>Manuela</li>
      </ul>
      <mail>suport@gradido.net</mail>
    </b-container>
    <hr />
    <b-container>
      <div class="h3">Statistik</div>
      <div>
        <div>
          Mitglieder
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
