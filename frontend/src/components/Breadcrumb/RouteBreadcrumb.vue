<template>
  <bread-crumb list-classes="breadcrumb-links breadcrumb-dark">
    <bread-crumb-item>
      <router-link to="/overview">
        <i class="fas fa-home"></i>
      </router-link>
    </bread-crumb-item>
    <bread-crumb-item
      v-for="(route, index) in $route.matched.slice()"
      :key="route.name"
      :active="index === $route.matched.length - 1"
      style="display:inline-block"
    >
      <router-link :to="{ name: route.name }" v-if="index < $route.matched.length - 1">
        {{ route.name }}
      </router-link>
      <span v-else>{{ route.name }}</span>
    </bread-crumb-item>
  </bread-crumb>
</template>

<script>
import BreadCrumb from './Breadcrumb'
import BreadCrumbItem from './BreadcrumbItem'

export default {
  name: 'route-breadcrumb',
  components: {
    BreadCrumb,
    BreadCrumbItem,
  },
  methods: {
    getBreadName(route) {
      return route.name
    },
  },
}
</script>

<style scoped></style>
