<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js'
import AdminSidebar from '../components/AdminSidebar.vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

const router = useRouter()
const stats = ref({
  totalResidents: 0,
  activeQueue: 0,
  awaitingApproval: 0,
  topReasons: [],
  frequentDocs: []
})
const isStatsLoading = ref(true)
const badgeCounts = ref({ pending: 0, ready: 0, residentApprovals: 0 })
const currentTime = ref('')
const currentDate = ref('')
let timeInterval = null

const searchQuery = ref('')
const showSearchDropdown = ref(false)
const searchOptions = [
  { name: 'Dashboard', path: '/admin-dashboard' },
  { name: 'Account Management', path: '/account-management' },
  { name: 'Residents', path: '/account-management?tab=residents' },
  { name: 'Staff', path: '/account-management?tab=staff' },
  { name: 'Document Management', path: '/document-management' },
  { name: 'Resident Approvals', path: '/resident-approvals' },
  { name: 'Pending Review', path: '/staff-pending' },
  { name: 'Printing & Releases', path: '/staff-ready-to-print' },
  { name: 'System Settings', path: '/system-settings' },
  { name: 'Audit Logs', path: '/audit-logs' }
]

const filteredSearch = computed(() => {
  if (!searchQuery.value) return []
  const q = searchQuery.value.toLowerCase()
  return searchOptions.filter(opt => opt.name.toLowerCase().includes(q))
})

const handleSearchSelect = (path) => {
  router.push(path)
  searchQuery.value = ''
  showSearchDropdown.value = false
}

const updateDateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  currentDate.value = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const fetchStats = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/dashboard-stats')
    stats.value = response.data
  } catch (error) {
    console.error("Failed to fetch admin stats", error)
  } finally {
    isStatsLoading.value = false
  }
}

const fetchCounts = async () => {
  try {
    const [requestsRes, residentsRes] = await Promise.all([
      axios.get('http://localhost:5000/api/staff/pending-requests'),
      axios.get('http://localhost:5000/api/admin/pending-residents')
    ])
    const pending = requestsRes.data.filter(req => req.status === 'Pending').length
    const printAndPickup = requestsRes.data.filter(req => 
      ['Ready to Print', 'Waiting for Printing', 'Ready for Pickup'].includes(req.status)
    ).length
    const residentApprovals = residentsRes.data.length
    badgeCounts.value = { pending, ready: printAndPickup, residentApprovals }
  } catch (error) {
    console.error("Failed to fetch notification counts", error)
  }
}

onMounted(() => {
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 1000)
  
  fetchStats()
  fetchCounts()
  const dataInterval = setInterval(() => {
    fetchStats()
    fetchCounts()
  }, 10000)

  onUnmounted(() => {
    clearInterval(timeInterval)
    clearInterval(dataInterval)
  })
})

const barChartData = () => {
  return {
    labels: stats.value.frequentDocs.map(d => d.name),
    datasets: [{
      label: 'Requests',
      data: stats.value.frequentDocs.map(d => d.value),
      backgroundColor: ['#2dd4bf', '#059669', '#3b82f6', '#8b5cf6', '#f43f5e'],
      borderRadius: 4
    }]
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { borderDash: [5, 5] }, border: { display: false } },
    x: { grid: { display: false }, border: { display: false } }
  }
}

const donutChartData = () => {
  return {
    labels: stats.value.topReasons.map(d => d.name),
    datasets: [{
      data: stats.value.topReasons.map(d => d.value),
      backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'],
      borderWidth: 0,
      cutout: '75%'
    }]
  }
}
const donutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'right', labels: { boxWidth: 10, usePointStyle: true } } }
}
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <AdminSidebar activeMenu="Dashboard Overview" :badgeCounts="badgeCounts" />

    <!-- Main Content -->
    <div class="flex-1 p-8 overflow-y-auto">
      
      <!-- Top Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-[#1e293b] m-0">Dashboard Overview</h1>
        
        <div class="flex gap-4">
          <div class="relative">
            <div class="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm px-3 gap-2 focus-within:border-brand-blue transition-colors">
              <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                v-model="searchQuery"
                @focus="showSearchDropdown = true"
                @blur="setTimeout(() => showSearchDropdown = false, 200)"
                placeholder="Navigate to... (e.g. 'Settings')" 
                class="py-2 text-sm focus:outline-none bg-transparent w-[260px] text-gray-700 placeholder-gray-400"
              >
            </div>
            <div v-if="showSearchDropdown && filteredSearch.length > 0" class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              <div 
                v-for="item in filteredSearch" 
                :key="item.path"
                @click="handleSearchSelect(item.path)"
                class="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 font-medium flex items-center gap-2"
              >
                <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                {{ item.name }}
              </div>
            </div>
            <div v-else-if="showSearchDropdown && searchQuery" class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-sm text-gray-500 text-center">
              No matching pages found.
            </div>
          </div>
          
          <div class="dashboard-card py-2 px-4 shadow-sm border border-gray-100 flex flex-col justify-center items-end bg-white rounded-lg">
            <span class="text-xs text-gray-500 font-medium">{{ currentDate }}</span>
            <span class="text-base font-bold text-gray-800">{{ currentTime }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div @click="router.push('/admin/accounts?tab=residents')" class="dashboard-card flex items-center gap-4 cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-brand-blue bg-white p-4 rounded-xl">
          <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-500 m-0 uppercase tracking-wide">Total Registered</h4>
            <p class="text-3xl font-bold text-gray-800 m-0 mt-1">{{ stats.totalResidents }}</p>
          </div>
        </div>
        
        <div class="dashboard-card flex items-center gap-4 bg-white p-4 rounded-xl border border-transparent">
          <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-500 m-0 uppercase tracking-wide">Active Queue</h4>
            <p class="text-3xl font-bold text-gray-800 m-0 mt-1">{{ stats.activeQueue }}</p>
          </div>
        </div>

        <div @click="router.push('/resident-approvals')" class="dashboard-card flex items-center gap-4 cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-brand-blue bg-white p-4 rounded-xl">
          <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-gray-500 m-0 uppercase tracking-wide">Awaiting Approval</h4>
            <p class="text-3xl font-bold text-gray-800 m-0 mt-1">{{ stats.awaitingApproval }}</p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Bar Chart -->
        <div class="dashboard-card md:col-span-2">
          <div class="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <h3 class="text-lg font-bold text-gray-700 m-0">Request Types Comparison</h3>
          </div>
          <div class="h-64 relative">
             <div v-if="isStatsLoading" class="absolute inset-0 flex items-center justify-center text-gray-400">Loading chart data...</div>
             <Bar v-else-if="stats.frequentDocs.length > 0" :data="barChartData()" :options="barChartOptions" />
             <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">No document requests found.</div>
          </div>
        </div>

        <!-- Donut Chart -->
        <div class="dashboard-card">
          <div class="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
            <h3 class="text-lg font-bold text-gray-700 m-0">Request Analytics</h3>
          </div>
          <div class="h-64 relative flex items-center justify-center">
             <div v-if="isStatsLoading" class="absolute inset-0 flex items-center justify-center text-gray-400">Loading chart data...</div>
             <template v-else-if="stats.topReasons.length > 0">
               <Doughnut :data="donutChartData()" :options="donutChartOptions" />
               <!-- Center Text Overlay -->
               <div class="absolute flex flex-col items-center justify-center pointer-events-none pr-8">
                 <span class="text-2xl font-bold text-gray-800">{{ stats.topReasons.reduce((sum, d) => sum + d.value, 0) }}</span>
                 <span class="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Requests</span>
               </div>
             </template>
             <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">No analytic data available.</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
