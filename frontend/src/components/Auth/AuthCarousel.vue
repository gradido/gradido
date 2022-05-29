<template>
  <div>
    <b-carousel :interval="13000">
      <b-carousel-slide img-src="/img/template/Foto_01_2400_small.jpg"></b-carousel-slide>
      <b-carousel-slide img-src="/img/template/Foto_02_2400_small.jpg"></b-carousel-slide>
      <b-carousel-slide img-src="/img/template/Foto_03_2400_small.jpg"></b-carousel-slide>
    </b-carousel>
  </div>
</template>

<script>
export default {
  name: 'AuthCarousel',
}
</script>

<style>
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
