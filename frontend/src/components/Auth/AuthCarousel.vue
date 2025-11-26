<template>
  <div>
    <BCarousel :interval="13000" ride="carousel">
      <BCarouselSlide img-src="/img/template/Foto_01_2400_small.jpg">
        <div class="caption-first-text">{{ $t('auth.left.gratitude') }}</div>
        <div class="caption-second-text">{{ $t('auth.left.oneGratitude') }}</div>
      </BCarouselSlide>
      <BCarouselSlide img-src="/img/template/Foto_05_2400_small.jpg">
        <div class="caption-first-text">{{ $t('auth.left.dignity') }}</div>
        <div class="caption-second-text">{{ $t('auth.left.oneDignity') }}</div>
      </BCarouselSlide>
      <BCarouselSlide img-src="/img/template/Foto_04_2400_small.jpg">
        <div class="caption-first-text">{{ $t('auth.left.donation') }}</div>
        <div class="caption-second-text">{{ $t('auth.left.oneDonation') }}</div>
      </BCarouselSlide>
    </BCarousel>
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
  text-shadow: 2px 2px 8px #000;
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
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
}
</style>
