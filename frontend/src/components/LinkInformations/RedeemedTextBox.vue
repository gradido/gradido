<template>
  <div class="redeemed-text-box">
    <BCard bg-variant="muted" text-variant="dark" border-variant="info">
      <h1>
        {{ text }}
      </h1>
    </BCard>

    <div class="text-center">
      <BButton to="/overview">{{ $t('back') }}</BButton>
    </div>
  </div>
</template>
<script>
export default {
  name: 'RedeemedTextBox',
  props: {
    text: { type: String, required: true },
  },
}
</script>
