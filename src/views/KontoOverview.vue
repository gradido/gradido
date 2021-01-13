<template>
  <div>
    <base-header class="pb-6 pb-8 pt-5 pt-md-8 bg-gradient-success">
      <!-- Card stats -->
      <b-row>
        <b-col xl="6" md="6">
          <stats-card title="Aktueller Kontostand"
                      type="gradient-red"
                      sub-title="3500,897 GDD"
                      img="img/icons/gradido/my_gradido.png"
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
                      img="img/icons/gradido/plus.png"
                      class="mb-4">

            <template slot="footer">
              <span class="text-success mr-2">+ 12.18%</span>
              <span class="text-nowrap">seid letzen Monat</span>
            </template>
          </stats-card>
        </b-col>
      </b-row>
      <!-- Card sent-->
      <b-row>
        <b-col xl="12" md="12">
         <base-button block icon type="primary" size="lg"  v-b-toggle.collapse-1>
            <span class="btn-inner--icon"><i class="ni ni-curved-next"></i></span>
            <span class="btn-inner--text">Gradido versenden</span>
          </base-button>
            <b-collapse id="collapse-1" class="mt-2">
              <b-card>
                <p class="card-text">
                    <b-row>
                      <b-col>
                       
                       <qrcode-capture @detect="onDetect"  capture="user" ></qrcode-capture>
                      </b-col>
                      <b-col>  
                        <span v-if="scan">
                          <qrcode-stream @decode="onDecode" @detect="onDetect" ></qrcode-stream>
                            <b-iconstack font-scale="5" @click="scan=false">
                              <b-icon stacked icon="upc-scan" variant="info" scale="0.75"></b-icon>
                              <b-icon stacked icon="slash-circle" variant="danger"></b-icon>
                            </b-iconstack>
                        </span>
                        <span v-else >
                          <img src="img/icons/gradido/qr-scan-pure.png" width="90" @click="scan=true"/>
                          scan jetzt
                        </span>
                      </b-col>
                    </b-row>               
                    <b-form @submit="onSubmit" @reset="onReset" v-if="show">
                      <br>
                      <qrcode-drop-zone id="input-0" v-model="form.img" ></qrcode-drop-zone>
                      <br>
                      <div>
                        <b-input-group
                          id="input-group-1"
                            label="Empfänger:"
                            label-for="input-1"
                            description="We'll never share your email with anyone else.">

                          <b-form-input 
                              id="input-1"
                              v-model="form.email"
                              type="email"
                              placeholder="E-Mail"
                              required></b-form-input>

                          <b-input-group-append>
                            <b-button variant="outline-primary" @click="adressbook">Adressbuch</b-button>
                          </b-input-group-append>

                        </b-input-group>
                      </div>
                      <br>                
                      <div>
                        <b-input-group id="input-group-2" label="Betrag:" label-for="input-2">
                        <b-form-input  id="input-2"
                              v-model="form.amount1"
                              type="number"                            
                              required 
                              min="0" placeholder="0">
                        </b-form-input>.<h1>GDD.</h1>
                        <b-form-input  id="input-3"
                              v-model="form.amount2"
                              type="number"                             
                              min="00" placeholder="00">
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
      <!-- Card table -->
      <div>
        <b-table striped hover :items="items" :fields="fields" :tbody-tr-class="rowClass">
          <template  #cell(status)="row">   
            <img  v-if="row.item.status === 'sent' " src="img/icons/gradido/minus.png" width="50" />          
              <img  v-else src="img/icons/gradido/plus-low.png" width="50" /> 
               
             
          </template>
          <template #cell(details)="row">
            <b-button size="sm" @click="row.toggleDetails" class="mr-2">
              {{ row.detailsShowing ? 'Ausblenden' : 'Anzeigen'}}
            </b-button>        
          </template>

          <template #row-details="row">
            <b-card>
              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>Betrag:</b></b-col>
                <b-col>{{ row.item.amount }} GDD</b-col>
              </b-row>

              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>Vergänglichkeit: </b></b-col>
                <b-col>{{ row.item.isActive }}0.0032 GDD</b-col>
              </b-row>
                <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>Absender: </b></b-col>
                <b-col>{{ row.item.name }}</b-col>
                <b-col>{{ row.item.date }}</b-col>
              </b-row>

              <b-button size="sm" @click="row.toggleDetails">Details ausblenden</b-button>
            </b-card>
          </template>
        </b-table>
      </div>
    

      <!--Notice modal-->
      <modal :show.sync="modal"
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
      

    </base-header>
  </div>  
</template>
<script>
  import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader'
  import { BIcon } from 'bootstrap-vue'

  export default {
    components: {
        QrcodeStream,
        QrcodeDropZone,
        QrcodeCapture
     },
    data() {
      return {
        scan: false,
        form: {
          img: '',
          email: '',
          amount1: '',          
          amount2: ''          
        },        
        show: true,
        modal: false,
        modaldate: {
          classes:'',
          content_classes:'',
          title:'',
          icon:'',
          h4: '',
          p: '',
          footer_text: ''
        },
        fields: [ 'status', 'betrag', 'name', 'datum', 'details'],
        items: [
          {  betrag: 1000, name: 'Dickerson', datum: '12.12.20', datel: '12.12.2020 14:04', status: 'received' },
          {  betrag: 302,  name: 'Larsen',    datum: '22.06.20', datel: '22.06.2020 22:23', status: 'sent'  },
          {  betrag: 89,   name: 'Geneva',    datum: '15.04.20', datel: '15.04.2020 12:55', status: 'sent' },
          {  betrag: 1000, name: 'Community', datum: '10.03.20', datel: '10.03.2020 18:20', status: 'received'}
        ]       
      };
    },
    methods: {
      async onDecode (decodedString) {
           console.log('JSON.parse(decodedString)',JSON.parse(decodedString) )
           const arr = JSON.parse(decodedString) 
            console.log('arr',arr[0].email )
           this.modal.h4 = 'Scan erfolgreich'
           this.modal.p = arr
           this.form.email = arr[0].email
           this.form.amount1 = arr[0].amount
            console.log('arr mail',arr.email)
            console.log('arr mail',arr.amount)
      
          this.modals2 = true
      },
      async onDetect (promise) {
        try {
          const {
            imageData,    // raw image data of image/frame
            content,      // decoded String
            location      // QR code coordinates
          } = await promise
            console.log('promise',promise)
             console.log('JSON.parse(decodedString)',JSON.parse(promise) )
           const arr = JSON.parse(decodedString) 
            console.log('arr',arr)
          
        } catch (error) {
          // ...
        }
      },
      onSubmit(event) {
        event.preventDefault()
        alert(JSON.stringify(this.form))
        this.modal = true
        this.modal.h4 = 'TODO 1'
      },
      onReset(event) {
        event.preventDefault()
        // Reset our form values
        this.form.email = ''
        this.form.amount1 = ''
        this.form.amount2 = ''   
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
         
      },
      adressbook() {
        this.modal = true
        this.modaldata.h4 = 'Adressbuch'
        this.modaldata.p = 'TODO ADRESSBUCH LISTE'
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



 