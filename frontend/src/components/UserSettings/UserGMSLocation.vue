<template>
  <div class="mt-3 mb-5">
    <b-button @click="showModal">{{ $t('settings.GMS.location.button') }}</b-button>
    <modal v-show="isModalVisible" @close="closeModal" />
  </div>
</template>
<script>
import modal from './UserGMSLocationCapturing.vue'
export default {
  name: 'UserGMSLocation',
  components: {
    modal,
  },
  data() {
    return {
      isModalVisible: false,
    }
  },
  methods: {
    showModal() {
      this.isModalVisible = true
    },
    closeModal() {
      this.isModalVisible = false
    },
  },
}
</script>
