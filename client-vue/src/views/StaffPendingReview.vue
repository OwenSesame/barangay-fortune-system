<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import StaffSidebar from '../components/StaffSidebar.vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import PromptModal from '../components/Modals/PromptModal.vue'
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()
const userRole = ref(localStorage.getItem('role') || 'Staff')
const canReview = ref(false)
const pendingRequests = ref([])
const selectedFiles = ref(null)
const counts = ref({ pending: 0, ready: 0 })
const badgeCounts = ref({ pending: 0, ready: 0, residentApprovals: 0 })

const searchQuery = ref('')
const isPromptOpen = ref(false)
const rejectRequestId = ref(null)

let interval = null

const fetchRequestsAndSync = async () => {
  const staffId = localStorage.getItem('userId')
  if (!staffId) return

  try {
    const profileRes = await axios.get(`http://localhost:5000/api/staff/profile/${staffId}`)
    const currentPermission = Number(profileRes.data.can_review) === 1
    canReview.value = currentPermission
    localStorage.setItem('canReview', profileRes.data.can_review)

    if (!currentPermission) {
      router.push('/staff-home')
      return
    }

    const response = await axios.get('http://localhost:5000/api/staff/pending-requests')
    pendingRequests.value = response.data.filter(req => req.status === 'Pending')
    
    counts.value = {
      pending: pendingRequests.value.length,
      ready: response.data.filter(req => req.status === 'Waiting for Printing' || req.status === 'Ready for Pickup').length
    }
  } catch (error) {
    console.error("Failed to fetch data", error)
  }
}

