<template>
  <div>
      <b-list-group > 
        <b-list-group-item v-for="item in items" :key="item.id"> 
        <div class="d-flex w-100 justify-content-between"  @click="toogle(item)" >
          <b-icon v-if="item.status == 'submitted'" icon="clock-history"   class="m-1"  font-scale="2" style="color:orange"></b-icon>
          <b-icon v-else icon="check2-all" class="m-1"  font-scale="2" style="color:green" ></b-icon>                
            <h2 class="text-muted"><small>{{item.datel}}</small> - {{item.text}}</h2>
          </div>
        </b-list-group-item>
      </b-list-group>
  </div>
</template>

<script>
export default {
  name: 'GddWorkTable',  
  data(){
    return {
        form: [],        
        items: [
          {  id: 1, text: 'Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ', datel: '12.12.2020 14:04', status: 'submitted' },
          {  id: 2, text: 'Larsen Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ', datel: '22.06.2020 22:23', status: 'submitted'  },
          {  id: 3, text: 'Geneva Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ',  datel: '15.04.2020 12:55', status: 'confirmed' },
          {  id: 4, text: 'Community Lorem Ipsum Lorem Ipsum Lorem Ipsum Lorem Ipsum ', datel: '10.03.2020 18:20', status: 'confirmed'}
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
  }
};
</script>
<style>
.el-table .cell{
  padding-left: 0px;
  padding-right: 0px;
}
</style>