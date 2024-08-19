<template>
  <Teleport to="body">
    <div v-if="props.modelValue" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ props.title }}</h3>
          <button class="close-button" @click="closeModal">
            <IBiX />
          </button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <BButton v-if="okOnly" class="btn-success" @click="emits('on-ok')">
            {{ $t('form.ok') }}
          </BButton>
          <slot v-else name="footer">
            <BButton @click="closeModal">{{ $('form.close') }}</BButton>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '',
  },
  okOnly: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits(['update:modelValue', 'on-ok'])
const closeModal = () => {
  emits('update:modelValue', false)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 50%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-footer {
  margin-top: 15px;
  text-align: right;
}
</style>
