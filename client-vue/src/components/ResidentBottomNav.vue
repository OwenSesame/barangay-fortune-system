<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const handleLogout = () => {
  localStorage.clear()
  router.push('/')
}
</script>

<template>
  <div class="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 h-[65px] flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe">
    
    <div 
      @click="router.push('/resident-dashboard')" 
      class="flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors"
      :class="route.path === '/resident-dashboard' ? 'text-brand-blue' : 'text-gray-500 hover:text-brand-blue'"
    >
      <span class="text-xl mb-1">🏠</span>
      <span class="text-[10px] font-bold">Home</span>
    </div>

    <div 
      @click="router.push('/document-request')" 
      class="flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors"
      :class="route.path === '/document-request' ? 'text-brand-blue' : 'text-gray-500 hover:text-brand-blue'"
    >
      <span class="text-xl mb-1">📄</span>
      <span class="text-[10px] font-bold">Apply</span>
    </div>

    <div 
      @click="router.push('/profile')" 
      class="flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors"
      :class="route.path === '/profile' ? 'text-brand-blue' : 'text-gray-500 hover:text-brand-blue'"
    >
      <span class="text-xl mb-1">👤</span>
      <span class="text-[10px] font-bold">Profile</span>
    </div>

    <!-- Divider -->
    <div class="w-px h-8 bg-gray-200 shrink-0 mx-1"></div>

    <div 
      @click="handleLogout" 
      class="flex flex-col items-center justify-center w-full h-full cursor-pointer transition-colors text-gray-500 hover:text-red-500"
    >
      <span class="text-xl mb-1">🚪</span>
      <span class="text-[10px] font-bold">Logout</span>
    </div>

  </div>
</template>
