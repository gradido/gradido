<template>
  <div class="mt-3 mb-5">
    <b-button @click="showModal">{{ $t('settings.GMS.location.button') }}</b-button>
    <modal v-show="isModalVisible" 
      @close="closeModal"
      @before-open="beforeOpen"
      @before-close="beforeClose" 
      />
  </div>
</template>
<script>
import modal from '@/components/UserSettings/UserGMSLocationCapturing'
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
    beforeOpen (event) {
       this.modal.data = event.params;
    },
    beforeClose () {
      this.$emit(this.modal.data);
    },
  },
}
</script>
