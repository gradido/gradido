<template>
  <div>
    <b-row>
      <b-col xl="12" md="12">
          
               <b-alert variant="warning" show dismissible >
                  <strong>Achtung!</strong> Bitte überprüfe alle deine Eingaben sehr genau. Du bist alleine Verantwortlich für deine Entscheidungen. Versendete Gradidos können nicht wieder zurück geholt werden.
              </b-alert>
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
                     <b-col  class="text-left pl-6">
                       Empfänger
                            
                          </b-col>  
                                      
                    <b-input-group
                      id="input-group-1"
                        label="Empfänger:"
                        label-for="input-1"
                        description="We'll never share your email with anyone else."
                          size="lg"
                        class="mb-3"
                        >
                          <b-input-group-prepend  class="p-3">                            
                                 <b-icon icon="envelope" class="display-3"></b-icon>                            
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
                    <b-col    class="text-left pl-6">
                      Betrag
                            
                          </b-col> 
                      <b-col v-if="($store.state.user.balance == form.amount)"  class="text-right">
                            <b-badge variant="primary">maximale anzahl GDD zum versenden erreicht!</b-badge>
                          </b-col>   
                    <b-input-group id="input-group-2" label="Betrag:" label-for="input-2"
                      size="lg"
                      class="mb-3"> 
                        <b-input-group-prepend>
                           <div class="h3 pt-3 pr-3">GDD</div>
                           
                        </b-input-group-prepend>
                        <b-form-input  
                          id="input-2"                          
                          v-model="form.amount"
                          type="number" 
                          placeholder="0.01" 
                          step="0.01" 
                          min="0.01" 
                          :max="$store.state.user.balance"
                          style="font-size: xx-large; padding-left:20px">
                        </b-form-input>
                    </b-input-group>  
                     <b-col    class="text-left pl-6">
                       Nachricht für den Empfänger
                          </b-col>         
                          
                    <b-input-group>
                      <b-input-group-prepend class="p-3">                        
                           <b-icon icon="chat-right-text" class="display-3"></b-icon>
                      </b-input-group-prepend>
                      <b-form-textarea v-model="form.memo"  class="pl-3"></b-form-textarea>
                    </b-input-group>
 
                  </div>
                  
                  <br>
                  <b-row>
                    <b-col> <b-button type="reset" variant="secondary">{{$t('form.cancel')}}</b-button></b-col>
                   <b-col  class="text-right">  <b-button type="submit" variant="success">{{$t('form.send_now')}}</b-button></b-col>
                  </b-row>
                
                 
                  <br>
                </b-form> 
              </validation-observer>
            </b-card>
          
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
        },
        sent: false,
    }
  },
  methods: {
    sendbutton(){
      this.sent = true
    },
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