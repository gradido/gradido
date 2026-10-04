<template>
  <div class="community-member mt-3 mt-lg-0 position-relative flex-grow-1 d-flex flex-column">
    <div class="text-center bg-gradido-gradient">
      <!-- No variant: BBadge's default ("secondary") brings `text-bg-secondary`, whose black
           `!important` text comes after `.bg-gradido-gradient`'s white in the stylesheet and
           won. The GDD and GDT badges pass an empty variant for the same gradient and are
           white; this one is now too (Bernd, 04.10.2026). -->
      <BBadge variant="" class="position-absolute mt--2 ms--5 px-3 bg-gradido-gradient">
        {{ $t('community.community') }}
      </BBadge>
    </div>
    <!-- The tile names the community and counts its members, and says nothing else. It used
         to read "Member / You are an active member / <number>", and the number looked like a
         membership number (Bernd, 04.10.2026). With the sentence gone the tile has one line
         where the balance card beside it has two, so it takes the height of its column and
         centres that line -- side by side the two cards stay the same height.
         The height comes from growing in a flex column, not from `h-100`: on the phone the
         tile carries 16px above itself (`mt-3`), and 100% plus that margin pushed it 16px
         out of its column, into the gap to the next box (Bernd, 04.10.2026). -->
    <div
      class="community-member-box bg-white app-box-shadow gradido-border-radius p-4 border border-success flex-grow-1 d-flex align-items-center"
    >
      <BRow class="flex-grow-1 align-items-center">
        <BCol>
          <div class="h4 mb-0" data-test="community-name">{{ CONFIG.COMMUNITY_NAME }}</div>
        </BCol>
        <!-- As wide as the number, on one line: at a fixed quarter the icon and the number
             broke into two lines on a 320px phone (measured, 40px for 52px of content). -->
        <BCol
          cols="auto"
          class="border-start border-dark text-nowrap"
          :title="$t('community.members')"
          data-test="community-member-count"
        >
          <IBiPeople aria-hidden="true" />
          {{ totalUsers ?? '—' }}
          <span class="visually-hidden">{{ $t('community.members') }}</span>
        </BCol>
      </BRow>
    </div>
  </div>
</template>
<script>
import CONFIG from '@/config'

export default {
  name: 'CommunityMember',
  props: {
    totalUsers: { type: Number, required: true },
  },
  data() {
    return {
      CONFIG,
    }
  },
}
</script>
