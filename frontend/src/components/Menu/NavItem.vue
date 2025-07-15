<template>
  <li :class="['nav-item', { active: isActive }]">
    <span v-if="isActive" class="nav-link active" aria-current="page">
      <slot></slot>
    </span>
    <BNavItem v-else v-bind="props" class="auth-navbar"><slot></slot></BNavItem>
  </li>
</template>

<script setup>
import { defineProps } from 'vue'
import { RouterLink, useLink } from 'vue-router'

const props = defineProps({
  ...RouterLink.props,
})

const { href, isActive } = useLink(props)
</script>
