<template>
  <div>
    <b-card-header>Gradido Schüpfung</b-card-header>
    <!--Tables-->
    <b-row class="mt-5">
      <b-col xl="8" class="mb-5 mb-xl-0">
        <vue-good-table
          :columns="columns"
          :rows="rows"
          max-height="370px"
          :fixed-header="true"
          :line-numbers="false"
          styleClass="vgt-table"
          theme="nocturnal"
          @on-row-click="onRowClick"
          @on-search="onSearch"
          :search-options="{
            enabled: true,

            skipDiacritics: true,
            searchFn: mySearchFn,
            placeholder: 'durchsuche die tabelle',
          }"
          :pagination-options="{
            enabled: true,
            mode: 'pages',
          }"
        >
          <div slot="table-actions">Einträge suchen .</div>
        </vue-good-table>
      </b-col>
      <b-col xl="4" class="mb-5 mb-xl-0">
        <b-card body-class="p-0" header-class="border-0">
          <template v-slot:header>
            <b-row align-v="center">
              <b-col>
                <h3 class="mb-0"></h3>
              </b-col>
              <b-col class="text-right">
                <a href="#!" class="btn btn-sm btn-primary">speichern</a>
              </b-col>
            </b-row>
          </template>
          <b-card-body>
            <p>{{ creation.createdAt }}</p>
            <p>{{ creation.group }}</p>
            <p>{{ creation.id }}</p>
            <p>{{ creation.name }}</p>
            <p>{{ creation.originalIndex }}</p>
            <p>{{ creation.text }}</p>
            <p>{{ creation.vgt_id }}</p>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
    <!--End tables-->
  </div>
</template>

