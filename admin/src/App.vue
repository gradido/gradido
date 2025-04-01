<template>
  <div id="app">
    <BToastOrchestrator />
    <default-layout v-if="$store.state.token" />
    <router-view v-else></router-view>
    <BModalOrchestrator />
  </div>
</template>

<script setup>
import defaultLayout from '@/layouts/defaultLayout'
import { BModalOrchestrator } from 'bootstrap-vue-next'
</script>
<style>
.pointer {
  cursor: pointer;
}

.pointer:hover {
  background-color: rgb(216 213 213);
}
</style>
