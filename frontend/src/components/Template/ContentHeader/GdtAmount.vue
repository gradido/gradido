<template>
  <div>
    <div class="text-center">
      <b-badge class="position-absolute mt--2 ml--4 px-3 zindex1" variant="light">GDT</b-badge>
    </div>

    <div
      class="wallet-amount bg-white appBoxShadow gradido-border-radius p-4 border border-light opacity-05"
    >
      <b-row>
        <b-col cols="9" class="h4">GDT Konto</b-col>
        <b-col cols="3" class="text-center">
          <b-icon icon="circle" variant="light"></b-icon>
          <div class="small">inaktiv</div>
        </b-col>
      </b-row>
      <div>
        <b-icon icon="layers" class="mr-3"></b-icon>
        0.00 GDT
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'GdtAmount',
}
</script>
