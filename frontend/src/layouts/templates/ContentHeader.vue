<template>
  <div>
    <div class="p-5">
      <b-container v-if="path === '/overview'">overview content header</b-container>
      <b-container v-if="path === '/storys'">storys content header</b-container>
      <b-container v-if="path === '/favourites'">favourites content header</b-container>
      <b-container v-if="path === '/send'">send content header</b-container>
      <b-container v-if="path === '/transactions'">transactions content header</b-container>
      <b-container v-if="path === '/profile'">profile content header</b-container>
      <b-container v-if="path === '/community'">community content header</b-container>
      <b-container v-if="path === '/settings'">settings content header</b-container>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContentHeader',
  computed: {
    path() {
      return this.$route.path
    },
  },
}
</script>
