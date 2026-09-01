<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import StaffSidebar from '../components/StaffSidebar.vue'

const router = useRouter()
const stats = ref({
  totalPending: 0,
  totalReady: 0,
  totalPickup: 0
})
const counts = ref({ pending: 0, ready: 0, pickup: 0 })
const recentTasks = ref([])
const currentTime = ref('')
const currentDate = ref('')
const canReview = ref(false)
const isStatsLoading = ref(true)
let interval = null

const updateDateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  currentDate.value = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const fetchStaffData = async () => {
  const staffId = localStorage.getItem('userId')
  if (!staffId) return

  try {
    const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`)
    canReview.value = Number(profileRes.data.can_review) === 1
    localStorage.setItem('canReview', profileRes.data.can_review)

    const res = await axios.get('http://localhost:5000/api/staff/pending-requests')
    const pending = res.data.filter(r => r.status === 'Pending')
    const ready = res.data.filter(r => r.status === 'Ready to Print' || r.status === 'Waiting for Printing')
    const pickup = res.data.filter(r => r.status === 'Ready for Pickup')
    
    stats.value.totalPending = pending.length
    stats.value.totalReady = ready.length
    stats.value.totalPickup = pickup.length
    counts.value = { pending: pending.length, ready: ready.length, pickup: pickup.length }
    recentTasks.value = res.data.slice(0, 5)
  } catch (error) {
    console.error("Failed to fetch staff data", error)
  } finally {
    isStatsLoading.value = false
  }
}

onMounted(() => {
  canReview.value = localStorage.getItem('canReview') === '1'
  updateDateTime()
  setInterval(updateDateTime, 1000)
  fetchStaffData()
  interval = setInterval(fetchStaffData, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <StaffSidebar activeMenu="Home Dashboard" :counts="counts" :canReview="canReview" />

    <!-- Main Content -->
    <div class="flex-1 p-8 overflow-y-auto">
      
      <!-- Top Header -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-[#1e293b] m-0">Staff Workspace</h1>
        
        <div class="flex gap-4">
          <div class="dashboard-card py-2 px-4 shadow-sm border border-gray-100 flex flex-col justify-center items-end bg-white rounded-lg">
            <span class="text-xs text-gray-500 font-medium">{{ currentDate }}</span>
            <span class="text-base font-bold text-gray-800">{{ currentTime }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Tasks to Review: shows access card if no privilege -->
        <div v-if="canReview" class="dashboard-card border-l-4 border-l-amber-500 flex items-center gap-4 cursor-pointer hover:bg-gray-50" @click="router.push('/staff-pending')">
            <div class="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-500 m-0 uppercase tracking-wide">Tasks to Review</h4>
              <p class="text-3xl font-bold text-gray-800 m-0 mt-1">{{ stats.totalPending }}</p>
            </div>
        </div>
        <div v-else class="dashboard-card border-l-4 border-l-gray-300 flex items-center gap-4 opacity-60 cursor-not-allowed select-none">
            <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-400 m-0 uppercase tracking-wide">Tasks to Review</h4>
              <p class="text-xs text-gray-400 mt-1 font-medium">No Access — Contact Admin</p>
            </div>
        </div>

        <div class="dashboard-card border-l-4 border-l-emerald-500 flex items-center gap-4 cursor-pointer hover:bg-gray-50" @click="router.push('/staff-ready-to-print')">
            <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-gray-500 m-0 uppercase tracking-wide">Printing & Releases</h4>
              <p class="text-3xl font-bold text-gray-800 m-0 mt-1">{{ stats.totalReady + stats.totalPickup }}</p>
            </div>
        </div>
      </div>

      <!-- Recent Tasks -->
      <div class="dashboard-card">
        <div class="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
          <h3 class="text-lg font-bold text-gray-700 m-0">Recent Resident Requests</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-600">
            <thead class="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th class="px-6 py-3 rounded-tl-lg">Resident Name</th>
                <th class="px-6 py-3">Document Type</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(req, index) in recentTasks" :key="index" class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4 font-medium text-gray-900">{{ req.first_name }} {{ req.last_name }}</td>
                <td class="px-6 py-4 font-medium text-gray-700">{{ req.doc_name }}</td>
                <td class="px-6 py-4">
                  <span :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                    req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                    req.status === 'Ready for Pickup' ? 'bg-blue-100 text-blue-800' :
                    req.status === 'Waiting for Printing' || req.status === 'Ready to Print' ? 'bg-purple-100 text-purple-800' :
                    'bg-emerald-100 text-emerald-800'
                  ]">
                    {{ req.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button 
                    v-if="req.status === 'Pending' && canReview"
                    @click="router.push('/staff-pending')"
                    class="text-amber-600 hover:underline font-semibold text-xs"
                  >Review</button>
                  <button 
                    v-else-if="req.status === 'Waiting for Printing' || req.status === 'Ready to Print'"
                    @click="router.push('/staff-ready-to-print')"
                    class="text-emerald-600 hover:underline font-semibold text-xs"
                  >Print</button>
                  <button 
                    v-else-if="req.status === 'Ready for Pickup'"
                    @click="router.push('/staff-ready-to-print')"
                    class="text-blue-600 hover:underline font-semibold text-xs"
                  >Release</button>
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>
              </tr>
              <tr v-if="isStatsLoading">
                <td colspan="4" class="px-6 py-8 text-center text-gray-400">Loading recent tasks...</td>
              </tr>
              <tr v-else-if="recentTasks.length === 0">
                <td colspan="4" class="px-6 py-8 text-center text-gray-400">No active tasks.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
