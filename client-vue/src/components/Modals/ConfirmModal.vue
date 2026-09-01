<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  confirmText: {
    type: String,
    default: 'Yes, Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmColor: {
    type: String,
    default: 'bg-red-500 hover:bg-red-600'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('cancel')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="emit('cancel')"></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all p-6">
        <h3 class="text-xl font-bold text-gray-900 m-0 mb-2">{{ title }}</h3>
        <p class="text-gray-600 m-0 mb-6 text-sm leading-relaxed">{{ message }}</p>
        
        <div class="flex items-center gap-3 w-full">
          <button 
            @click="emit('cancel')" 
            class="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors border-none cursor-pointer"
          >
            {{ cancelText }}
          </button>
          <button 
            @click="emit('confirm')" 
            class="flex-1 py-3 px-4 text-white rounded-xl font-bold transition-colors border-none cursor-pointer shadow-sm"
            :class="confirmColor"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
