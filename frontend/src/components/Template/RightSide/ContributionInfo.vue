<template>
  <div class="contribution-info d-none d-lg-block">
    <slot :name="$route.params.tab" />
  </div>
</template>
<script setup>
import { defineOptions } from 'vue'

defineOptions({ name: 'ContributionInfo' })
</script>
