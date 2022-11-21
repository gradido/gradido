<template>
  <div>
    <div>
      <b-container v-if="path === '/overview'">
        <b-row>
          <b-col cols="5">
            <div class="p-4 bg-white appBoxShadow gradido-border-radius">
              <gdd-amount :balance="balance" />
            </div>
          </b-col>
          <b-col cols="7">
            <div class="p-4 bg-white appBoxShadow gradido-border-radius">
              <community-member />
            </div>
          </b-col>
        </b-row>
      </b-container>
      <b-container v-if="path === '/storys'"><h2>Deine Community im Überblick</h2></b-container>
      <b-container v-if="path === '/addresses'">Deine Favoriten im Überblick</b-container>
      <b-container v-if="path === '/send'">
        <b-row>
          <b-col cols="6">
            <div class="p-4 bg-white appBoxShadow gradido-border-radius">
              <gdd-amount :balance="balance" />
            </div>
          </b-col>
          <b-col cols="6">
            <div class="p-4 bg-white appBoxShadow gradido-border-radius">
              <gdt-amount />
            </div>
          </b-col>
        </b-row>
      </b-container>
      <b-container v-if="path === '/transactions'">
        <b-row>
          <b-col cols="6">
            <div class="p-4 bg-white appBoxShadow gradido-border-radius">
              <gdd-amount :balance="balance" />
            </div>
          </b-col>
          <b-col cols="6">
            <div class="p-4 bg-white appBoxShadow gradido-border-radius">
              <gdt-amount />
            </div>
          </b-col>
        </b-row>
      </b-container>
      <b-container v-if="path === '/profile'">
        <b-row>
          <b-col>
            <div class="p-4 bg-white appBoxShadow gradido-border-radius">
              <b-row>
                <b-col cols="8" class="h3">Zeige deiner Community wer du bist.</b-col>
                <b-col cols="4" class="text-small text-muted">vor 4 Stunden geändert</b-col>
              </b-row>
              <b-row>
                <b-col cols="2" class=""><b-avatar size="72px" rounded="lg"></b-avatar></b-col>
                <b-col cols="10" class="">Text</b-col>
              </b-row>
            </div>
          </b-col>
        </b-row>
      </b-container>
      <b-container v-if="path === '/community'"><nav-community /></b-container>
      <b-container v-if="path === '/settings'">settings content header</b-container>
    </div>
  </div>
</template>

<script>
import GddAmount from '@/components/Template/ContentHeader/GddAmount.vue'
import GdtAmount from '@/components/Template/ContentHeader/GdtAmount.vue'
import CommunityMember from '@/components/Template/ContentHeader/CommunityMember.vue'
import NavCommunity from '@/components/Template/ContentHeader/NavCommunity.vue'
export default {
  name: 'ContentHeader',
  components: {
    GddAmount,
    GdtAmount,
    CommunityMember,
    NavCommunity,
  },
  props: {
    balance: { type: Number, required: true },
  },

  computed: {
    path() {
      return this.$route.path
    },
  },
}
</script>
