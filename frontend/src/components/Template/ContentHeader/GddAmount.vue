<template>
  <div class="translucent-color-opacity">
    <div v-if="badge" class="text-center">
      <b-badge class="position-absolute mt--2 ml--5 px-3" variant="success">GDD Senden</b-badge>
    </div>
    <div
      class="wallet-amount bg-white appBoxShadow gradido-border-radius p-4 border border-success"
    >
      <b-row>
        <b-col cols="10" class="h4">GDD Konto</b-col>
        <b-col cols="2" class="text-center">
          <b-icon icon="check-circle" variant="success"></b-icon>
          <div class="small">aktiv</div>
        </b-col>
      </b-row>
      <div>
        <b-icon icon="layers" class="mr-3" variant="success"></b-icon>
        <span class="text-success">{{ balance | GDD }}</span>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'GddAmount',
  props: {
    balance: { type: Number, required: true },
    badge: { type: Boolean, default: false },
  },
}
</script>
