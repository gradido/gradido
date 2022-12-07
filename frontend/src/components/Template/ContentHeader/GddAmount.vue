<template>
  <div class="translucent-color-opacity">
    <div class="text-center">
      <b-badge
        class="position-absolute mt--2 ml--4 px-3 zindex1"
        :variant="showStatus ? 'success' : 'light'"
      >
        {{ $t('GDD') }}
      </b-badge>
    </div>
    <div
      class="wallet-amount bg-white appBoxShadow gradido-border-radius p-4 border"
      :class="
        showStatus || path === '/overview'
          ? 'gradido-global-border-color-accent'
          : 'border-light opacity-05'
      "
    >
      <b-row>
        <b-col class="h4">{{ $t('gddKonto') }}</b-col>
        <!-- <b-col cols="3" class="text-center">
          <div>
            <b-icon
              :icon="showStatus ? 'check-circle' : 'circle'"
              :class="showStatus ? 'gradido-global-border-color-accent' : ''"
            ></b-icon>
            <div class="small">{{ badge ? $t('active') : $t('inactive') }}</div>
          </div>
        </b-col> -->
      </b-row>
      <div @click="hideAmount = !hideAmount" class="pointer">
        <b-icon
          :icon="hideAmount ? 'eye' : 'eye-slash'"
          class="mr-3 gradido-global-border-color-accent"
        ></b-icon>
        <span v-if="hideAmount" class="font-weight-bold gradido-global-color-accent">
          {{ $t('asterisks') }}
        </span>
        <span v-else class="font-weight-bold gradido-global-color-accent">
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
  data() {
    return {
      hideAmount: true,
    }
  },
}
</script>
