<script setup>
import { useToast } from '../composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto bg-white/80 backdrop-blur-md border border-white shadow-xl rounded-xl p-4 flex items-start gap-3 transition-all duration-300 transform origin-top-right relative overflow-hidden"
      >
        <div 
          class="w-1 absolute left-0 top-0 bottom-0"
          :class="{
            'bg-emerald-500': toast.type === 'success',
            'bg-red-500': toast.type === 'error',
            'bg-blue-500': toast.type === 'info'
          }"
        ></div>

        <div class="flex-1 ml-1">
          <div class="flex items-center gap-2 mb-1">
            <span v-if="toast.type === 'success'" class="text-emerald-500 text-lg">✅</span>
            <span v-else-if="toast.type === 'error'" class="text-red-500 text-lg">⚠️</span>
            <span v-else class="text-blue-500 text-lg">ℹ️</span>
            
            <h4 class="m-0 text-sm font-bold text-gray-900">
              {{ toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Notice' }}
            </h4>
          </div>
          <p class="m-0 text-sm text-gray-600 font-medium leading-tight">
            {{ toast.message }}
          </p>
        </div>

        <button 
          @click="removeToast(toast.id)" 
          class="text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer p-1 rounded-md transition-colors"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
