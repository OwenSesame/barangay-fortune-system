<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import ResidentSidebar from '../components/ResidentSidebar.vue'
import ResidentBottomNav from '../components/ResidentBottomNav.vue'
import ConfirmModal from '../components/Modals/ConfirmModal.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()

const history = ref([])
let interval = null

const isConfirmModalOpen = ref(false)
const requestToCancel = ref(null)

const getDisplayStatus = (dbStatus, orNumber) => {
  if (!dbStatus || dbStatus === 'undefined') return 'Pending'
  if (dbStatus === 'Waiting for Printing') return 'Waiting for Printing'
  if (dbStatus === 'Ready for Pickup') {
    return orNumber ? 'Ready for Pickup (Paid)' : 'Ready for Pickup (Unpaid)'
  }
  if (dbStatus === 'Released') return 'Completed / Picked Up'
  return dbStatus
}

const fetchMyData = async () => {
  try {
    const myId = localStorage.getItem('userId')
    if (!myId) return router.push('/')

    const historyResponse = await axios.get(`http://localhost:5000/api/requests/history/${myId}`)
    history.value = historyResponse.data
  } catch (error) {
    console.error("Dashboard sync error:", error)
  }
}

onMounted(() => {
  fetchMyData()
  interval = setInterval(fetchMyData, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const activeRequests = computed(() => {
  return history.value.filter(req => 
    !['Released', 'Cancelled', 'Rejected'].includes(req.status)
  )
})

const myStats = computed(() => ({
  total: history.value.length,
  completed: history.value.filter(r => r.status === 'Released').length,
  pending: history.value.filter(r => ['Pending', 'Waiting for Printing', 'Ready for Pickup', 'Ready to Print'].includes(r.status)).length
}))

const promptCancel = (requestId) => {
  requestToCancel.value = requestId
  isConfirmModalOpen.value = true
}

const confirmCancel = async () => {
  if (!requestToCancel.value) return
  
  try {
    await axios.put(`http://localhost:5000/api/requests/cancel/${requestToCancel.value}`)
    toast.success("Application Cancelled Successfully.")
    isConfirmModalOpen.value = false
    fetchMyData()
  } catch (error) {
    const errorMsg = error.response?.data?.error || "Error cancelling request."
    toast.error(errorMsg)
    isConfirmModalOpen.value = false
  }
}

const todayString = computed(() => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})
</script>

<template>
  <div class="flex flex-col md:flex-row min-h-screen font-sans pb-[65px] md:pb-0 bg-brand-gray">
    
    <ResidentSidebar activeMenu="Dashboard" />

    <div class="flex-1 p-5 md:p-10 w-full overflow-x-hidden overflow-y-auto">
      
      <!-- Top Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="m-0 text-gray-900 text-3xl font-bold tracking-tight">Resident Portal</h1>
          <p class="m-0 text-gray-500 mt-1">Welcome back. Track and manage your document requests below.</p>
        </div>
        <div class="hidden md:flex">
          <div class="bg-white border border-gray-200 px-5 py-2.5 rounded-xl text-gray-600 text-sm font-medium shadow-sm">
            {{ todayString }}
          </div>
        </div>
      </div>
      
      <!-- Top Cards: Active Queues -->
      <div class="mb-10">
        <h3 class="m-0 mb-4 text-gray-900 text-xl font-bold tracking-tight">Active Applications</h3>
        
        <div v-if="activeRequests.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div 
            v-for="queue in activeRequests" 
            :key="queue.request_id"
            class="bg-white p-6 rounded-2xl shadow-sm border flex flex-col transition-all hover:shadow-md"
            :class="[
              queue.status === 'Ready for Pickup' ? 'border-green-300' : 'border-gray-200'
            ]"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <h4 class="text-gray-500 m-0 mb-1 uppercase text-[10px] font-bold tracking-widest">{{ queue.doc_name === 'undefined' ? 'Document' : queue.doc_name }}</h4>
                <p class="text-3xl font-black text-brand-blue m-0 leading-none">{{ queue.daily_sequence_no || '--' }}</p>
              </div>
              <span 
                class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                :class="[
                  queue.status === 'Ready for Pickup' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                ]"
              >
                {{ getDisplayStatus(queue.status, queue.or_number) }}
              </span>
            </div>

            <p class="text-gray-500 text-xs m-0 mb-4 font-medium flex items-center gap-1">
              📅 Scheduled: <span class="text-gray-900 font-bold">{{ queue.pick_up_date ? new Date(queue.pick_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (queue.scheduled_date ? new Date(queue.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD') }}</span>
            </p>

            <div v-if="queue.status === 'Ready for Pickup' && !queue.or_number" class="mt-auto p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p class="m-0 text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">💳 Payment Required</p>
              <p class="m-0 text-[11px] text-amber-700 leading-tight">Pay <b>₱{{ queue.base_fee || 0 }}</b> at the cashier.</p>
            </div>

            <div v-if="queue.status === 'Ready for Pickup' && queue.or_number" class="mt-auto p-3 bg-green-500 rounded-xl text-center shadow-sm">
              <p class="m-0 text-[10px] text-green-100 uppercase font-bold tracking-widest mb-1">Official Receipt</p>
              <p class="m-0 text-lg font-black text-white tracking-widest">{{ queue.or_number }}</p>
            </div>
            
            <div v-if="(!queue.status || queue.status === 'undefined' || queue.status === 'Pending')" class="mt-auto pt-4 border-t border-gray-100">
              <p class="m-0 text-[11px] text-gray-400">Waiting for staff review.</p>
            </div>
          </div>
          
          <!-- New Application Button Card -->
          <!-- Stats Summary Card -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <h4 class="text-gray-500 m-0 mb-4 uppercase text-[10px] font-bold tracking-widest">My Request Summary</h4>
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-gray-300 inline-block"></span>Total Submitted
                </span>
                <span class="text-lg font-black text-gray-800">{{ myStats.total }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-brand-blue inline-block"></span>In Progress
                </span>
                <span class="text-lg font-black text-brand-blue">{{ myStats.pending }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500 font-medium flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>Completed
                </span>
                <span class="text-lg font-black text-emerald-600">{{ myStats.completed }}</span>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  class="bg-brand-blue h-1.5 rounded-full transition-all duration-700"
                  :style="{ width: myStats.total > 0 ? (myStats.completed / myStats.total * 100) + '%' : '0%' }"
                ></div>
              </div>
              <p class="text-[10px] text-gray-400 mt-1.5 font-medium">
                {{ myStats.total > 0 ? Math.round(myStats.completed / myStats.total * 100) : 0 }}% completed
              </p>
            </div>
          </div>

          <!-- New Application Button Card -->
          <div @click="router.push('/document-request')" class="bg-brand-blue hover:bg-brand-light-blue p-6 rounded-2xl shadow-sm border border-blue-600 flex flex-col justify-center items-center text-center cursor-pointer transition-all group min-h-[160px]">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 text-white text-2xl group-hover:scale-110 transition-transform">
              ➕
            </div>
            <h4 class="text-white m-0 text-base font-bold">New Application</h4>
          </div>
        </div>

        <!-- Empty State for Active -->
        <div v-else class="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center h-[200px]">
          <span class="text-4xl mb-3 grayscale opacity-50">📂</span>
          <h4 class="m-0 text-gray-500 text-sm font-bold">No Active Applications</h4>
          <button @click="router.push('/document-request')" class="mt-4 px-5 py-2.5 bg-brand-blue text-white rounded-lg font-bold text-sm border-none cursor-pointer hover:bg-brand-light-blue transition-colors shadow-sm">
            Apply for a Document
          </button>
        </div>
      </div>

      <!-- Transaction History Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-5 md:p-6 border-b border-gray-100">
          <h3 class="m-0 text-gray-900 text-xl font-bold tracking-tight">Request History</h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px] border-collapse text-left">
            <thead class="bg-gray-50">
              <tr>
                <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold border-b-2 border-gray-200">Date</th>
                <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold border-b-2 border-gray-200">Document</th>
                <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold border-b-2 border-gray-200">Payment</th>
                <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold border-b-2 border-gray-200">Status</th>
                <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wider font-bold border-b-2 border-gray-200">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in history" :key="req.request_id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6 text-gray-500 text-sm">
                  {{ new Date(req.date_requested).toLocaleDateString() }}
                  <div v-if="req.pick_up_date" class="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">
                    For: {{ new Date(req.pick_up_date).toLocaleDateString() }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="font-bold text-gray-900 text-sm">{{ req.doc_name === 'undefined' ? 'Official Document' : req.doc_name }}</div>
                  <div class="text-[11px] text-gray-500 font-medium mt-1 uppercase tracking-wider">Queue: {{ req.daily_sequence_no || '--' }}</div>
                </td>
                <td class="py-4 px-6">
                  <span v-if="req.or_number" class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 tracking-widest">
                    {{ req.or_number }}
                  </span>
                  <div v-else class="text-gray-900 text-sm font-bold">₱{{ req.base_fee || 0 }}</div>
                </td>
                <td class="py-4 px-6">
                  <span 
                    class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                    :class="[
                      (!req.status || req.status === 'undefined' || req.status === 'Pending' || req.status === 'Waiting for Printing') ? 'bg-amber-50 text-amber-700 border-amber-200' : '',
                      req.status === 'Ready for Pickup' ? 'bg-green-50 text-green-700 border-green-200' : '',
                      req.status === 'Released' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : '',
                      (req.status === 'Cancelled' || req.status === 'Rejected') ? 'bg-red-50 text-red-700 border-red-200' : ''
                    ]"
                  >
                    {{ getDisplayStatus(req.status, req.or_number) }}
                  </span>
                  
                  <div v-if="req.status === 'Rejected' && req.remarks" class="text-red-500 text-xs mt-2 font-medium bg-red-50 p-2 rounded-md border border-red-100">
                    <span class="font-bold uppercase text-[9px] tracking-wider block mb-1">Reason for Rejection:</span>
                    {{ req.remarks }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <button 
                    v-if="!req.status || req.status === 'undefined' || req.status === 'Pending'"
                    @click="promptCancel(req.request_id)" 
                    class="px-3 py-1.5 text-xs rounded-lg border border-red-300 bg-white text-red-500 hover:bg-red-50 hover:border-red-400 font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <span v-else class="text-gray-300 text-sm font-bold">--</span>
                </td>
              </tr>
              <tr v-if="history.length === 0">
                <td colspan="5" class="p-12 text-center text-gray-400 text-sm font-medium">You have no historical requests.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
    
    <ResidentBottomNav />

    <!-- Cancellation Modal -->
    <ConfirmModal 
      :isOpen="isConfirmModalOpen"
      title="Cancel Request"
      message="Are you sure you want to cancel this document request? This action cannot be undone."
      confirmText="Yes, Cancel it"
      @confirm="confirmCancel"
      @cancel="isConfirmModalOpen = false"
    />
  </div>
</template>
