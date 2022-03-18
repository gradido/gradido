<template>
  <div class="redeemed-text-box">
    <b-jumbotron bg-variant="info" text-variant="dark" border-variant="dark">
      <h1>
        {{ text }}
      </h1>
    </b-jumbotron>

    <div class="text-center">
      <b-button to="/overview">{{ $t('back') }}</b-button>
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
