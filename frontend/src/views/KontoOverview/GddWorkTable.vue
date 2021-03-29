<template>
  <div>
    <b-list-group>
      <b-list-group-item v-for="item in items" :key="item.id">
        <div class="d-flex w-100 justify-content-between" @click="toogle(item)">
          <b-icon
            v-if="item.status == 'submitted'"
            icon="clock-history"
            class="m-1"
            font-scale="2"
            style="color: orange"
          ></b-icon>
          <b-icon v-else icon="check2-all" class="m-1" font-scale="2" style="color: green"></b-icon>
          <h2 class="text-muted">
            <small>{{ item.datel }}</small>
            - {{ item.text }}
          </h2>
        </div>
      </b-list-group-item>
    </b-list-group>
    <hr />
    <b-icon icon="clock-history" class="m-1" font-scale="2" style="color: orange"></b-icon>
    Wartet auf Bestätigung |
    <b-icon icon="check2-all" class="m-1" font-scale="2" style="color: green"></b-icon>
    bestätigt
  </div>
</template>

<script>
export default {
  name: 'GddWorkTable',
  data() {
    return {
      form: [],
      items: [
        {
          id: 1,
          text: 'Zwei Säcke Plastikmüll im Wald gesammelt',
          datel: '12.12.2020 14:04',
          status: 'submitted',
        },
        {
          id: 2,
          text: 'Frau Schmidt bei der Gartenarbeit geholfen.',
          datel: '22.06.2020 22:23',
          status: 'submitted',
        },
        {
          id: 3,
          text: 'Ein online Kurs für nachhaltiges Mülltrennen erstellt',
          datel: '15.04.2020 12:55',
          status: 'confirmed',
        },
        {
          id: 4,
          text: 'Gradido bei meinen Freunden vorgestellt',
          datel: '10.03.2020 18:20',
          status: 'confirmed',
        },
      ],
    }
  },
  methods: {
    rowClass(item, type) {
      if (!item || type !== 'row') return
      if (item.status === 'received') return 'table-success'
      if (item.status === 'sent') return 'table-warning'
      if (item.status === 'earned') return 'table-primary'
    },
    toogle(item) {
      const temp =
        '<b-collapse visible v-bind:id="item.id">xxx <small class="text-muted">porta</small></b-collapse>'
    },
  },
}
</script>
<style>
.el-table .cell {
  padding-left: 0px;
  padding-right: 0px;
}
</style>
