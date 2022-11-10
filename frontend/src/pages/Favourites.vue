<template>
  <div>
    <b-card v-if="skeleton">
      {{ $t('favourites') }}
      <b-skeleton animation="wave" width="85%"></b-skeleton>
      <b-skeleton animation="wave" width="55%"></b-skeleton>
      <b-skeleton animation="wave" width="70%"></b-skeleton>
    </b-card>
    <b-card v-else>
      {{ $t('favourites') }}
    </b-card>
  </div>
</template>
<script>
export default {
  name: 'Favourites',
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
