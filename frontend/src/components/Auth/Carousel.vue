<template>
  <div>
    <b-carousel :interval="30000">
      <b-carousel-slide img-src="/img/template/Foto_01.jpg"></b-carousel-slide>
      <b-carousel-slide img-src="https://picsum.photos/1324/2324/?image=50"></b-carousel-slide>
      <b-carousel-slide img-src="https://picsum.photos/1024/2024/?image=58"></b-carousel-slide>
      <b-carousel-slide img-src="https://picsum.photos/1024/2024/?image=83"></b-carousel-slide>
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
