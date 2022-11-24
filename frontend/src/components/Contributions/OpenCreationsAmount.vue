<template>
  <div class="open-creations-amount bg-white appBoxShadow gradido-border-radius p-4">
    <b-table striped hover :items="items"></b-table>
  </div>
</template>
<script>
export default {
  name: 'OpenCreationsAmount',
  data() {
    return {
      items: [
        { monat: 'Oktober', status: 'Max. erreicht', eingereicht: '50 h', stundenOffen: '0 h' },
        { monat: 'November', status: 'einreichen', eingereicht: '20 h', stundenOffen: '30 h' },
      ],
    }
  },
}
</script>
