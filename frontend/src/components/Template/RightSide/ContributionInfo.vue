<template>
  <div class="contribution-info d-none d-lg-block">
    <slot :name="$route.params.tab" />
  </div>
</template>
<script>
export default {
  name: 'ContributionInfo',
}
</script>
