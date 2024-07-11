<template>
  <div id="app">
    <default-layout v-if="$store.state.token" />
    <router-view v-else></router-view>
  </div>
</template>

<script>
import defaultLayout from '@/layouts/defaultLayout'

export default {
  name: 'app',
  components: { defaultLayout },
}
</script>
<style>
.pointer {
  cursor: pointer;
}
.pointer:hover {
  background-color: rgb(216, 213, 213);
}
</style>
