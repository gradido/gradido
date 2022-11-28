<template>
  <div>
    <div class="text-center">
      <b-badge
        class="position-absolute mt--2 ml--4 px-3 zindex1"
        :variant="badge ? 'success' : 'light'"
      >
        {{ $t('GDT') }}
      </b-badge>
    </div>

    <div
      class="wallet-amount bg-white appBoxShadow gradido-border-radius p-4 border"
      :class="showStatus ? 'gradido-global-border-color-accent' : 'border-light opacity-05'"
    >
      <b-row>
        <b-col cols="9" class="h4">{{ $t('gdt.gdtKonto') }}</b-col>
        <b-col cols="3" class="text-center">
          <div>
            <b-icon
              :icon="badge ? 'check-circle' : 'circle'"
              class="gradido-global-border-color-accent"
            ></b-icon>
            <div class="small">{{ badge ? $t('active') : $t('inactive') }}</div>
          </div>
        </b-col>
      </b-row>
      <div>
        <b-icon icon="layers" class="mr-3" :variant="badge ? 'success' : 'light'"></b-icon>
        <span :class="badge ? 'text-success' : 'text-light'">
          {{ $n(GdtBalance, 'decimal') }} {{ $t('GDT') }}
        </span>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'GdtAmount',
  props: {
    GdtBalance: { type: Number, required: true },
    badge: { type: Boolean, default: false },
    showStatus: { type: Boolean, default: false },
  },
}
</script>
