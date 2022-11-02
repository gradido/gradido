<template>
  <div class="content-footer">
    <hr />
    <div align-v="center" class="mt-4 mb-4 justify-content-lg-between">
      <b-col>
        <div class="copyright text-center text-lg-center text-muted">
          {{ $t('footer.copyright.year', { year }) }}
          <a
            :href="`https://gradido.net/${$i18n.locale}`"
            class="font-weight-bold ml-1"
            target="_blank"
          >
            {{ $t('footer.copyright.link') }}
          </a>
          {{ $t('math.pipe') }}
          <a href="https://github.com/gradido/gradido/releases/latest" target="_blank">
            {{ $t('footer.app_version', { version }) }}
          </a>
          <a
            v-if="hash"
            :href="'https://github.com/gradido/gradido/commit/' + hash"
            target="_blank"
          >
            {{ $t('footer.short_hash', { shortHash }) }}
          </a>
        </div>
      </b-col>
    </div>
  </div>
</template>
<script>
import CONFIG from '../config'

export default {
  name: 'ContentFooter',
  data() {
    return {
      year: new Date().getFullYear(),
      version: CONFIG.APP_VERSION,
      hash: CONFIG.BUILD_COMMIT,
      shortHash: CONFIG.BUILD_COMMIT_SHORT,
    }
  },
}
</script>
