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
                <p class="card-text">
                    <b-row>
                      <b-col>
                       11111111
                       
                      </b-col>
                      <b-col>  
                        2222222222
                      </b-col>
                    </b-row>               
                    <b-form @submit="onSubmit" @reset="onReset" v-if="show">
                     
                      <div>
                         
                         <b-row class="form-group">
                          <label for="example-datetime-local-input" class="col-md-2 col-form-label form-control-label">Datetime</label>
                          <b-col md="10">
                            <base-input type="datetime-local" value="2018-11-23T10:30:00" id="example-datetime-local-input"/>
                          </b-col>
                        </b-row>


                         <base-input label="Example textarea">
                          <textarea class="form-control" id="exampleFormControlTextarea3" rows="3"></textarea>
                        </base-input>
                      </div>
                      <br>                
                       
                    <br>
                    <b-button type="submit" variant="success">jetzt einreichen</b-button>
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
export default {
  name: 'GDDAddWork',
  data(){
    return {
      show: true,
       form: {
               
        }
    };
  },
  methods: {
    onSubmit(event) {
        event.preventDefault()
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