onMounted(() => {
  canReview.value = localStorage.getItem('canReview') === '1'
  fetchRequestsAndSync()
  interval = setInterval(fetchRequestsAndSync, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const filteredRequests = computed(() => {
  if (!searchQuery.value) return pendingRequests.value
  const q = searchQuery.value.toLowerCase()
  return pendingRequests.value.filter(req => 
    `${req.first_name} ${req.last_name}`.toLowerCase().includes(q) ||
    req.daily_sequence_no?.toString().includes(q) ||
    (req.requested_for_name && req.requested_for_name.toLowerCase().includes(q))
  )
})

const handleUpdateStatus = async (requestId, newStatus) => {
  const staffId = localStorage.getItem('userId')
  try {
    await axios.put(`http://localhost:5000/api/staff/update-status/${requestId}`, { status: newStatus, official_id: staffId })
    fetchRequestsAndSync()
    toast.success("Request approved successfully!")
  } catch (error) {
    toast.error("Error approving request.")
  }
}

const promptReject = (requestId) => {
  rejectRequestId.value = requestId
  isPromptOpen.value = true
}

const confirmReject = async (reason) => {
  const staffId = localStorage.getItem('userId')
  
  try {
    await axios.put(`http://localhost:5000/api/staff/reject/${rejectRequestId.value}`, { official_id: staffId, reason: reason })
    fetchRequestsAndSync()
    toast.success("Request rejected.")
    isPromptOpen.value = false
  } catch (error) {
    toast.error("Error rejecting request.")
    isPromptOpen.value = false
  }
}

const isPdf = (filePath) => filePath && filePath.toLowerCase().endsWith('.pdf')
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <AdminSidebar v-if="userRole === 'Admin'" activeMenu="Pending Review" :badgeCounts="badgeCounts" />
    <StaffSidebar v-else activeMenu="Pending Review" :counts="counts" :canReview="canReview" />

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="m-0 text-gray-900 text-3xl font-bold tracking-tight">Document Validation Queue</h1>
          <p class="text-gray-500 mt-1">Review resident applications and requirements before printing.</p>
        </div>
        
        <div class="w-full md:w-64">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="🔍 Search name or Q#" 
            class="w-full p-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-brand-blue shadow-sm"
          />
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Q #</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Resident / Applicant</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Document & Purpose</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Review Files</th>
              <th class="py-4 px-6 text-gray-500 text-xs uppercase tracking-wide font-bold border-b-2 border-gray-200">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="req in filteredRequests" :key="req.request_id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-4 px-6 font-bold text-brand-blue text-lg">#{{ req.daily_sequence_no }}</td>
              <td class="py-4 px-6">
                <div class="font-bold text-gray-900 text-sm">{{ req.first_name }} {{ req.last_name }}</div>
                <div v-if="req.requested_for_others && req.requested_for_name" class="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  👥 For: {{ req.requested_for_name }}
                </div>
              </td>
              <td class="py-4 px-6">
                <b class="text-gray-900 text-sm">{{ req.doc_name }}</b><br/>
                <span class="text-[11px] text-gray-500 font-semibold">{{ req.purpose }}</span>
              </td>
              <td class="py-4 px-6">
                <button 
                  @click="selectedFiles = { 
                    idImage: req.id_proof_image, 
                    reqFile: req.requirement_file, 
                    authProof: req.authorization_proof, 
                    isForOthers: req.requested_for_others, 
                    forPersonName: req.requested_for_name, 
                    applicantName: `${req.first_name} ${req.last_name}` 
                  }" 
                  class="px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded font-bold text-xs hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  👁️ Files {{ req.requested_for_others ? '(3)' : '(2)' }}
                </button>
              </td>
              <td class="py-4 px-6">
                <div class="flex gap-2">
                  <button 
                    @click="handleUpdateStatus(req.request_id, 'Waiting for Printing')" 
                    class="flex-1 py-2 bg-brand-blue hover:bg-brand-light-blue text-white font-bold rounded text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Approve
                  </button>
                  <button 
                    @click="promptReject(req.request_id)" 
                    class="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredRequests.length === 0">
              <td colspan="5" class="p-12 text-center text-gray-400 text-sm font-medium">
                <div v-if="searchQuery">No results found for "{{ searchQuery }}".</div>
                <div v-else>
                  <span class="text-4xl block mb-2 opacity-50 grayscale">📂</span>
                  No pending applications.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reject Prompt Modal -->
    <PromptModal 
      :isOpen="isPromptOpen"
      title="Reject Application"
      message="Please enter the reason for rejection:"
      confirmText="Reject Application"
      placeholder="e.g. Invalid ID provided"
      @confirm="confirmReject"
      @cancel="isPromptOpen = false"
    />

    <!-- Attachments Modal -->
    <Transition name="modal">
      <div v-if="selectedFiles" class="fixed inset-0 z-[1000] flex justify-center items-center py-10 px-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" @click="selectedFiles = null"></div>

        <div class="bg-white p-8 rounded-2xl w-full max-w-6xl shadow-2xl relative max-h-[90vh] overflow-y-auto transform transition-all">
          <div class="flex justify-between items-center border-b border-gray-200 pb-5 mb-6 sticky top-0 bg-white z-10">
            <div>
              <h2 class="m-0 text-gray-900 text-2xl font-bold tracking-tight">Application Review</h2>
              <p v-if="selectedFiles.isForOthers" class="text-purple-700 text-xs font-semibold mt-1 mb-0 flex items-center gap-1">
                👥 Requested by <b>{{ selectedFiles.applicantName }}</b> on behalf of <b>{{ selectedFiles.forPersonName }}</b>
              </p>
            </div>
            <button 
              @click="selectedFiles = null" 
              class="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100 transition-colors text-sm cursor-pointer shadow-sm"
            >
              Close Window
            </button>
          </div>
          <div class="flex gap-6 max-md:flex-col">
            
            <div class="flex-1 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h4 class="m-0 mb-3 text-gray-600 font-bold uppercase tracking-wide text-xs">1. Registered ID (Applicant)</h4>
              <div class="bg-white p-2 rounded-lg border border-gray-200 h-[380px] flex items-center justify-center relative overflow-hidden">
                <template v-if="selectedFiles.idImage">
                  <embed v-if="isPdf(selectedFiles.idImage)" :src="`http://localhost:5000/${selectedFiles.idImage}`" type="application/pdf" class="w-full h-full rounded" />
                  <img v-else :src="`http://localhost:5000/${selectedFiles.idImage}`" alt="ID" class="w-full h-full object-contain rounded" />
                  <a :href="`http://localhost:5000/${selectedFiles.idImage}`" target="_blank" rel="noreferrer" class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-brand-blue font-bold shadow-md border border-gray-100 hover:bg-white transition-colors text-xs text-center">
                    Open File ↗
                  </a>
                </template>
                <p v-else class="text-gray-400 italic m-0 text-sm">No ID provided.</p>
              </div>
            </div>
            
            <div class="flex-1 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h4 class="m-0 mb-3 text-gray-600 font-bold uppercase tracking-wide text-xs">2. Document Requirement</h4>
              <div class="bg-white p-2 rounded-lg border border-gray-200 h-[380px] flex items-center justify-center relative overflow-hidden">
                <template v-if="selectedFiles.reqFile">
                  <embed v-if="isPdf(selectedFiles.reqFile)" :src="`http://localhost:5000/${selectedFiles.reqFile}`" type="application/pdf" class="w-full h-full rounded" />
                  <img v-else :src="`http://localhost:5000/${selectedFiles.reqFile}`" alt="Req" class="w-full h-full object-contain rounded" />
                  
                  <a :href="`http://localhost:5000/${selectedFiles.reqFile}`" target="_blank" rel="noreferrer" class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-brand-blue font-bold shadow-md border border-gray-100 hover:bg-white transition-colors text-xs text-center">
                    Open File ↗
                  </a>
                </template>
                <p v-else class="text-gray-400 italic m-0 text-sm">No requirement file provided.</p>
              </div>
            </div>

            <div v-if="selectedFiles.isForOthers" class="flex-1 bg-purple-50/60 p-5 rounded-xl border border-purple-200">
              <h4 class="m-0 mb-3 text-purple-800 font-bold uppercase tracking-wide text-xs">3. Authorization / Proof</h4>
              <div class="bg-white p-2 rounded-lg border border-purple-200 h-[380px] flex items-center justify-center relative overflow-hidden">
                <template v-if="selectedFiles.authProof">
                  <embed v-if="isPdf(selectedFiles.authProof)" :src="`http://localhost:5000/${selectedFiles.authProof}`" type="application/pdf" class="w-full h-full rounded" />
                  <img v-else :src="`http://localhost:5000/${selectedFiles.authProof}`" alt="Auth Proof" class="w-full h-full object-contain rounded" />
                  
                  <a :href="`http://localhost:5000/${selectedFiles.authProof}`" target="_blank" rel="noreferrer" class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-purple-700 font-bold shadow-md border border-purple-100 hover:bg-white transition-colors text-xs text-center">
                    Open File ↗
                  </a>
                </template>
                <p v-else class="text-gray-400 italic m-0 text-sm">No authorization proof provided.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>

  </div>
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
.modal-enter-from .transform,
.modal-leave-to .transform {
  transform: scale(0.95);
  opacity: 0;
}
</style>
