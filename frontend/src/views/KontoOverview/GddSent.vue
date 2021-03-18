<template>
  <div>
    <b-row>
      <b-col xl="12" md="12">
          <base-button  block icon type="primary" size="lg"  v-b-toggle.collapse-1>
            <span class="btn-inner--text">{{ $t('site.overview.send_gradido') }} </span>
          </base-button>
          <b-collapse id="collapse-1" class="mt-2">
            <b-card >              
              <div  v-if="scan">
                <b-row>                                          
                    <qrcode-capture @detect="onDetect"  capture="user" ></qrcode-capture>                     
                </b-row>                     
                <b-row>                     
                  <qrcode-stream @decode="onDecode" @detect="onDetect" ></qrcode-stream>
                    <b-alert show  variant="secondary">                        
                        <span class="alert-text"><strong>QR Code Scanner</strong> - Scanne den QR Code deines Partners</span>
                    </b-alert>
                    <b-alert show variant="warning" >                      
                      <span class="alert-text"  @click="scan=false"><strong>abrechen!</strong></span>
                    </b-alert>
                </b-row>  
                 
              </div>
              <validation-observer v-slot="{handleSubmit}" ref="formValidator">             
                <b-form  role="form" @submit.prevent="handleSubmit(onSubmit)" @reset="onReset" v-if="show">                     
                  <br>
                  <qrcode-drop-zone id="input-0" v-model="form.img"></qrcode-drop-zone>
                  <br>
                  <div>
                    <b-input-group
                      id="input-group-1"
                        label="Empfänger:"
                        label-for="input-1"
                        description="We'll never share your email with anyone else."
                          size="lg"
                        class="mb-3"
                        >
                          <b-input-group-prepend>                            
                                <img src="img/icons/gradido/qr-scan-pure.png" width="80" height="auto" @click="scan=true"/>                             
                          </b-input-group-prepend>
                      <b-form-input 
                          id="input-1"
                          v-model="form.email"
                          type="email"
                          placeholder="E-Mail"
                          :rules="{required: true, email: true}"
                          required
                          style="font-size: xx-large; padding-left:20px"></b-form-input>
                    </b-input-group>
                  </div>
                  <br>                
                  <div>
                    <b-input-group id="input-group-2" label="Betrag:" label-for="input-2"
                      size="lg"
                      class="mb-3"> 
                        <b-input-group-prepend>
                           
                             <img src="img/icons/gradido/plus.png" width="80">  
                           
                        </b-input-group-prepend>
                        <b-form-input  
                          id="input-2"                          
                          v-model="form.amount"
                          type="number" 
                          placeholder="0.01" 
                          step="0.01" 
                          min="0.01" 
                          max="1000"
                          style="font-size: xx-large; padding-left:20px">
                        </b-form-input>
                        
                        <b-input-group-prepend>                           
                            <div class="h1">GDD</div>
                        </b-input-group-prepend>

                    </b-input-group>                           
                    <b-input-group>
                      <b-input-group-prepend>                        
                           <b-icon icon="chat-right-text" class="display-1"></b-icon>
                      </b-input-group-prepend>
                      <b-form-textarea v-model="form.memo"></b-form-textarea>
                    </b-input-group>
 
                  </div>
                  <br>
                  <b-button type="submit" variant="primary">{{$t('form.send_now')}}</b-button>
                  <b-button type="reset" variant="danger">{{$t('form.cancel')}}</b-button>
                  <br>
                </b-form> 
              </validation-observer>
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
          amount: '',
          memo:''     
        }
    }
  },
  methods: {
     async onDecode (decodedString) {
           console.log('onDecode JSON.parse(decodedString)',JSON.parse(decodedString) )
           const arr = JSON.parse(decodedString) 
           // console.log('arr',arr[0].email )
           this.modal.h4 = 'Scan erfolgreich'
           this.modal.p = arr
           this.form.email = arr[0].email
           this.form.amount1 = arr[0].amount
           // console.log('arr mail',arr.email)
           // console.log('arr mail',arr.amount)      
          this.modals2 = true
      },
      async onDetect (promise) {
        try {
          const {
            imageData,    // raw image data of image/frame
            content,      // decoded String
            location      // QR code coordinates
          } = await promise
            console.log('onDetect promise',promise)
            //console.log('JSON.parse(decodedString)',JSON.parse(promise) )
            const arr = JSON.parse(decodedString) 
            console.log('arr',arr)
          
        } catch (error) {
          // ...
        }
      },
      async onSubmit() {
        //event.preventDefault()
        //console.log("onSubmit", this.form)
        this.$store.state.ajaxCreateData.session_id = this.$cookies.get('gdd_session_id')
        this.$store.state.ajaxCreateData.email = this.form.email
        this.$store.state.ajaxCreateData.amount = this.form.amount
        this.$store.state.ajaxCreateData.memo = this.form.memo
        this.$store.state.ajaxCreateData.target_date =  Date.now()

        this.$store.dispatch('ajaxCreate')
      },
      onReset(event) {
        event.preventDefault()
        this.form.email = ''
        this.form.amount = ''  
        this.show = false
        this.$nextTick(() => {
          this.show = true
        })
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