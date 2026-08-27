<template>
  <div class="right-side mt-3 mt-lg-0">
    <BContainer>
      <slot :name="name" />
    </BContainer>
  </div>
</template>
<script>
import { rightSideSlot } from '@/utils/rightSide'

export default {
  name: 'RightSide',
  computed: {
    // The route list lives in utils/rightSide, because the layout has to ask the same
    // question before it renders this column at all -- see the note over there.
    name() {
      return rightSideSlot(this.$route.path)
    },
  },
}
</script>
