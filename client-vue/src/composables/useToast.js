import { ref } from 'vue'

const toasts = ref([])
let toastIdCounter = 0

const addToast = (message, type = 'success') => {
  const id = toastIdCounter++
  const toast = { id, message, type }
  toasts.value.push(toast)
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    removeToast(id)
  }, 3000)
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

export function useToast() {
  return {
    toasts,
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    info: (message) => addToast(message, 'info'),
    removeToast
  }
}
