<template>
  <div>
    <div>
      <b-container v-if="path === '/overview'">
        <b-row>
          <b-col cols="5">
            <div class="p-4 bg-light rounded">a overview</div>
          </b-col>
          <b-col cols="7">
            <div class="p-4 bg-light rounded">b overview</div>
          </b-col>
        </b-row>
      </b-container>
      <b-container v-if="path === '/storys'"><h2>Deine Community im Überblick</h2></b-container>
      <b-container v-if="path === '/favourites'">favourites content header</b-container>
      <b-container v-if="path === '/send'">
        <b-row>
          <b-col cols="6">
            <div class="p-4 bg-light rounded">a send</div>
          </b-col>
          <b-col cols="6">
            <div class="p-4 bg-light rounded">b send</div>
          </b-col>
        </b-row>
      </b-container>
      <b-container v-if="path === '/transactions'">transactions content header</b-container>
      <b-container v-if="path === '/profile'">
        <b-row>
          <b-col>
            <div class="p-4 bg-light rounded">
              <b-row>
                <b-col cols="8" class="h3">Zeige deiner Community wer du bist.</b-col>
                <b-col cols="4" class="text-small text-muted">vor 4 Stunden geändert</b-col>
              </b-row>
              <b-row>
                <b-col cols="2" class=""><b-avatar size="72px" rounded="lg"></b-avatar></b-col>
                <b-col cols="10" class="">Text</b-col>
              </b-row>
            </div>
          </b-col>
        </b-row>
      </b-container>
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