<script>
export default {
  name: 'admin-user-creation',
  data() {
    return {
      creation: {
        createdAt: '',
        group: '',
        id: '',
        name: '',
        originalIndex: '',
        text: '',
        vgt_id: '',
      },
      columns: [
        {
          label: 'Name',
          field: 'name',
        },
        {
          label: 'Gruppe',
          field: 'group',
          type: 'group',
        },
        {
          label: 'eingereicht',
          field: 'createdAt',
          type: 'date',
          dateInputFormat: 'yyyy-MM-dd',
          dateOutputFormat: 'dd.MM.yyyy',
        },
        {
          label: 'Text',
          field: 'text',
          type: 'text',
        },
      ],
      rows: [
        {
          id: 1,
          createdAt: '2021-01-25',
          name: 'Sellora',
          group: 'gruppe1',
          text: 'aASDASdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 2,
          createdAt: '2021-01-31',
          name: 'Jane',
          group: 'gruppe14',
          text: 'WQadCXhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 3,
          createdAt: '2021-01-30',
          name: 'Susan',
          group: 'gruppe31',
          text: 'IaYXCYdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 4,
          createdAt: '2020-01-11',
          name: 'Chris',
          group: 'gruppe12',
          text: 'TZadhhCYXCda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 5,
          createdAt: '2020-12-21',
          name: 'Dan',
          group: 'gruppe11',
          text: 'Wad3323hhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 6,
          createdAt: '2020-12-31',
          name: 'zBohn',
          group: 'gruppe71',
          text: 'Tadh hD da hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 7,
          createdAt: '2020-12-31',
          name: 'xyTellohn',
          group: 'gruppe31',
          text: 'Fad AD31 hhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 8,
          createdAt: '2021-01-25',
          name: 'uSellora',
          group: 'gruppe1',
          text: 'aASDASdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 9,
          createdAt: '2021-01-31',
          name: 'yJane',
          group: 'gruppe14',
          text: '55 55 55 WQadCXhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 10,
          createdAt: '2021-01-20',
          name: 'kSusan',
          group: 'gruppe31',
          text: 'IaYXCYdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 11,
          createdAt: '2021-01-25',
          name: 'qSellora',
          group: 'gruppe12',
          text: 'aASDASdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 12,
          createdAt: '2021-01-31',
          name: 'fJane',
          group: 'gruppe15',
          text: 'WQadCXhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 13,
          createdAt: '2021-01-38',
          name: 'aSusan',
          group: 'gruppe1',
          text: 'asssss  IaYXCYdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 14,
          createdAt: '2020-01-11',
          name: 'uChris',
          group: 'gruppe12',
          text: 'TZadhhCYXCda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 15,
          createdAt: '2020-12-21',
          name: 'tzDan',
          group: 'gruppe11',
          text: 'Wad33 23hhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 16,
          createdAt: '2020-12-31',
          name: 'fBohn',
          group: 'gruppe71',
          text: '3f Tadh hD da hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 17,
          createdAt: '2020-12-31',
          name: 'aEsau',
          group: 'gruppe15',
          text: '2324 adhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 18,
          createdAt: '2021-01-25',
          name: 'gSellora',
          group: 'gruppe1',
          text: '5h aASDASdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 19,
          createdAt: '2021-01-31',
          name: 'sJane',
          group: 'gruppe14',
          text: 'as sdsd WQadCXhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 20,
          createdAt: '2021-01-30',
          name: 'oSusan',
          group: 'gruppe31',
          text: 'sd IaYXCYdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 21,
          createdAt: '2021-01-25',
          name: 'Sellora',
          group: 'gruppe1',
          text: '3 aASDASdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 22,
          createdAt: '2021-01-13',
          name: 'rtJane',
          group: 'gruppe14',
          text: 'q WQadCXhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 23,
          createdAt: '2021-01-16',
          name: 'rSusan',
          group: 'gruppe31',
          text: 'Iare YXCYdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 24,
          createdAt: '2020-01-15',
          name: 'sChris',
          group: 'gruppe12',
          text: '43 TZad hhCYXCda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 25,
          createdAt: '2020-12-14',
          name: 'dDan',
          group: 'gruppe11',
          text: 'aas aWad3323hhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 26,
          createdAt: '2020-12-13',
          name: 'fBohn',
          group: 'gruppe71',
          text: 'Ta  adh hD da hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 27,
          createdAt: '2020-12-12',
          name: 'gTellohn',
          group: 'gruppe31',
          text: '55 Fad AD31 hhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 28,
          createdAt: '2021-01-12',
          name: 'zSellora',
          group: 'gruppe1',
          text: 'e q raASDASdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 29,
          createdAt: '2021-01-12',
          name: 'uJane',
          group: 'gruppe14',
          text: 'erW QadCXhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
        {
          id: 30,
          createdAt: '2021-01-11',
          name: 'iSusan',
          group: 'gruppe31',
          text: '3IaYXCYdhhda hkahkh hakdh kaks hkadhk kdhkasdh kdhkhka dka dhakhdk',
        },
      ],
    }
  },
  methods: {
    onRowClick(params) {
      /*
      console.log('onRowClick', params.row.createdAt)
      console.log('onRowClick', params.row.group)
      console.log('onRowClick', params.row.id)
      console.log('onRowClick', params.row.name)
      console.log('onRowClick', params.row.originalIndex)
      console.log('onRowClick', params.row.text)
      console.log('onRowClick', params.row.vgt_id)
      */

      this.creation.createdAt = params.row.createdAt
      this.creation.group = params.row.group
      this.creation.id = params.row.id
      this.creation.name = params.row.name
      this.creation.originalIndex = params.row.originalIndex
      this.creation.text = params.row.text
      this.creation.vgt_id = params.row.vgt_id

      // params.row - row object
      // params.pageIndex - index of this row on the current page.
      // params.selected - if selection is enabled this argument
      // indicates selected or not
      // params.event - click event
    },
    onSearch(params) {
      //console.log('onSearch', params)
      // params.searchTerm - term being searched for
      // params.rowCount - number of rows that match search
    },
    mySearchFn(params) {
      //console.log("mySearchFn", params)
    },
  },
}
</script>
