<template>
  <div>
    <!--
        <b-table striped hover :items="items" :fields="fields" :tbody-tr-class="rowClass" responsive="true" >
          <template  #cell(status)="row">   
            <img  v-if="row.item.status === 'sent' " src="img/icons/gradido/minus.png" width="50" />          
            <img  v-else src="img/icons/gradido/plus-low.png" width="50" />            
          </template>
          <template #cell(details)="row">
            <b-button size="md" @click="row.toggleDetails" class="mr-2">
              {{ row.detailsShowing ? $t('site.overview.table.hide')  : $t('site.overview.table.view') }}
            </b-button>        
          </template>

          <-- Table details  -- >
          <template #row-details="row">
            <b-card>
              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>{{ $t('site.overview.table.amount') }}:</b></b-col>
                <b-col>{{ row.item.amount }} GDD</b-col>
              </b-row>
              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>{{ $t('site.overview.table.decay') }}: </b></b-col>
                <b-col>{{ row.item.isActive }}0.0032 GDD</b-col>
              </b-row>
              <b-row class="mb-2">
                <b-col sm="3" class="text-sm-right"><b>{{ $t('site.overview.table.sender') }}: </b></b-col>
                <b-col>{{ row.item.name }}</b-col>
                <b-col>{{ row.item.date }}</b-col>
              </b-row>

              <b-button size="sm" @click="row.toggleDetails">{{ $t('site.overview.table.hide_details') }}</b-button>
            </b-card>
          </template>
        </b-table>
        -->
        <hr>

        <b-list-group > 
          <b-list-group-item v-for="item in items" :key="item.id"> 
          <div class="d-flex w-100 justify-content-between"  @click="toogle(item)" >
            <b-icon v-if="item.status === 'sent'" icon="box-arrow-left"   class="m-1"  font-scale="2" style="color:red"></b-icon>
            <b-icon v-else icon="box-arrow-right" class="m-1"  font-scale="2" style="color:green" ></b-icon>       
              <h1 class="mb-1">{{item.betrag}} <small>GDD</small></h1>
              <h2 class="text-muted"><small>{{item.datum}}</small> - {{item.name}}</h2>
            </div>
          </b-list-group-item>
        </b-list-group>

  </div>
</template>

<script>


export default {
  name: 'GddTable',  
  data(){
    return {
        form: [],
        fields: [ 'status', 'betrag', 'name', 'datum', 'details'],
        items: [
          {  id: 1, betrag: 1000, name: 'Dickerson', datum: '12.12.20', datel: '12.12.2020 14:04', status: 'received' },
          {  id: 2, betrag: 302,  name: 'Larsen',    datum: '22.06.20', datel: '22.06.2020 22:23', status: 'sent'  },
          {  id: 3, betrag: 89,   name: 'Geneva',    datum: '15.04.20', datel: '15.04.2020 12:55', status: 'sent' },
          {  id: 4, betrag: 1000, name: 'Community', datum: '10.03.20', datel: '10.03.2020 18:20', status: 'received'}
        ]      
    };
  },
  methods: {
     rowClass(item, type) {
        if (!item || type !== 'row') return
        if (item.status === 'received') return 'table-success'
        if (item.status === 'sent') return 'table-warning'
        if (item.status === 'earned') return 'table-primary'
      },
      toogle(item) {
        const temp = '<b-collapse visible v-bind:id="item.id">xxx <small class="text-muted">porta</small></b-collapse>'

      }
  },
  watch: { 
  }
};
</script>
<style>
.el-table .cell{
  padding-left: 0px;
  padding-right: 0px;
}
</style>