<template>
  <div>
    <!--Tables-->
    <b-row class="mt-5">
      <b-col xl="8" class="mb-5 mb-xl-0">
        <vue-good-table
          :columns="columns"
          :rows="rows"
          max-height="370px"
          :fixed-header="true"
          :line-numbers="true"
          @on-row-click="onRowClick"
          @on-search="onSearch"
          :search-options="{
            enabled: true,

            skipDiacritics: true,
            searchFn: mySearchFn,
            placeholder: 'durchsuche die tabelle',
            externalQuery: searchQuery
          }"
          :pagination-options="{
            enabled: true,
            mode: 'pages'
          }"
        >
          <div slot="table-actions">
            Mitglieder suchen .
          </div>
        </vue-good-table>
      </b-col>
      <b-col xl="4" class="mb-5 mb-xl-0">
        <social-traffic-table></social-traffic-table>
      </b-col>
    </b-row>
    <!--End tables-->
  </div>
</template>

<script>
import SocialTrafficTable from "./SocialTrafficTable";

export default {
  name: "my-component",
  components: {
    SocialTrafficTable
  },
  data() {
    return {
      columns: [
        {
          label: "Name",
          field: "name"
        },
        {
          label: "Alter",
          field: "age",
          type: "number"
        },
        {
          label: "Mitglied seid",
          field: "createdAt",
          type: "date",
          dateInputFormat: "yyyy-MM-dd",
          dateOutputFormat: "dd.MM.yyyy"
        },
        {
          label: "Prozent",
          field: "score",
          type: "percentage"
        }
      ],
      rows: [
        {
          id: 1,
          name: "John",
          age: 20,
          createdAt: "1976-10-25",
          score: 0.03343
        },
        {
          id: 2,
          name: "Jane",
          age: 24,
          createdAt: "2011-10-31",
          score: 0.03343
        },
        {
          id: 3,
          name: "Susan",
          age: 16,
          createdAt: "2011-10-30",
          score: 0.03343
        },
        {
          id: 4,
          name: "Chris",
          age: 55,
          createdAt: "2011-10-11",
          score: 0.03343
        },
        {
          id: 5,
          name: "Dan",
          age: 40,
          createdAt: "2011-10-21",
          score: 0.03343
        },
        {
          id: 6,
          name: "Bohn",
          age: 70,
          createdAt: "2011-10-31",
          score: 0.03343
        },
        {
          id: 7,
          name: "Tellohn",
          age: 56,
          createdAt: "2009-10-31",
          score: 0.13343
        },
        {
          id: 7,
          name: "Tellohn",
          age: 56,
          createdAt: "2009-10-31",
          score: 0.03343
        }
      ]
    };
  },
  methods: {
    onRowClick(params) {
      console.log(params);
      // params.row - row object
      // params.pageIndex - index of this row on the current page.
      // params.selected - if selection is enabled this argument
      // indicates selected or not
      // params.event - click event
    },
    onSearch(params) {
      console.log(params);
      // params.searchTerm - term being searched for
      // params.rowCount - number of rows that match search
    },
    mySearchFn(params) {
      console.log(params);
    }
  }
};
</script>
