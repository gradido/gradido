<template>
  <div>
    <b-carousel :interval="3000">
      <b-carousel-slide img-src="/img/template/Foto_01_2400_small.jpg"></b-carousel-slide>
      <b-carousel-slide img-src="/img/template/Foto_02_2400_small.jpg"></b-carousel-slide>
      <b-carousel-slide img-src="/img/template/Foto_03_2400_small.jpg"></b-carousel-slide>
      <b-carousel-slide img-src="/img/template/Foto_04_2400_small.jpg"></b-carousel-slide>
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
}
</style>
