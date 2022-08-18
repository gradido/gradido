<template>
  <div class="contribution-messages-list">ContributionMessagesList

      <b-container>
          <div v-for="message in messages">
          {{message}}</div>
      </b-container>
  </div>
</template>
<script>
export default {
  name: 'ContributionMessagesList',
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
          isModerator: true,
        },
        {
          id: '1',
          msgid: '0',
          memo: 'nftzfD dfRDTD FDdrD TFt F ZTFZF TZfz FF T TZF Z ff ',
          uuid: '2',
          firstName: 'bibi',
          lastName: 'bloxberg',
          isModerator: false,
        },
        {
          id: '0',
          msgid: '0',
          memo: 'oG iu Hih hi  ',
          uuid: '1',
          firstName: 'peter',
          lastName: 'lustig',
          isModerator: true,
        },
      ],
    }
  },
}
</script>
