<template>
  <footer class="footer">
    <b-row class="mt-lg-7 mt-md-6 mt-4">
      <b-col class="col-12 col-md-12 col-lg-6">
        <div
          class="d-flex justify-content-center justify-content-md-center justify-content-lg-start ml-3"
        >
          <b-nav class="nav-footer">
            <b-nav-item :href="`https://gradido.net/${$i18n.locale}/impressum/`" target="_blank">
              {{ $t('footer.imprint') }}
            </b-nav-item>
            <b-nav-item :href="`https://gradido.net/${$i18n.locale}/datenschutz/`" target="_blank">
              {{ $t('footer.privacy_policy') }}
            </b-nav-item>
          </b-nav>
        </div>
      </b-col>
      <b-col class="col-12 col-md-12 col-lg-6 mt-4 mb-4 mt-lg-0 mb-lg-0">
        <div class="text-center ml-3 ml-lg-0 text-lg-right pt-1">
          {{ $t('followUs') }}
          <b-link href="https://www.facebook.com/groups/Gradido/" target="_blank">
            <b-icon-facebook class="ml-3 mr-3 c-grey" font-scale="1"></b-icon-facebook>
          </b-link>
          <b-link href="https://twitter.com/gradido" target="_blank">
            <b-icon-twitter class="mr-3 c-grey" font-scale="1"></b-icon-twitter>
          </b-link>
          <b-link href="https://www.youtube.com/c/GradidoNet" target="_blank">
            <b-icon-youtube class="mr-3 c-grey" font-scale="1"></b-icon-youtube>
          </b-link>

          <b-link href="https://t.me/Gradido" target="_blank">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-telegram c-grey"
              viewBox="0 0 16 16"
            >
              <path
                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z"
              />
            </svg>
          </b-link>
        </div>
      </b-col>
    </b-row>
  </footer>
</template>

<script>
export default {
  name: 'AuthFooter',
}
</script>

<style>
.bi-telegram {
  margin-top: -5px;
}
</style>
