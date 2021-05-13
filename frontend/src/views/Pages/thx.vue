<template>
  <div>
    <!-- Header -->
    <div class="header py-7 py-lg-8 pt-lg-9">
      <b-container>
        <div class="header-body text-center mb-7">
          <p class="h1">{{ $t('site.thx.title') }}</p>
          <p class="h4">{{ $t('site.thx.subtitle') }}</p>
          <hr />
          <b-button to="/login">{{ $t('login') }}</b-button>
        </div>
      </b-container>
    </div>
    <!-- Page content -->
  </div>
</template>
