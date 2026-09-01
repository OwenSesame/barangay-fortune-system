<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import AdminSidebar from '../components/AdminSidebar.vue'
import { useToast } from '../composables/useToast'

const toast = useToast()

const router = useRouter()
const pendingResidents = ref([])
const selectedIdImage = ref(null)
const badgeCounts = ref({ pending: 0, ready: 0, residentApprovals: 0 })
let interval = null

const fetchPendingResidents = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/pending-residents')
    pendingResidents.value = response.data
  } catch (error) {
    console.error("Failed to fetch pending residents", error)
  }
}

const fetchCounts = async () => {
  try {
    const [requestsRes, residentsRes] = await Promise.all([
      axios.get('http://localhost:5000/api/staff/pending-requests'),
      axios.get('http://localhost:5000/api/admin/pending-residents')
    ])
    const pending = requestsRes.data.filter(req => req.status === 'Pending').length
    const ready = requestsRes.data.filter(req => req.status === 'Ready to Print').length
    const residentApprovals = residentsRes.data.length
    badgeCounts.value = { pending, ready, residentApprovals }
  } catch (error) {
    console.error("Failed to fetch notification counts", error)
  }
}

onMounted(() => {
  fetchPendingResidents()
  fetchCounts()
  interval = setInterval(fetchCounts, 5000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const handleApprove = async (residentId) => {
  try {
    await axios.put(`http://localhost:5000/api/admin/approve-resident/${residentId}`)
    pendingResidents.value = pendingResidents.value.filter(r => r.resident_id !== residentId)
    toast.success("Resident approved successfully! An email notification has been sent.")
    fetchCounts()
  } catch (error) {
    console.error(error)
    toast.error("Error approving resident.")
  }
}

const handleReject = async (residentId) => {
  const reason = window.prompt("⚠️ REJECT REGISTRATION\nPlease enter the reason for rejection (e.g., Unclear ID, Suspected Duplicate):")
  if (!reason || reason.trim() === "") return

  try {
    await axios.put(`http://localhost:5000/api/admin/reject-resident/${residentId}`, { reason })
    pendingResidents.value = pendingResidents.value.filter(r => r.resident_id !== residentId)
    toast.success("Resident rejected. An email notification has been sent.")
    fetchCounts()
  } catch (error) {
    console.error(error)
    toast.error("Error rejecting resident.")
  }
}
</script>

<template>
  <div class="flex h-screen bg-brand-gray font-sans overflow-hidden">
    
    <AdminSidebar activeMenu="Resident Approvals" :badgeCounts="badgeCounts" />

    <div class="flex-1 p-8 overflow-y-auto">
      <div class="mb-8">
        <h1 class="m-0 text-gray-900 text-3xl font-bold">Resident Registration Approvals</h1>
        <p class="text-gray-500 mt-1">Review and verify resident accounts before they can access E-Services.</p>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b-2 border-gray-200 text-gray-500 text-xs uppercase font-bold tracking-wide">
              <th class="py-4 px-6">Name</th>
              <th class="py-4 px-6">Contact Details</th>
              <th class="py-4 px-6">Address</th>
              <th class="py-4 px-6">ID Proof</th>
              <th class="py-4 px-6 w-[220px]">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="resident in pendingResidents" :key="resident.resident_id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-4 px-6">
                <b class="text-gray-800 text-sm block">{{ resident.first_name }} {{ resident.last_name }}</b>
                <span class="text-[11px] text-gray-500 font-semibold block mt-1">DOB: {{ new Date(resident.date_of_birth).toLocaleDateString() }}</span>
              </td>
              <td class="py-4 px-6">
                <span class="block text-sm text-gray-800 mb-1">{{ resident.email_address }}</span>
                <span class="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">{{ resident.contact_number }}</span>
              </td>
              <td class="py-4 px-6 text-sm text-gray-700 leading-relaxed">{{ resident.addres_street }}</td>
              <td class="py-4 px-6">
                <button 
                  v-if="resident.id_proof_image" 
                  @click="selectedIdImage = resident.id_proof_image"
                  class="px-3 py-1.5 text-xs bg-white text-brand-blue border border-brand-blue rounded font-bold hover:bg-blue-50 transition-colors flex items-center gap-1"
                >
                  👁️ View ID
                </button>
                <span v-else class="text-xs text-gray-400 font-medium italic">No ID Uploaded</span>
              </td>
              <td class="py-4 px-6">
                <div class="flex gap-2">
                  <button 
                    @click="handleApprove(resident.resident_id)"
                    class="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded text-xs transition-colors shadow-sm"
                  >
                    Approve
                  </button>
                  <button 
                    @click="handleReject(resident.resident_id)"
                    class="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded text-xs transition-colors shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="pendingResidents.length === 0">
              <td colspan="5" class="p-12 text-center text-gray-400 text-sm font-medium">No pending resident registrations.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ID Proof Modal -->
    <div v-if="selectedIdImage" class="fixed inset-0 bg-black/85 flex justify-center items-center z-[1000]">
      <div class="bg-white p-6 rounded-xl w-[90%] max-w-4xl shadow-2xl">
        <div class="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
          <h2 class="m-0 text-gray-900 text-xl font-bold">Resident ID Proof</h2>
          <button 
            @click="selectedIdImage = null"
            class="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100 transition-colors text-sm"
          >
            Close Window
          </button>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center">
          <img 
            :src="`http://localhost:5000/${selectedIdImage}`" 
            alt="ID Proof" 
            class="w-full max-h-[600px] object-contain bg-white border border-gray-300 rounded shadow-sm"
          />
        </div>
      </div>
    </div>

  </div>
</template>
