<template>
  <div>
    <!-- Header -->
    <div class="header bg-gradient-info py-7 py-lg-8 pt-lg-9">
      <b-container>
        <div class="header-body text-center mb-7">
          <b-row class="justify-content-center">
            <b-col xl="5" lg="6" md="6" class="px-5">
              <h1 class="text-light">{{ $t('site.404.oops')  }}</h1>
              <p class="text-lead text-white">{{ $t('site.404.text')  }}</p>

              <router-link to="/dashboard" class="font-weight-bold text-white mt-5"> {{ $t('site.404.back')  }}</router-link>
            </b-col>
          </b-row>
        </div>
      </b-container>
      <div class="separator separator-bottom separator-skew zindex-100">
        <svg x="0" y="0" viewBox="0 0 2560 100" preserveAspectRatio="none" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <polygon class="fill-default" points="2560 0 2560 100 0 100"></polygon>
        </svg>
      </div>
    </div>
    <!-- Page content -->
    <section class="py-6">
      <b-container >
        <b-row align-v="center" class="row-grid">
          <b-col md="6">
            <b-img src="img/theme/landing-1.png" fluid />
          </b-col>
          <b-col md="6">
            <div class="pr-md-5">
              <h1 class="text-light"> {{ $t('site.landing1.explore') }}</h1>
              <p class="text-light">{{ $t('site.landing1.text') }}</p>
              <router-link to="/user" class="font-weight-bold text-warning mt-5">{{ $t('site.landing1.link') }}</router-link>
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>
  </div>
</template>

<script>

export default {
  name: 'not-found'
};
</script>
