<template>
  <div class="contribution-messages-list">
    <b-container>
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item :typeId="message.isModerator">
          <template #1>
            <is-moderator :message="message"></is-moderator>
          </template>
          <template #0>
            <is-not-moderator :message="message" class="text-right"></is-not-moderator>
          </template>
        </contribution-messages-list-item>
      </div>
    </b-container>
    <br />
    <br />
    <br />
    <contribution-messages-formular />
  </div>
</template>
<script>
import ContributionMessagesListItem from './slots/ContributionMessagesListItem.vue'
import IsModerator from './slots/IsModerator.vue'
import IsNotModerator from './slots/IsNotModerator.vue'
import ContributionMessagesFormular from '../ContributionMessages/ContributionMessagesFormular.vue'

export default {
  name: 'ContributionMessagesList',
  components: {
    ContributionMessagesListItem,
    IsModerator,
    IsNotModerator,
    ContributionMessagesFormular,
  },
  data() {
    return {
      messages: [
        {
          id: '0',
          msgid: '0',
          memo: 'kjsdn sdnnasd andandandak sd n askdna kdnak asdnadjasndk adkand',
          uuid: '1',
          firstName: 'peter',
          lastName: 'lustig',
          isModerator: 1,
        },
        {
          id: '1',
          msgid: '0',
          memo: 'nftzfD dfRDTD FDdrD TFt F ZTFZF TZfz FF T TZF Z ff ',
          uuid: '2',
          firstName: 'bibi',
          lastName: 'bloxberg',
          isModerator: 0,
        },
        {
          id: '2',
          msgid: '0',
          memo: 'oG iu Hih hi  ',
          uuid: '1',
          firstName: 'peter',
          lastName: 'lustig',
          isModerator: 1,
        },
        {
          id: '3',
          msgid: '0',
          memo: 'zdg  gdggs ds gdggusgdug nftz s s ZF TZfz FF 564c ',
          uuid: '2',
          firstName: 'bibi',
          lastName: 'bloxberg',
          isModerator: 0,
        },
      ],
    }
  },
}
</script>
<style scoped>
.temp-message {
  margin-top: 50px;
}
</style>
