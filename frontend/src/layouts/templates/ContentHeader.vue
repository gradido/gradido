<template>
  <div>
    <slot :name="path" />
  </div>
</template>

<script>
import { routeSection } from '@/utils/routeSection'

export default {
  name: 'ContentHeader',
  computed: {
    // The slot the layout fills for this section. Read through utils/routeSection, which
    // the column beside the page reads with -- the copy that stood here missed a trailing
    // slash, so `/overview/` matched no slot at all and the balance row above the page came
    // out empty. Same line, same fault, found on its twin. (27.08.2026)
    path() {
      return routeSection(this.$route.path)
    },
  },
}
</script>
