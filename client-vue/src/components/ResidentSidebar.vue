<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  activeMenu: {
    type: String,
    default: 'Dashboard'
  }
})

const handleLogout = () => {
  localStorage.clear()
  router.push('/')
}
</script>

<template>
  <div class="hidden md:flex flex-col w-[260px] bg-brand-blue text-white sticky top-0 h-screen shadow-lg z-10 shrink-0">
    <div class="flex-1">
      <div class="p-6 flex items-center gap-3">
        <div class="w-8 h-8 bg-white rounded flex items-center justify-center text-brand-blue font-bold text-xl shadow-sm">
          🏘️
        </div>
        <div>
          <h2 class="font-bold text-lg m-0 leading-tight">Resident Portal</h2>
          <p class="text-xs text-blue-200 m-0 uppercase tracking-widest font-semibold">E-Services</p>
        </div>
      </div>
      
      <div class="mt-4 flex flex-col">
        <div 
          class="sidebar-nav-item group" 
          :class="{ 'active': activeMenu === 'Dashboard' }"
          @click="router.push('/resident-dashboard')"
        >
          <span class="mr-3 text-lg">📊</span>
          Dashboard
        </div>
        
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Request Document' }"
          @click="router.push('/document-request')"
        >
          <span class="mr-3 text-lg">📄</span>
          Request Document
        </div>
        
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Profile Settings' }"
          @click="router.push('/profile')"
        >
          <span class="mr-3 text-lg">👤</span>
          Profile Settings
        </div>
      </div>
    </div>
    
    <div class="hidden md:block mb-6 px-4">
      <div class="flex items-center p-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors cursor-pointer group" @click="handleLogout">
        <div class="w-8 h-8 rounded bg-white/10 flex items-center justify-center mr-3 group-hover:bg-red-500 transition-colors">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </div>
        <span class="font-bold text-sm">Logout Account</span>
      </div>
    </div>
  </div>
</template>
