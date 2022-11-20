<template>
  <div class="last-contributions">
    <b-row class="mb-5">
      <b-col class="h3">Letzte Beiträge</b-col>
      <b-col cols="1" class="text-right">
        <b-icon icon="three-dots-vertical"></b-icon>
      </b-col>
    </b-row>
    <b-card class="mb-4">letzter Beitrag</b-card>
    <b-card class="mb-4">vorletzter Beitrag</b-card>
    <b-card class="mb-4">vor vorletzter Beitrag</b-card>
  </div>
</template>
<script>
export default {
  name: 'LastContributions',
}
</script>
