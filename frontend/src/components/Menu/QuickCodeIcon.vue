<!-- AI-GENERATED — not an architecture reference -->
<template>
  <span class="quick-code-icon">
    <IMdiQrcode class="quick-code-icon-code" />
    <IMdiArrowUpThick
      v-if="direction === 'out'"
      class="quick-code-icon-arrow"
      data-test="quick-code-arrow-out"
    />
    <IMdiArrowDownThick v-else class="quick-code-icon-arrow" data-test="quick-code-arrow-in" />
  </span>
</template>

<script setup>
/**
 * A QR symbol with a small arrow, for the two shortcuts that show a member's OWN code.
 *
 * The two codes look the same to the eye -- both are "hold up my square" -- and what
 * separates them is which way the Gradido move afterwards. So that is what the symbol
 * says, and it is the only thing it says:
 *
 *   out  the thank-you card: somebody takes payment from me
 *   in   the Gradido card:   somebody sends to me
 *
 * A component rather than markup repeated in both menus, and not because of the two
 * copies. `DashboardLayout`'s style block is GLOBAL, so a shared class name there styles
 * across components -- which is why the scanner and the calculator carry two class names
 * for one look. A component brings its own scoped style and ends that whole question.
 *
 * No ready-made glyph exists: mdi, tabler, bi and ion each offer `qrcode` and
 * `qrcode-scan` and nothing with a direction, so the two parts are composed here.
 */
defineProps({
  // 'out' -- Gradido leave me; 'in' -- Gradido come to me.
  direction: {
    type: String,
    required: true,
    validator: (value) => ['in', 'out'].includes(value),
  },
})
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector". */
.quick-code-icon {
  position: relative;
  display: inline-flex;
  line-height: 1;
}

.quick-code-icon-code {
  width: 1em;
  height: 1em;
}

/* Up in the corner and mostly OUTSIDE the square, so the arrow does not have to be read
   through the code pattern. The 44px target leaves 11px of air around a 22px glyph, and
   the arrow lives in that air; nothing needs a halo behind it. */
.quick-code-icon-arrow {
  position: absolute;
  top: -0.26em;
  right: -0.36em;
  width: 0.72em;
  height: 0.72em;
}
</style>
