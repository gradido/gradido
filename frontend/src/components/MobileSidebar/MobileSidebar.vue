<template>
  <BCollapse
    id="sidebar-mobile"
    sidebar-class="sidebar-radius"
    :backdrop="true"
    bg-variant="white"
    no-header-close
    horizontal
    skip-animation
    :model-value="open"
    @update:model-value="emit('update:open', $event)"
  >
    <div class="mobile-sidebar-wrapper py-2">
      <BImg src="img/svg/lines.png" />
      <sidebar
        :shadow="false"
        @admin="emit('admin')"
        @close-sidebar="closeMenu"
        @logout="emit('logout')"
      />
    </div>
    <div class="simple-overlay" data-test="mobile-sidebar-overlay" @click="closeMenu" />
  </BCollapse>
</template>

<script setup>
import { onUnmounted, watch } from 'vue'
import { lock, unlock } from 'tua-body-scroll-lock'

const props = defineProps({
  /**
   * Open or shut, kept by the layout (v-model:open): the opener in the navbar has to say
   * which, and it is told the same value the drawer follows (see the note at Navbar's opener).
   */
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['admin', 'logout', 'update:open'])

const closeMenu = () => {
  emit('update:open', false)
}

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      lock()
    } else {
      unlock()
    }
  },
)

onUnmounted(() => {
  unlock()
})
</script>

<style>
.mobile-sidebar-wrapper {
  width: 220px;
  background-color: #fff;
  z-index: 1001;
  position: absolute;
  border-bottom-right-radius: 26px;
  border-top-right-radius: 26px;
  top: 0;
  bottom: 0;
}

#sidebar-mobile {
  width: 220px;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1001;
}

.simple-overlay {
  position: absolute;
  left: 200px;
  top: 0;
  bottom: 0;
  background-color: #212529;
  z-index: 99;
  opacity: 0.6;
  width: calc(100vw - 200px);
}
</style>
