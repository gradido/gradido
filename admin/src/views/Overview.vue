<template>
  <div>
    <create-formular />
    <hr />

    <user-table count="5" area="overview" />

    Startübersicht Adminbereich
    <ul>
      <li>Unbestätigte E-mail Registrierung</li>
      <li>offene Schöpfungen</li>
      <li>letzte 10 Schöpfungen</li>
    </ul>
  </div>
</template>
<script>
import CreateFormular from '../components/CreateFormular.vue'
import UserTable from '../components/UserTable.vue'
export default {
  name: 'overview',
  components: {
    CreateFormular,
    UserTable,
  },
}
</script>
