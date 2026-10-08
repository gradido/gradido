<template>
  <div class="nav-contributions">
    <div
      class="nav-contributions-btn-wrapper bg-209 rounded-26 d-flex bd-highlight mx-xl-6 mx-lg-5 shadow justify-content-between"
    >
      <BButton
        :to="{ path: routeToTab(contribute) }"
        :class="stateClasses(contribute)"
        block
        variant="link"
        class="nav-contributions__btn"
      >
        <b-img src="/img/svg/write.svg" height="20" class="svg-icon" />
        {{ $t('community.submitContribution') }}
      </BButton>
      <BButton
        :to="{ path: routeToTab(ownContributions) }"
        :class="stateClasses(ownContributions)"
        block
        variant="link"
        class="nav-contributions__btn"
      >
        <i-ion-person-sharp class="svg-icon" />
        {{ $t('community.myContributions') }}
      </BButton>
      <BButton
        :to="{ path: routeToTab(allContributions) }"
        :class="stateClasses(allContributions)"
        block
        variant="link"
        class="nav-contributions__btn"
      >
        <i-mdi-people-group class="svg-icon" />
        {{ $t('community.community') }}
      </BButton>
    </div>
  </div>
</template>
<script setup>
import { useRoute } from 'vue-router'

const props = defineProps({
  allContributions: {
    type: String,
    default: '',
  },
  contribute: {
    type: String,
    default: '',
  },
  ownContributions: {
    type: String,
    default: '',
  },
  routeBase: {
    type: String,
    default: '',
  },
})

const currentRoute = useRoute()

const stateClasses = (route) => {
  if (currentRoute.path.includes(route)) {
    return 'router-link-active router-link-exact-active'
  }
  return ''
}
const routeToTab = (route) => {
  return props.routeBase + route
}
</script>

<style scoped lang="scss">
.nav-contributions-btn-wrapper {
  background-color: #d1d1d1;

  > :deep(*) {
    width: calc(100% / 3);
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-size: 14px;

    /* As the switch of the send page (TransactionForm.vue): a label that does not fit wraps
       inside its third, rather than running across its neighbours or widening the column. */
    text-align: center;
    line-height: 1.15;
    color: black !important;
    border-radius: 25px;

    /* 8px at each side, for the active tab as for the others (it was 20px, from .btn and from
       the active rule below): of a third of a phone, 42px were padding and border. */
    padding-right: 8px;
    padding-left: 8px;
  }

  /* An icon keeps its size. Left to shrink, it gave way as soon as the word needed the room:
     on a phone to a few pixels or to nothing, in every language. The gap to the word is the
     tab's own (`--tab-icon-gap`), none where it is not set. */
  :deep(.svg-icon) {
    flex-shrink: 0;
    margin-right: var(--tab-icon-gap, 0);
  }
}

:deep(.svg-icon) {
  filter: brightness(0) invert(0);
}

:deep(.router-link-active) {
  background-color: rgb(23 141 129);
  color: white !important;
  font-weight: bold;
  padding: 0.625rem 8px;
  border-radius: 25px;
}

:deep(.router-link-active .svg-icon) {
  filter: brightness(0) invert(1);
}

/* On a phone the word stands under the icon in all three tabs, as in the tab bar of the
   matching page (pages/Matching.vue) -- three tab bars, one form. The font size stays. The
   icon stands in the middle there, so its gap to the word beside it does not apply. */
@media (width <= 575.98px) {
  .nav-contributions-btn-wrapper {
    > :deep(*) {
      flex-direction: column;
      row-gap: 3px;
    }

    :deep(.svg-icon) {
      margin-right: 0;
    }
  }
}
</style>
