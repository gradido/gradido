<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="settings-appearance">
    <BRow>
      <BCol cols="12" md="6" lg="6">{{ $t('language') }}</BCol>
      <BCol cols="12" md="6" lg="6" class="text-end">
        <user-language />
      </BCol>
    </BRow>
  </div>
</template>
<script setup>
import UserLanguage from '@/components/LanguageSwitch2.vue'
import { BRow, BCol } from 'bootstrap-vue-next'
</script>
