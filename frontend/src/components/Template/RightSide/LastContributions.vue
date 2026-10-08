<template>
  <div class="last-contributions d-none d-lg-block">
    <BRow class="mb-5">
      <BCol class="h3">{{ $t('contribution.lastContribution') }}</BCol>
      <BCol cols="1" class="text-end">
        <IBiThreeDotsVertical />
      </BCol>
    </BRow>
  </div>
</template>
<script setup>
import { defineOptions } from 'vue'

defineOptions({ name: 'LastContributions' })
</script>
