<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  title: {
    type: String,
    default: 'Provide Input'
  },
  message: {
    type: String,
    default: 'Please enter a value:'
  },
  confirmText: {
    type: String,
    default: 'Submit'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  placeholder: {
    type: String,
    default: 'Type here...'
  },
  isRequired: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const inputValue = ref('')
const inputRef = ref(null)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    inputValue.value = ''
    setTimeout(() => {
      if (inputRef.value) inputRef.value.focus()
    }, 50)
  }
})

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('cancel')
  }
}

const handleSubmit = () => {
  if (props.isRequired && !inputValue.value.trim()) return
  emit('confirm', inputValue.value)
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
      <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" @click="emit('cancel')"></div>
      
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all p-6">
        <h3 class="text-xl font-bold text-gray-900 m-0 mb-2">{{ title }}</h3>
        <p class="text-gray-600 m-0 mb-4 text-sm leading-relaxed">{{ message }}</p>
        
        <form @submit.prevent="handleSubmit">
          <textarea 
            v-model="inputValue" 
            ref="inputRef"
            :placeholder="placeholder"
            class="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-blue mb-5 min-h-[100px] resize-none box-border"
            :required="isRequired"
          ></textarea>
          
          <div class="flex items-center gap-3 w-full">
            <button 
              type="button"
              @click="emit('cancel')" 
              class="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors border-none cursor-pointer"
            >
              {{ cancelText }}
            </button>
            <button 
              type="submit" 
              class="flex-1 py-3 px-4 bg-brand-blue hover:bg-brand-light-blue text-white rounded-xl font-bold transition-colors border-none cursor-pointer shadow-sm"
            >
              {{ confirmText }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
  opacity: 0;
}
</style>
