<template>
  <div id="app">
    <BToastOrchestrator />
    <AppOutdatedBar />
    <default-layout v-if="$store.state.token" />
    <router-view v-else></router-view>
    <!-- ONE window for every face in this interface (a modal per row would build one per
         contribution and per message). Only while signed in: it asks the server for the
         full-size picture, and there is nobody to ask for before the moderator is. -->
    <member-avatar-zoom v-if="$store.state.token" />
    <BModalOrchestrator />
  </div>
</template>

<script setup>
import defaultLayout from '@/layouts/defaultLayout'
import AppOutdatedBar from '@/components/AppOutdatedBar'
import MemberAvatarZoom from '@/components/MemberAvatarZoom.vue'
import { BModalOrchestrator } from 'bootstrap-vue-next'
</script>
<style>
/* Render native controls (select popups, date pickers, scrollbars) to match the admin's
   light theme instead of the browser's OS default. The admin has one mode today; when a
   dark mode is added, this becomes theme-dependent like the wallet. */
:root {
  color-scheme: light;
}

.pointer {
  cursor: pointer;
}

.pointer:hover {
  background-color: rgb(216 213 213);
}
</style>
