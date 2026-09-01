<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isMobileOpen = ref(false)

const props = defineProps({
  activeMenu: {
    type: String,
    default: 'Dashboard Overview'
  },
  badgeCounts: {
    type: Object,
    default: () => ({ pending: 0, ready: 0, residentApprovals: 0 })
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
        <div class="w-8 h-8 bg-white rounded flex items-center justify-center text-brand-blue shrink-0">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clip-rule="evenodd"></path></svg>
        </div>
        <h2 class="font-bold text-lg m-0 truncate">Admin Portal</h2>
        <button @click="isMobileOpen = false" class="md:hidden ml-auto bg-brand-light-blue p-1 rounded hover:bg-opacity-80 transition shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
      </div>
      
      <div class="mt-4 flex flex-col">
        <div 
          class="sidebar-nav-item group" 
          :class="{ 'active': activeMenu === 'Dashboard Overview' }"
          @click="router.push('/admin-dashboard')"
        >
          <svg class="w-5 h-5 mr-3" :class="activeMenu === 'Dashboard Overview' ? 'text-white' : 'text-blue-200 group-hover:text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          Dashboard Overview
        </div>
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Resident Approvals' }"
          @click="router.push('/resident-approvals')"
        >
          <svg class="w-5 h-5 mr-3" :class="activeMenu === 'Resident Approvals' ? 'text-white' : 'text-blue-200 group-hover:text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          Resident Approvals
          <span v-if="badgeCounts.residentApprovals > 0" class="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ badgeCounts.residentApprovals }}</span>
        </div>
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Account Management' }"
          @click="router.push('/account-management')"
        >
          <svg class="w-5 h-5 mr-3" :class="activeMenu === 'Account Management' ? 'text-white' : 'text-blue-200 group-hover:text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          Account Management
        </div>
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Document Management' }"
          @click="router.push('/document-management')"
        >
          <svg class="w-5 h-5 mr-3" :class="activeMenu === 'Document Management' ? 'text-white' : 'text-blue-200 group-hover:text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Document Management
        </div>

        <div class="mt-2 mb-2 mx-5 border-t border-white/10"></div>
        <div class="px-5 mb-2">
          <span class="text-[9px] uppercase tracking-widest text-blue-200/50 font-bold">Operations</span>
        </div>

        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Pending Review' }"
          @click="router.push('/staff-pending')"
        >
          <svg class="w-5 h-5 mr-3" :class="activeMenu === 'Pending Review' ? 'text-white' : 'text-blue-200 group-hover:text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Pending Review
          <span v-if="badgeCounts.pending > 0" class="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ badgeCounts.pending }}</span>
        </div>
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Printing & Releases' }"
          @click="router.push('/staff-ready-to-print')"
        >
          <svg class="w-5 h-5 mr-3" :class="activeMenu === 'Printing & Releases' ? 'text-white' : 'text-blue-200 group-hover:text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          Printing & Releases
          <span v-if="badgeCounts.ready > 0" class="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ badgeCounts.ready }}</span>
        </div>

        <div class="mt-2 mb-2 mx-5 border-t border-white/10"></div>
        <div class="px-5 mb-2">
          <span class="text-[9px] uppercase tracking-widest text-blue-200/50 font-bold">System</span>
        </div>

        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'Audit Logs' }"
          @click="router.push('/audit-logs')"
        >
          <svg class="w-5 h-5 mr-3" :class="activeMenu === 'Audit Logs' ? 'text-white' : 'text-blue-200 group-hover:text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
          Audit Logs
        </div>
        <div 
          class="sidebar-nav-item group"
          :class="{ 'active': activeMenu === 'System Settings' }"
          @click="router.push('/system-settings')"
        >
          <svg class="w-5 h-5 mr-3" :class="activeMenu === 'System Settings' ? 'text-white' : 'text-blue-200 group-hover:text-white'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          System Settings
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
