<template>
  <div>
      <b-row>
        <b-col xl="12" md="12">
         <base-button  icon type="primary" size="lg"  v-b-toggle.collapse-1>
            <span class="btn-inner--icon"><i class="ni ni-curved-next"></i></span>
            <span class="btn-inner--text">{{ $t('site.overview.send_gradido') }} </span>
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
  </div>
</template>

<script>
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader'
import { BIcon } from 'bootstrap-vue'

export default {
  name: 'GddSent',
  components: {
        QrcodeStream,
        QrcodeDropZone,
        QrcodeCapture,
        BIcon
     },
  data(){
    return {
      scan: false,
       show: true,
       form: {
          img: '',
          email: '',
          amount1: '',          
          amount2: ''          
        }
    }
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
         adressbook() {
        this.modal = true
        this.modaldata.h4 = 'Adressbuch'
        this.modaldata.p = 'TODO ADRESSBUCH LISTE'
      }
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
    }  
};
</script>