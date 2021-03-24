<template>
  <div>
    <b-card-header>User</b-card-header>
    <!--Tables-->
    <b-row class="mt-5">
      <b-col xl="8" class="mb-5 mb-xl-0">
        <vue-good-table
          :columns="columns"
          :rows="rows"
          max-height="470px"
          :fixed-header="true"
          :line-numbers="false"
          styleClass="vgt-table striped condensed"
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
          <div slot="table-actions">
            Mitglieder suchen .
          </div>
        </vue-good-table>
      </b-col>
      <b-col xl="4" class="mb-5 mb-xl-0">
        <!-- card neues mitglied -->
        <b-card v-if="showNewUser" body-class="p-0" header-class="border-0">
          <template v-slot:header>
            <b-row align-v="center">
              <b-col>
                <h3 class="mb-0">Neues Mitglied anlegen</h3>
              </b-col>
              <b-col class="text-right">
                <a href="#!" class="btn btn-sm btn-primary">speichern</a>
              </b-col>
            </b-row>
          </template>
          <b-card-body>
            <form>
              <b-row class="">
                <label class="col-md-3 col-form-label form-control-label">
                  Name
                </label>
                <b-col md="10">
                  <base-input placeholder="Jon Snow"></base-input>
                </b-col>
              </b-row>
              <b-row class="">
                <label for="example-email-input" class="col-md-3 col-form-label form-control-label">
                  Email
                </label>
                <b-col md="10">
                  <base-input
                    type="email"
                    placeholder="gradido@example.com"
                    id="example-email-input0"
                  />
                </b-col>
              </b-row>
              <b-row class="">
                <label class="col-md-3 col-form-label form-control-label">
                  Gruppe
                </label>
                <b-col md="10">
                  <base-input placeholder="Gruppe"></base-input>
                </b-col>
              </b-row>
            </form>
          </b-card-body>
        </b-card>

        <!-- card mitglied bearbeiten -->
        <b-card v-else body-class="p-0" header-class="border-0">
          <template v-slot:header>
            <b-row align-v="center">
              <b-col>
                <h3 class="mb-0">Mitglied Daten</h3>
              </b-col>
              <b-col class="text-right">
                <a href="#!" @click="showNewUser = true" class="btn btn-sm btn-warning">
                  schliesen
                </a>
              </b-col>
            </b-row>
          </template>
          <b-card-body>
            <img
              style="width: 147px"
              src="https://demos.creative-tim.com/argon-dashboard-pro/assets/img/theme/team-4.jpg"
            />

            <form>
              <b-row class="">
                <label class="col-md-3 col-form-label form-control-label">
                  Name
                </label>
                <b-col md="10">
                  <base-input placeholder="name"></base-input>
                </b-col>
              </b-row>
              <b-row class="">
                <label for="example-email-input" class="col-md-3 col-form-label form-control-label">
                  Email
                </label>
                <b-col md="10">
                  <base-input
                    type="email"
                    autocomplete="username email"
                    placeholder="agradido@example.com"
                    id="example-email-input1"
                  />
                </b-col>
              </b-row>
              <b-row class="">
                <label class="col-md-3 col-form-label form-control-label">
                  Gruppe
                </label>
                <b-col md="10">
                  <base-input placeholder="Gruppe"></base-input>
                </b-col>
              </b-row>
            </form>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
export default {
  name: 'admin-user-search',
  data() {
    return {
      showNewUser: true,
      formSetUser: {
        name: '',
        email: '',
        group: '',
      },
      formGetUser: {
        name: '',
        email: '',
        group: '',
      },
      columns: [
        {
          label: 'Name',
          field: 'name',
        },
        {
          label: 'E-Mail',
          field: 'email',
          type: 'email',
        },
        {
          label: 'Mitglied seid',
          field: 'createdAt',
          type: 'date',
          dateInputFormat: 'yyyy-MM-dd',
          dateOutputFormat: 'dd.MM.yyyy',
        },
        {
          label: 'Gruppe',
          field: 'group',
          type: 'group',
        },
      ],
      rows: [
        {
          id: 1,
          name: 'John',
          email: 'temail@tutanota.com',
          createdAt: '1976-10-25',
          group: 'gruppe1',
        },
        {
          id: 2,
          name: 'Jane',
          email: 'temail@tutanota.com',
          createdAt: '2011-10-31',
          group: 'gruppe2',
        },
        {
          id: 3,
          name: 'Susan',
          email: 'temail@tutanota.com',
          createdAt: '2011-10-30',
          group: 'gruppe4',
        },
        {
          id: 4,
          name: 'Chris',
          email: 'temail@tutanota.com',
          createdAt: '2011-10-11',
          group: 'gruppe3',
        },
        {
          id: 5,
          name: 'Dan',
          email: 'temail@tutanota.com',
          createdAt: '2011-10-21',
          group: 'gruppe1',
        },
        {
          id: 6,
          name: 'Bohn',
          email: 'temail@tutanota.com',
          createdAt: '2011-10-31',
          group: 'gruppe2',
        },
        {
          id: 7,
          name: 'Tellohn',
          email: 'temail@tutanota.com',
          createdAt: '2009-10-31',
          group: 'gruppe2',
        },
        {
          id: 7,
          name: 'Tellohn',
          email: 'temail@tutanota.com',
          createdAt: '2009-10-31',
          group: 'gruppe5',
        },
      ],
    }
  },
  methods: {
    onRowClick(params) {
      console.log(params.row)
      this.showNewUser = false
      // params.row - row object
      // params.pageIndex - index of this row on the current page.
      // params.selected - if selection is enabled this argument
      // indicates selected or not
      // params.event - click event
    },
    onSearch(params) {
      console.log(params)
      // params.searchTerm - term being searched for
      // params.rowCount - number of rows that match search
    },
    mySearchFn(params) {
      //console.log(params)
    },
    validateEmail(value) {
      if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
        this.msg['email'] = ''
      } else {
        this.msg['email'] = 'Invalid Email Address'
      }
    },
  },
  watch: {
    mail(value) {
      // binding this to the data value in the email input
      this.email = value
      this.validateEmail(value)
    },
  },
}
</script>
