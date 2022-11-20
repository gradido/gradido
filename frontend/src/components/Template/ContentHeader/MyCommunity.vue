<template>
  <div class="my-community">
    <div class="d-flex">
      <div>
        <b-button block variant="gradido" class="rounded-right" to="#edit">schreiben</b-button>
      </div>
      <div>
        <b-button block variant="gradido" class="rounded-0" to="#my">Meine Beiträge</b-button>
      </div>
      <div>
        <b-button block variant="gradido" class="rounded-left" to="#all">Community</b-button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'MyCommunity',
}
</script>
