<template>
  <div>
    <b-card v-if="skeleton">
      {{ $t('navigation.topStories') }}
      <b-skeleton animation="wave" width="85%"></b-skeleton>
      <b-skeleton animation="wave" width="55%"></b-skeleton>
      <b-skeleton animation="wave" width="70%"></b-skeleton>
    </b-card>
    <b-card v-else>
      {{ $t('navigation.topStories') }}
    </b-card>
  </div>
</template>
<script>
export default {
  name: 'TopStorys',
  data() {
    return {
      skeleton: true,
    }
  },
  created() {
    setTimeout(() => {
      this.skeleton = false
    }, 1500)
  },
}
</script>
