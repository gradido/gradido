<template>
  <div>
    <b-row>
        <b-col xl="12" md="12">
         <base-button   icon type="info" size="lg"  v-b-toggle.collapse-2>
            <span class="btn-inner--icon"><i class="ni ni-fat-add"></i></span>
            <span class="btn-inner--text">{{ $t('site.overview.add_work') }} </span>
          </base-button>
            <b-collapse id="collapse-2" class="mt-2">
              <b-card>
                <div class="card-text">
                    <b-row>
                      <b-col>
                        <h1>Neuer Beitrag</h1>
                        <h3>{ Name der Community }</h3>
                      </b-col>
                      <b-col>  
                       <h3>Bitte trage jede arbeit einzeln ein.</h3> 
                      </b-col>
                    </b-row>               
                    <hr>
                    <b-form @submit="onSubmit" @reset="onReset" v-if="show">
                      
                         <b-row class="form-group">
                          <label for="example-datetime-local-input" class="col-md-2 col-form-label form-control-label">von</label>
                          <b-col md="10">
                            <base-input type="datetime-local" value="2018-11-23T10:30:00" v-model="form.from"/>
                          </b-col>
                        </b-row>
                           <b-row class="form-group">
                          <label for="example-datetime-local-input" class="col-md-2 col-form-label form-control-label">bis</label>
                          <b-col md="10">
                            <base-input type="datetime-local" value="2018-11-23T10:30:00" v-model="form.to"/>
                          </b-col>
                        </b-row>
                          <b-row class="form-group">
                            <label class="col-md-2 col-form-label form-control-label">Ort</label>
                            <b-col md="10">
                              <base-input placeholder="Berlin" v-model="form.location"></base-input>
                            </b-col>
                          </b-row>
                          
                          
                         <base-input label="Beitrag">
                          <textarea class="form-control" id="exampleFormControlTextarea3" rows="3" v-model="form.text"></textarea>
                        </base-input>
                      
                      <br>                
                       
                    <br>
                    <b-button type="submit" variant="success">jetzt einreichen <small>{{timestamp}}</small></b-button>
                    <b-button type="reset" variant="danger">Cancel</b-button>
                    <br>
                  </b-form> 
                </div>
              </b-card>
            </b-collapse>
        </b-col>
      </b-row>
  </div>
</template>

<script>
export default {
  name: 'GDDAddWork',
  data(){
    return {
      show: true,
       form: {
           from:'',
           to: '',
           hours: 0,
           text: '',
           gdd: 0.00,
           location: '',
           text2: ''
        },
        timestamp: ""
    }
  },
  created() {
    setInterval(this.getNow, 2000);
  },
  methods: {
    getNow: function() {
      const today = new Date();      
      const date = today.getDate()+'.'+(today.getMonth()+1)+'.'+ today.getFullYear();
      const time = today.getHours() + ":" + today.getMinutes();
      const dateTime = date +', '+ time;      
      this.timestamp = new Date();
    },
    getHours: function (from,to) {
      const a = (to - from)
      console.log("(to - from)", (to - from)) 
      console.log("a summe", a) 
    },
    onSubmit(event) {
        event.preventDefault()
        console.log("onSUBMIT this.form.from >>>>",  this.form.from)
        console.log("onSUBMIT this.form.from >>>>",  this.moment(this.form.from))
        console.log("onSUBMIT this.form.to >>>>",  this.form.to)
       // console.log("onSUBMIT >>>>", this.getHours(this.form.from, this.form.to))
        alert(JSON.stringify(this.form))
     
      },
      onReset(event) {
        event.preventDefault()
        // Reset our form values
       
        // Trick to reset/clear native browser form validation state
        this.show = false
        this.$nextTick(() => {
          this.show = true
        })
      }
  }
};
</script>