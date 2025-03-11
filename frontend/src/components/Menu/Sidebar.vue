<template>
  <div id="component-sidebar">
    <div
      id="side-menu"
      ref="sideMenu"
      class="gradido-border-radius pt-2 bg-white"
      :class="shadow ? 'app-box-shadow' : ''"
    >
      <div class="mb-3 mt-3">
        <BNav vertical class="w-200">
          <BNavItem to="/overview" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-fa-home class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.overview') }}</span>
            </div>
          </BNavItem>
          <BNavItem to="/send" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <IBiCash class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.send') }}</span>
            </div>
          </BNavItem>
          <BNavItem to="/transactions" :class="transactionClass" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-ion-layers-sharp class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.transactions') }}</span>
            </div>
          </BNavItem>
          <BNavItem ref="communityLink" to="/community" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-people-group class="svg-icon" />
              <span class="ms-2">{{ $t('creation') }}</span>
            </div>
          </BNavItem>
          <BNavItem to="/information" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-information class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.info') }}</span>
            </div>
          </BNavItem>
          <BNavItem v-if="isHumhub" to="/circles" class="mb-3" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-arcticons-circles class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.circles') }}</span>
            </div>
          </BNavItem>
          <BNavItem v-if="isGMS" to="/usersearch" active-class="active-route">
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-map-search class="svg-icon" />
              <span class="ms-2">{{ $t('navigation.usersearch') }}</span>
            </div>
          </BNavItem>
        </BNav>
        <hr class="m-3" />
        <BNav vertical class="w-100">
          <BNavItem
            to="/settings"
            class="mb-3 d-block"
            active-class="active-route"
            data-test="settings-menu"
          >
            <div class="sidebar-menu-item-wrapper">
              <div>
                <i-mdi-settings class="svg-icon" />
                <span class="ms-2">{{ $t('navigation.settings') }}</span>
              </div>
              <BBadge v-if="!$store.state.username" variant="warning">
                {{ $t('settings.newSettings') }}
              </BBadge>
            </div>
          </BNavItem>
          <BNavItem
            v-if="$store.state.roles && $store.state.roles.length > 0"
            class="mb-3 text-light"
            active-class="active-route"
            @click="$emit('admin')"
          >
            <div class="sidebar-menu-item-wrapper">
              <IBiShieldCheck />
              <span class="ms-2">
                {{ $t('navigation.admin_area') }}
              </span>
            </div>
          </BNavItem>
          <BNavItem
            class="fw-bold"
            active-class="active-route"
            data-test="logout-menu"
            @click="$emit('logout')"
          >
            <div class="sidebar-menu-item-wrapper">
              <BImg src="/img/svg/logout.svg" height="20" class="svg-icon" />
              <span class="ms-2 logout-text">{{ $t('navigation.logout') }}</span>
            </div>
          </BNavItem>
        </BNav>
      </div>
    </div>
  </div>
</template>
<script setup>
import CONFIG from '../../config'
import { useRoute } from 'vue-router'
import { ref, watch, computed } from 'vue'

const props = defineProps({
  shadow: { type: Boolean, default: true },
})

const emit = defineEmits(['closeSidebar'])

const route = useRoute()
const communityLink = ref(null)

const transactionClass = computed(() => {
  if (route.path === '/gdt') {
    return 'mb-3 active-route'
  }
  return 'mb-3'
})
const isHumhub = computed(() => {
  return CONFIG.HUMHUB_ACTIVE === 'true'
})
const isGMS = computed(() => {
  return CONFIG.GMS_ACTIVE === 'true'
})

watch(
  () => route.path,
  () => {
    const link = [...communityLink.value.$el.children][0]
    if (route.path.includes('community')) {
      link.classList.add('active-route')
      link.classList.add('router-link-exact-active')
    } else {
      link.classList.remove('active-route')
      link.classList.remove('router-link-exact-active')
    }
    emit('closeSidebar')
  },
)
</script>
<style scoped>
:deep(.nav-item > a) {
  color: rgb(56 56 56) !important;
  border-left: 4px transparent solid;
  display: block;
}

:deep(.active-route) {
  display: block;
  font-weight: bold;
  color: rgb(2 2 1);
  border-left-color: rgb(219 129 19) !important;
}

:deep(.nav-link) {
  padding: 0;
}

.logout-text {
  color: #cd5556;
}

.sidebar-menu-item-wrapper {
  padding: 4px 12px;
}

.svg-icon {
  filter: brightness(1) invert(0);
}

.active-route .svg-icon {
  filter: brightness(0) invert(0);
}

#component-sidebar {
  min-width: 200px;
}

@media screen and (width >= 1025px) {
  #side-menu {
    max-width: 180px;
  }

  #component-sidebar {
    min-width: 180px;
  }
}

/*
@media screen and (min-width: 1075px) {
  #side-menu {
    max-width: 200px;
  }
  #component-sidebar {
    min-width: 200px;
  }
}
@media screen and (max-width: 1108px) {
  #side-menu {
    max-width: 100%;
  }
  #component-sidebar {
    max-width: 100%;
  }
} */
</style>
