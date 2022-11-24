<template>
  <div>
    <div class="text-center">
      <b-badge
        class="position-absolute mt--2 ml--4 px-3 zindex1"
        :variant="badge ? 'success' : 'light'"
      >
        GDT
      </b-badge>
    </div>

    <div
      class="wallet-amount bg-white appBoxShadow gradido-border-radius p-4 border opacity-05"
      :class="badge ? 'border-success' : 'border-light'"
    >
      <b-row>
        <b-col cols="9" class="h4">GDT Konto</b-col>
        <b-col cols="3" class="text-center">
          <div>
            <b-icon
              :icon="badge ? 'check-circle' : 'circle'"
              :variant="badge ? 'success' : 'light'"
            ></b-icon>
            <div class="small">{{ badge ? 'aktiv' : 'inaktiv' }}</div>
          </div>
        </b-col>
      </b-row>
      <div>
        <b-icon icon="layers" class="mr-3" :variant="badge ? 'success' : 'light'"></b-icon>
        <span :class="badge ? 'text-success' : 'text-light'">0,00 GDT</span>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'GdtAmount',
  props: {
    badge: { type: Boolean, default: false },
  },
}
</script>
