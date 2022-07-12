<template>
  <div class="community-page">
    <div>
      <b-tabs content-class="mt-3" align="center">
        <b-tab :title="$t('community.writing')" active>
          <contribution-form @set-contribution="setContribution" />
        </b-tab>
        <b-tab :title="$t('community.myContributions')">
          <contribution-list :items="items" />
        </b-tab>
        <b-tab :title="$t('navigation.community')">
          <contribution-list :items="items" />
          <contribution-list :items="items" />
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>
<script>
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
import ContributionList from '@/components/Contributions/ContributionList.vue'
import { createContribution } from '@/graphql/mutations'

export default {
  name: 'Community',
  components: {
    ContributionForm,
    ContributionList,
  },
  data() {
    return {
      items: [
        {
          id: '0',
          date: '07/06/2022',
          memo: 'Ich habe 10 Stunden die Elbwiesen von Müll befreit.',
          amount: 200,
          status: 'pending',
        },
        {
          id: '1',
          date: '06/22/2022',
          memo: 'Ich habe 30 Stunden Frau Müller beim EInkaufen und im Haushalt geholfen.',
          amount: 600,
          status: 'pending',
        },
        {
          id: '2',
          date: '05/04/2022',
          memo:
            'Ich habe 50 Stunden den Nachbarkindern bei ihren Hausaufgaben geholfen und Nachhilfeunterricht gegeben.',
          amount: 1000,
          status: 'pending',
        },
      ],
    }
  },
  methods: {
    setContribution(data) {
      // console.log('setContribution', data)
      this.$apollo
        .query({
          fetchPolicy: 'no-cache',
          query: createContribution,
          variables: {
            creationDate: data.date,
            memo: data.memo,
            amount: data.amount,
          },
        })
        .then((result) => {
          // console.log('result', result.data)
          this.toastSuccess(result.data)
        })
        .catch((err) => {
          this.toastError(err.message)
        })
    },
  },
}
</script>
