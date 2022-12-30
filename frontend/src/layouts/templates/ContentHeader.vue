<template>
  <div>
    <div v-if="path === '/overview'">
      <b-row>
        <b-col cols="12" lg="5">
          <div>
            <gdd-amount :balance="balance" :showStatus="false" :path="path" :badgeShow="false" />
          </div>
        </b-col>
        <b-col cols="12" lg="7">
          <div>
            <community-member :totalUsers="totalUsers" />
          </div>
        </b-col>
      </b-row>
    </div>
    <!-- <div v-if="path === '/storys'"></div>
    <div v-if="path === '/addresses'"></div> -->
    <div v-if="path === '/send'">
      <b-row>
        <b-col cols="12" lg="6">
          <div>
            <gdd-amount :balance="balance" :badge="true" :showStatus="true" :badgeShow="false" />
          </div>
        </b-col>
        <b-col cols="12" lg="6">
          <div>
            <router-link to="gdt">
              <gdt-amount :GdtBalance="GdtBalance" :badgeShow="false" />
            </router-link>
          </div>
        </b-col>
      </b-row>
    </div>
    <div v-if="path === '/transactions'">
      <b-row>
        <b-col cols="12" lg="6">
          <div>
            <router-link to="transactions">
              <gdd-amount :balance="balance" :showStatus="true" />
            </router-link>
          </div>
        </b-col>
        <b-col cols="12" lg="6">
          <div>
            <router-link to="gdt">
              <gdt-amount :GdtBalance="GdtBalance" />
            </router-link>
          </div>
        </b-col>
      </b-row>
    </div>
    <div v-if="path === '/gdt'">
      <b-row>
        <b-col cols="12" lg="6">
          <div>
            <router-link to="transactions">
              <gdd-amount :balance="balance" :showStatus="false" />
            </router-link>
          </div>
        </b-col>
        <b-col cols="12" lg="6">
          <div>
            <router-link to="gdt">
              <gdt-amount :badge="true" :showStatus="true" :GdtBalance="GdtBalance" />
            </router-link>
          </div>
        </b-col>
      </b-row>
    </div>
    <!-- <div v-if="path === '/profile'">
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
    </div> -->
    <div v-if="path === '/community'"><nav-community /></div>
    <div v-if="path === '/settings'"></div>
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
    GdtBalance: { type: Number, required: true },
    totalUsers: { type: Number, required: true },
  },

  computed: {
    path() {
      return this.$route.path
    },
  },
}
</script>
