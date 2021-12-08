<template>
  <div>
      
   
      <div class="px-3 py-2">
        <p></p>
        <div class="mb-6">
          <b-nav vertical class="w-200">
            <b-nav-item to="/overview" class="mb-3" active>Overview</b-nav-item>
            <b-nav-item to="/send" class="mb-3">Link</b-nav-item>
            <b-nav-item to="/transactions" class="mb-3">Another Link</b-nav-item>
            <b-nav-item to="/profile" class="mb-3" disabled>Disabled</b-nav-item>
          </b-nav>
          <hr />
          <b-nav vertical class="w-100">
            <b-nav-item class="mb-3" active>Active</b-nav-item>
            <b-nav-item class="mb-3">Link</b-nav-item>
            <b-nav-item class="mb-3">Another Link</b-nav-item>
            <b-nav-item class="mb-3" disabled>Disabled</b-nav-item>
          </b-nav>
        </div>
      </div>
 
  </div>
</template>
<script>
export default {
  name: 'sidebar',
}
</script>
