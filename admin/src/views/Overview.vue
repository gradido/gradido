<template>
  <div>
    <user-table count="5" />

    Startübersicht Adminbereich
    <ul>
      <li>Unbestätigte E-mail Registrierung</li>
      <li>offene Schöpfungen</li>
      <li>letzte 10 Schöpfungen</li>
    </ul>
  </div>
</template>
<script>
import UserTable from '../components/UserTable.vue'
export default {
  name: 'overview',
  components: {
    UserTable,
  },
}
</script>
