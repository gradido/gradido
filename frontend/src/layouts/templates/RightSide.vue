<template>
  <div class="right-side mt-3 mt-lg-0">
    <BContainer>
      <!-- Anything that stands OVER the panel and belongs to the column rather than to
           what is in it -- today the bookings-or-contacts switch (KF-009). Inside the
           container, so it lines up with the panel beneath it rather than with the page
           edge; empty on the columns that have nothing to switch. -->
      <slot name="head" />
      <slot :name="panel" />
    </BContainer>
  </div>
</template>
<script>
export default {
  name: 'RightSide',
  props: {
    /**
     * Which panel to render, named by the route that asked for it (`route.meta.rightSide`).
     *
     * ⛔ Handed in rather than read here. This component used to ask the route itself, so
     * the layout and the column each answered "which panel?" separately -- two readings of
     * one decision, and the kind that drifts apart quietly. The layout has to know anyway,
     * since it decides whether to render this at all; asking twice only creates the chance
     * to disagree.
     *
     * Required and never empty: the layout renders this only where the route names a panel,
     * so there is no "nothing" case left to carry.
     */
    panel: {
      type: String,
      required: true,
    },
  },
}
</script>
