<template>
  <div>
    {{ item }}
    <div class="mt-5">
      <b-form-checkbox switch size="lg" v-model="checked">deleted User</b-form-checkbox>
    </div>
    <div class="mt-3">GDD Stand: 20 GDD</div>
    <div class="mt-3 mb-5">
      <b-button v-if="checked" variant="success" @click="deleteAdd">User now deleted</b-button>
    </div>
  </div>
</template>
<script>
// import { sendActivationEmail } from '../graphql/sendActivationEmail'

export default {
  name: 'DeletedUser',
  props: {
    item: {
      type: Object,
    },
  },
  data() {
    return {
      checked: false,
    }
  },
  methods: {
    deleteAdd() {
      alert('TODO: Apollo query deleteAdd')
    },
  },
}
</script>
<style>
.input-group-text {
  background-color: rgb(255, 252, 205);
}
</style>
