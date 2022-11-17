<template>
  <div class="p-5">
    <b-container v-if="path === '/overview'">overview ride side</b-container>
    <b-container v-if="path === '/storys'">storys ride side</b-container>
    <b-container v-if="path === '/favourites'">favourites ride side</b-container>
    <b-container v-if="path === '/send'">send ride side</b-container>
    <b-container v-if="path === '/transactions'">transactions ride side</b-container>
    <b-container v-if="path === '/profile'">profile ride side</b-container>
    <b-container v-if="path === '/community'">community ride side</b-container>
    <b-container v-if="path === '/settings'">settings ride side</b-container>
  </div>
</template>
<script>
export default {
  name: 'RightSide',
  computed: {
    path() {
      return this.$route.path
    },
  },
}
</script>
