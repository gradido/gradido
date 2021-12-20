<template>
  <div class="component-creation-transaction-list">
    Alle Geschöpften Transaktionen für den User
    <b-table striped hover :items="items"></b-table>
  </div>
</template>
<script>
export default {
  name: 'CreationTransactionList',
  data() {
    return {
      items: [
        {
          gdd: 700,
          date: '16.11.2021',
          memo: 'klaljk jakldasjd lajlaldjalajsd aasj asdl jaljaldj aa jda l jdla jda',
          moderator: 'Moderator Eins',
        },
        {
          gdd: 800,
          date: '23.10.2021',
          memo: 'jij ijdas ijad sa jsd a ijaojodjajd jiaojdja dij  aij doa aojd ao jd',
          moderator: 'Moderator Eins',
        },
        {
          gdd: 1000,
          date: '13.09.2021',
          memo: 'asdd d adad adsdadda dsdadadasds asdadada da dadadad adadada d',
          moderator: 'Moderator Eins',
        },
        {
          gdd: 400,
          date: '03.07.2021',
          memo: 'casc acas ac acacacs cac acacac acc acac ca cacac',
          moderator: 'Moderator Zwei',
        },
        {
          gdd: 210,
          date: '04.06.2021',
          memo: 'asc dfdvdvdf vfvd vdfvdff vdvdfvd vff dvfd vdfv dfv dfvdf vdfvdfv',
          moderator: 'Moderator Eins',
        },
        {
          gdd: 890,
          date: '07.05.2021',
          memo: 'reett ttertt etet et et ertetetet et ert et ertertertet',
          moderator: 'Moderator Eins',
        },
        {
          gdd: 380,
          date: '22.04.2021',
          memo: 'bnnbnbbncvbcv bcbcbc bcb cbc bcb cvb cbccvvbcvb bvbcbcbcbc bcb cb',
          moderator: 'Moderator Zwei',
        },
      ],
    }
  },
}
</script>
