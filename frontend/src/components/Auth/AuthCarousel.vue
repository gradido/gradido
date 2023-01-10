<template>
  <div>
    <b-carousel :interval="13000">
      <b-carousel-slide img-src="/img/template/Foto_01_2400_small.jpg">
        <div class="caption-first-text">{{ $t('auth.left.gratitude') }}</div>
        <div class="caption-second-text">{{ $t('auth.left.oneGratitude') }}</div>
      </b-carousel-slide>
      <b-carousel-slide img-src="/img/template/Foto_02_2400_small.jpg">
        <div class="caption-first-text">{{ $t('auth.left.dignity') }}</div>
        <div class="caption-second-text">{{ $t('auth.left.oneDignity') }}</div>
      </b-carousel-slide>
      <b-carousel-slide img-src="/img/template/Foto_03_2400_small.jpg">
        <div class="caption-first-text">{{ $t('auth.left.donation') }}</div>
        <div class="caption-second-text">{{ $t('auth.left.oneDonation') }}</div>
      </b-carousel-slide>
    </b-carousel>
  </div>
</template>

<script>
export default {
  name: 'AuthCarousel',
}
</script>

<style>
.carousel-caption {
  color: #fff;
  top: 317px;
  text-shadow: 2px 2px 8px #000000;
  font-size: xx-large;
}

.caption-first-text {
  font-size: 150%;
}

.caption-second-text {
  font-size: 80%;
}

.carousel {
  position: relative;
  height: 110%;
  top: -16px;
}

.carousel-inner {
  height: 100%;
  border-radius: 0% 49% 49% 0% / 0% 51% 49% 0%;
  -webkit-border-radius: 0% 49% 49% 0% / 0% 51% 49% 0%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
}
</style>
