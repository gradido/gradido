<template>
  <div class="translucent-color-opacity">
    <div class="text-center">
      <b-badge
        v-if="showStatus"
        class="position-absolute mt--2 ml--5 px-3"
        :variant="badge ? 'success' : 'light'"
      >
        GDD Senden
      </b-badge>
    </div>
    <div
      class="wallet-amount bg-white appBoxShadow gradido-border-radius p-4 border border-success"
      :class="badge ? 'border-success' : 'border-light'"
    >
      <b-row>
        <b-col cols="9" class="h4">GDD Konto</b-col>
        <b-col cols="3" class="text-center">
          <div v-if="showStatus">
            <b-icon
              :icon="badge ? 'check-circle' : 'circle'"
              :variant="badge ? 'success' : 'light'"
            ></b-icon>
            <div class="small">{{ badge ? 'aktiv' : 'inaktiv' }}</div>
          </div>
        </b-col>
      </b-row>
      <div>
        <b-icon icon="layers" class="mr-3" variant="success"></b-icon>
        <span :class="badge ? 'text-success' : 'text-light'">{{ balance | GDD }}</span>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'GddAmount',
  props: {
    path: { type: String, required: false, default: '' },
    balance: { type: Number, required: true },
    badge: { type: Boolean, default: false },
    showStatus: { type: Boolean, default: false },
  },
}
</script>
