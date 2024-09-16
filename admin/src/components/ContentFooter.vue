<template>
  <hr class="mb-0" />
  <div class="content-footer">
    <BTr class="mt-4 mb-4 justify-content-lg-between">
      <BCol>
        <div class="copyright text-center text-lg-center text-muted">
          {{ $t('footer.copyright.year', { year }) }}
          <a
            :href="`https://gradido.net/${$i18n.locale}`"
            class="fw-bold ms-1 link-underline link-underline-opacity-0 link-underline-opacity-100-hover"
            target="_blank"
          >
            {{ $t('footer.copyright.link') }}
          </a>
          |
          <a
            href="https://github.com/gradido/gradido/releases/latest"
            target="_blank"
            class="link-underline link-underline-opacity-0 link-underline-opacity-100-hover"
          >
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
      </BCol>
    </BTr>
  </div>
</template>
<script setup>
import CONFIG from '../config'
import { BTr, BCol } from 'bootstrap-vue-next'

const year = new Date().getFullYear()
const version = CONFIG.APP_VERSION
const hash = CONFIG.BUILD_COMMIT
const shortHash = CONFIG.BUILD_COMMIT_SHORT
</script>
<style lang="scss" scoped>
.content-footer {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
