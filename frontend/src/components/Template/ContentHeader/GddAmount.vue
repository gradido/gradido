<template>
  <div class="translucent-color-opacity">
    <div class="text-center">
      <b-badge
        class="position-absolute mt--2 ml--4 px-3 zindex1"
        :variant="showStatus ? 'success' : 'light'"
      >
        GDD
      </b-badge>
    </div>
    <div
      class="wallet-amount bg-white appBoxShadow gradido-border-radius p-4 border"
      :class="showStatus ? 'gradido-global-border-color-accent' : 'border-light opacity-05'"
    >
      <b-row>
        <b-col cols="9" class="h4">GDD Konto</b-col>
        <b-col cols="3" class="text-center">
          <div>
            <b-icon
              :icon="showStatus ? 'check-circle' : 'circle'"
              :class="showStatus ? 'gradido-global-border-color-accent' : ''"
            ></b-icon>
            <div class="small">{{ badge ? 'aktiv' : 'inaktiv' }}</div>
          </div>
        </b-col>
      </b-row>
      <div>
        <b-icon icon="layers" class="mr-3 gradido-global-border-color-accent"></b-icon>
        <span :class="badge ? 'gradido-global-color-accent' : 'text-light'">
          {{ balance | GDD }}
        </span>
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
