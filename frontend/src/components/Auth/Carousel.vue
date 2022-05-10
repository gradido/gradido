<template>
  <div>
    <b-carousel
      id="carousel-1"
      v-model="slide"
      :interval="30000"
      controls
      indicators
      @sliding-start="onSlideStart"
      @sliding-end="onSlideEnd"
    >
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
  data() {
    return {
      slide: 0,
      sliding: null,
    }
  },
  methods: {
    onSlideStart(slide) {
      this.sliding = true
    },
    onSlideEnd(slide) {
      this.sliding = false
    },
  },
}
</script>
<style>
.carousel {
  position: relative;
  height: 120%;
  top: -138px;
  bottom: -369px;
}

.carousel-inner {
  background-color: brown;
  height: 100%;
  border-radius: 0 94% 63% 0/0 78% 54% 0;
}
</style>
