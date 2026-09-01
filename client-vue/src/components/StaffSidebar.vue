<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isMobileOpen = ref(false)

const props = defineProps({
  activeMenu: {
    type: String,
    default: 'Home Dashboard'
  },
  canReview: {
    type: Boolean,
    default: false
  },
  counts: {
    type: Object,
    default: () => ({ pending: 0, ready: 0, pickup: 0 })
  }
})

const handleLogout = () => {
  localStorage.clear()
  router.push('/')
}
</script>

<template>
  <!-- Mobile FAB Hamburger -->
  <button 
    @click="isMobileOpen = true"
    class="md:hidden fixed bottom-6 right-6 z-[100] p-4 bg-brand-blue text-white rounded-full shadow-2xl hover:bg-brand-light-blue transition-transform active:scale-95"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
  </button>

  <!-- Mobile Overlay -->
  <div 
    v-if="isMobileOpen" 
    @click="isMobileOpen = false"
    class="md:hidden fixed inset-0 bg-black/60 z-[110] backdrop-blur-sm transition-opacity"
  ></div>

  <!-- Sidebar Container -->
  <div 
    :class="[
      'w-[260px] bg-brand-blue text-white flex flex-col justify-between h-screen shadow-2xl md:shadow-lg shrink-0 transition-transform duration-300 z-[120]',
      'fixed top-0 left-0 md:sticky md:translate-x-0',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <div>
      <div class="p-6 flex items-center gap-3">
        <div class="w-8 h-8 bg-white rounded flex items-center justify-center text-brand-blue font-bold text-xl shrink-0">
          👨‍💼
        </div>
        <h2 class="font-bold text-lg m-0 truncate">Front Desk</h2>
        <button @click="isMobileOpen = false" class="md:hidden ml-auto bg-brand-light-blue p-1 rounded hover:bg-opacity-80 transition shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
      </div>
      
      <div class="mt-4 flex flex-col">
        <div 
          class="sidebar-nav-item group" 
          :class="{ 'active': activeMenu === 'Home Dashboard' }"
          @click="router.push('/staff-home')"
        >
          <span class="mr-3 text-lg">🏠</span>
          Home Dashboard
        </div>
        
        <div 
          v-if="canReview"
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Pending Review' }"
          @click="router.push('/staff-pending')"
        >
          <span class="mr-3 text-lg">📋</span>
          Pending Review
          <span v-if="counts.pending > 0" class="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ counts.pending }}</span>
        </div>
        
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Ready to Print' }"
          @click="router.push('/staff-ready-to-print')"
        >
          <span class="mr-3 text-lg">🔖</span>
          Printing & Releases
          <span v-if="(counts.ready + counts.pickup) > 0" class="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ counts.ready + counts.pickup }}</span>
        </div>
        
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Document Records' }"
          @click="router.push('/document-records')"
        >
          <span class="mr-3 text-lg">📁</span>
          Document Records
        </div>
      </div>
    </div>
    
    <div class="mb-6 px-4">
      <div class="flex items-center p-3 rounded-lg border border-white/20 hover:bg-white/10 transition-colors cursor-pointer group" @click="handleLogout">
        <div class="w-8 h-8 rounded bg-white/10 flex items-center justify-center mr-3 group-hover:bg-red-500 transition-colors">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </div>
        <span class="font-bold text-sm">Logout Account</span>
      </div>
    </div>
  </div>
</template>
