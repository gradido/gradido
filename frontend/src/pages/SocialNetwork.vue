<template>
  <div class="social-network">
    <b-container class="bg-white appBoxShadow gradido-border-radius p-4 mt--3">
      <div class="h3">{{ $t('social-network.headline') }}</div>
      <div class="my-4 text-small">
        <span
          v-for="(line, lineNumber) of $t('social-network.text').split('\n')"
          v-bind:key="lineNumber"
        >
          {{ line }}
          <br />
        </span>
      </div>
      <b-row class="my-5">
        <b-col cols="12">
          <div class="text-lg-right">
            <b-button variant="gradido" :href="this.humhubUri" target="_blank">
              {{ $t('social-network.button') }}
            </b-button>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
<script>
export default {
  name: 'SocialNetwork',
  data() {
    return {
      humhubUri: 'not initialized',
    }
  },
  created() {
    this.humhubUri = 'https://community.gradido.net'
  },
}
</script>
