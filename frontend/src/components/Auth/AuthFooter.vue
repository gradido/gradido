<template>
  <footer class="footer">
    <BRow class="mt-lg-7 mt-md-6 mt-4">
      <BCol class="col-12 col-md-12 col-lg-6">
        <div
          class="d-flex justify-content-center justify-content-md-center justify-content-lg-start ms-3"
        >
          <BNav class="nav-footer">
            <BNavItem :href="`https://gradido.net/${$i18n.locale}/impressum/`" target="_blank">
              {{ $t('footer.imprint') }}
            </BNavItem>
            <BNavItem :href="`https://gradido.net/${$i18n.locale}/datenschutz/`" target="_blank">
              {{ $t('footer.privacy_policy') }}
            </BNavItem>
          </BNav>
        </div>
      </BCol>
      <BCol class="col-12 col-md-12 col-lg-6 mt-4 mb-4 mt-lg-0 mb-lg-0">
        <div class="d-flex align-items-center ms-3 ms-lg-0 text-lg-end pt-1">
          {{ $t('followUs') }}
          <BLink href="https://www.facebook.com/groups/Gradido/" target="_blank">
            <IBiFacebook class="ms-3 me-3 c-grey" />
          </BLink>
          <BLink href="https://twitter.com/gradido" target="_blank">
            <IBiTwitterX class="me-3 c-grey" font-scale="1" />
          </BLink>
          <BLink href="https://www.youtube.com/c/GradidoNet" target="_blank">
            <IBiYoutube class="me-3 c-grey" font-scale="1" />
          </BLink>

          <BLink href="https://t.me/Gradido" target="_blank">
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
          </BLink>
        </div>
      </BCol>
    </BRow>
  </footer>
</template>

<script>
export default {
  name: 'AuthFooter',
}
</script>

<style scoped>
:deep(.nav-link) {
  color: #383838 !important;
}
</style>
