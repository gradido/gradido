<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-gradient-success">
      <!-- Card stats -->
      <b-row>
        <b-col xl="6" md="6">
          <stats-card title="Aktueller Kontostand"
                      type="gradient-red"
                      sub-title="3500,897 GDD"
                      icon="ni ni-money-coins"
                      class="mb-4">

            <template slot="footer">
              <span class="text-success mr-2">+ 3.48%</span>
              <span class="text-nowrap">seid letzten Monat</span>
            </template>
          </stats-card>
        </b-col>
        <b-col xl="6" md="6">
          <stats-card title="Erhaltene Gradido"
                      type="gradient-orange"
                      sub-title="2,356 GDD"
                      icon="ni ni-cloud-download-95"
                      class="mb-4">

            <template slot="footer">
              <span class="text-success mr-2">+ 12.18%</span>
              <span class="text-nowrap">seid letzen Monat</span>
            </template>
          </stats-card>
        </b-col>
        <b-col xl="12" md="12">
         <base-button block icon type="primary" size="lg"  v-b-toggle.collapse-1>
            <span class="btn-inner--icon"><i class="ni ni-curved-next"></i></span>
            <span class="btn-inner--text">Gradido versenden</span>
          </base-button>
            <b-collapse id="collapse-1" class="mt-2">
              <b-card>
                <p class="card-text">
            
                  <b-form @submit="onSubmit" @reset="onReset" v-if="show">
                      
                  <div>
                    <b-input-group
                      id="input-group-1"
                        label="Empfänger:"
                        label-for="input-1"
                        prepend="@"
                        description="We'll never share your email with anyone else.">

                      <b-form-input 
                          id="input-1"
                          v-model="form.email"
                          type="email"
                          placeholder="E-Mail"
                          required></b-form-input>

                      <b-input-group-append>
                        <b-button variant="outline-primary">Adressbuch</b-button>
                      </b-input-group-append>

                    </b-input-group>
                  </div>
                  <br>
               
                    <div>
                    <b-input-group id="input-group-2" label="Betrag:" label-for="input-2">
                      <b-form-input  id="input-2"
                            v-model="form.amount"
                            type="number"                            
                            required 
                             min="0.001" placeholder="0.000">
                      </b-form-input>
                    </b-input-group>
                  </div>
                     <br>
                  <b-button type="submit" variant="primary">jetzt versenden</b-button>
                  <b-button type="reset" variant="danger">Cancel</b-button>
                     <br>
                  </b-form> 
                  </p>
              </b-card>
            </b-collapse>
        </b-col>
      </b-row>
      <div>
        <b-table :items="items" :fields="fields" :tbody-tr-class="rowClass">
          <template  #cell(show_status)="row">
            <div class="h2 mb-0">
              <b-icon-node-minus v-if="row.item.status === 'sent' "></b-icon-node-minus>
              <b-icon-plus  v-if="row.item.status === 'received' && 'earned'"></b-icon-plus>
            </div>
          </template>
          <template #cell(show_details)="row">
            <b-button size="sm" @click="row.toggleDetails" class="mr-2">
              {{ row.detailsShowing ? 'Ausblenden' : 'Anzeigen'}} der Details
            </b-button>        
          </template>

          <template #row-details="row">
            <b-card>
              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>Betrag:</b></b-col>
                <b-col>{{ row.item.amount }} GDD</b-col>
              </b-row>

              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>Ist aktiv:</b></b-col>
                <b-col>{{ row.item.isActive }}</b-col>
              </b-row>

              <b-button size="sm" @click="row.toggleDetails">Details ausblenden</b-button>
            </b-card>
          </template>
        </b-table>
      </div>
    </base-header>
    <!--Notice modal-->
<modal :show.sync="modals"
       modal-classes="modal-danger"
       modal-content-classes="bg-gradient-danger">
  <h6 slot="header" class="modal-title">Your attention is required</h6>

  <div class="py-3 text-center">
    <i class="ni ni-bell-55 ni-3x"></i>
    <h4 class="heading mt-4">You should read this!</h4>
    <p>A small river named Duden flows by their place and supplies it with the necessary regelialia.</p>
  </div>


  <template slot="footer">
    <base-button type="white">Ok, Got it</base-button>
    <base-button type="link" class="text-white ml-auto" @click="modals.notice = false">Close</base-button>
  </template>

</modal>
  </div> 
  
</template>
<script>
 
  export default {
    components: {
     },
    data() {
      return {
         form: {
          email: '',
          amount: ''          
        },        
        show: true,
        modals: false,
        fields: [ 'show_status', 'amount', 'name', 'date', 'show_details'],
        items: [
          {   amount: 1000, name: 'Dickerson', date: '12.12.2020 14:04', status: 'received' },
          {  amount: 302, name: 'Larsen', date: '22.06.2020 22:23', status: 'sent'  },
          {  amount: 89, name: 'Geneva', date: '15.04.2020 12:55', status: 'sent' },
          {  amount: 1000, name: 'Community', date: '10.03.2020 18:20', status: 'received'}
        ]       
      };
    },
    methods: {
      onSubmit(event) {
        event.preventDefault()
        alert(JSON.stringify(this.form))
        this.modals = true
      },
      onReset(event) {
        event.preventDefault()
        // Reset our form values
        this.form.email = ''
        this.form.amount = ''        
        // Trick to reset/clear native browser form validation state
        this.show = false
        this.$nextTick(() => {
          this.show = true
        })
      },
      rowClass(item, type) {
        if (!item || type !== 'row') return
        if (item.status === 'received') return 'table-success'
        if (item.status === 'sent') return 'table-warning'
        if (item.status === 'earned') return 'table-primary'
         
      }
    },
    mounted() {
       
    },
     computed: {
      state() {
        return this.name.length >= 4
      },
      invalidFeedback() {
        if (this.name.length > 0) {
          return 'Geben Sie mindestens 4 Zeichen ein.'
        }
        return 'Bitte geben Sie eine GDD Adresse ein.'
      }
    },
  };
</script>
<style>
.el-table .cell{
  padding-left: 0px;
  padding-right: 0px;
}
</style>
