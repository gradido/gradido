<template>
  <div>
    <!-- Header -->
    <div class="header bg-gradient-info py-7 py-lg-8 pt-lg-9">
      <b-container>
        <div class="header-body text-center mb-7">
          <p class="h1">{{ $t('site.thx.title') }}</p>
          <p class="h4">{{ $t('site.thx.subtitle') }}</p>
          <hr />
          <b-button to="/login">{{ $t('login') }}</b-button>
        </div>
      </b-container>
      <div class="separator separator-bottom separator-skew zindex-100">
        <svg
          x="0"
          y="0"
          viewBox="0 0 2560 100"
          preserveAspectRatio="none"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon class="fill-default" points="2560 0 2560 100 0 100"></polygon>
        </svg>
      </div>
    </div>
    <!-- Page content -->
  </div>
</template>
<script>

export default ({
  created() {
    console.log(this.$route.params.id)
    
  },
})
</script>

 