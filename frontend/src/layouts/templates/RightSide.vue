<template>
  <div class="right-side mt-3 mt-lg-0">
    <b-container v-if="path === '/overview'">
      <b-row>
        <b-col>
          <div class="p-4 bg-light rounded">a ride side overview</div>
        </b-col>
      </b-row>
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 bg-light rounded h-100">
            <div>b ride side overview</div>
            <div>b ride side overview</div>
            <div>b ride side overview</div>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-if="path === '/storys'">
      <b-row>
        <b-col>
          <div class="p-4 bg-light rounded">a storys ride side</div>
        </b-col>
      </b-row>
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 bg-light rounded h-100">
            <div>b storys ride side</div>
            <div>b storys ride side</div>
            <div>b storys ride side</div>
          </div>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-if="path === '/favourites'">favourites ride side</b-container>
    <b-container v-if="path === '/send'">
      <b-row>
        <b-col>
          <div class="p-4 bg-light rounded">a ride side send</div>
        </b-col>
      </b-row>
      <b-row class="mt-3 mt-lg-5">
        <b-col>
          <div class="p-4 bg-light rounded h-100">
            <div>b ride side send</div>
            <div>b ride side send</div>
            <div>b ride side send</div>
          </div>
        </b-col>
      </b-row>
    </b-container>
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
